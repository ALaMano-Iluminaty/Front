import { USE_MOCKS } from '@/lib/mock';
import {
  isRealtimeEnvelope,
  type RealtimeEnvelope,
  type RealtimeEventName,
  type RealtimeEventPayloads,
} from './events';

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

type Listener<E extends RealtimeEventName> = (payload: RealtimeEventPayloads[E]) => void;
type StatusListener = (status: ConnectionStatus) => void;

const WS_URL = import.meta.env.VITE_WS_GATEWAY_URL ?? 'ws://localhost:8080/ws';

/** 6.4 — backoff exponencial con jitter para no martillar al gateway. */
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 25_000;

/**
 * Única instancia de WebSocket de la app.
 *
 * Toda la app habla con el broker a través de aquí: nadie más crea un
 * `new WebSocket`. Si el backend pasa a Socket.IO, este archivo es lo único
 * que cambia — `useRealtime` y las features no se enteran.
 */
class RealtimeSocket {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private status: ConnectionStatus = 'idle';
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  /** Cierre pedido por nosotros: no reconectar. */
  private intentionallyClosed = false;

  private readonly listeners = new Map<string, Set<Listener<RealtimeEventName>>>();
  private readonly statusListeners = new Set<StatusListener>();

  connect(token: string | null): void {
    this.token = token;
    this.intentionallyClosed = false;

    // En modo demo no hay gateway: el socket se da por abierto y los eventos
    // los inyectan los mocks con `dispatch`.
    if (USE_MOCKS) {
      this.setStatus('open');
      return;
    }

    const readyState = this.socket?.readyState;
    if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) return;

    this.setStatus(this.attempt === 0 ? 'connecting' : 'reconnecting');
    this.open();
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.clearTimers();
    this.attempt = 0;
    this.socket?.close(1000, 'client disconnect');
    this.socket = null;
    this.setStatus('closed');
  }

  /** Suscribe a un evento. Devuelve la función para desuscribirse. */
  on<E extends RealtimeEventName>(event: E, listener: Listener<E>): () => void {
    const set = this.listeners.get(event) ?? new Set<Listener<RealtimeEventName>>();
    set.add(listener as Listener<RealtimeEventName>);
    this.listeners.set(event, set);
    return () => {
      set.delete(listener as Listener<RealtimeEventName>);
      if (set.size === 0) this.listeners.delete(event);
    };
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  /** Envía un mensaje al gateway (ej. unirse a la sala de un booking). */
  emit(event: string, data: unknown): void {
    if (USE_MOCKS) return;
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.warn('[realtime] socket cerrado, se descarta el envío de:', event);
      return;
    }
    this.socket.send(JSON.stringify({ event, data }));
  }

  private open(): void {
    // El token va en la query: el navegador no permite cabeceras en WebSocket.
    const url = new URL(WS_URL);
    if (this.token) url.searchParams.set('token', this.token);

    const socket = new WebSocket(url.toString());
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.setStatus('open');
      this.startHeartbeat();
    };

    socket.onmessage = (raw) => this.handleMessage(raw.data);

    socket.onerror = () => {
      // onclose llega siempre después: la reconexión se gestiona allí.
      console.warn('[realtime] error de socket');
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      this.socket = null;
      if (this.intentionallyClosed) {
        this.setStatus('closed');
        return;
      }
      this.scheduleReconnect();
    };
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== 'string') return;
    if (raw === 'pong') return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[realtime] mensaje no-JSON descartado');
      return;
    }

    if (!isRealtimeEnvelope(parsed)) {
      console.warn('[realtime] mensaje sin forma de evento descartado');
      return;
    }

    const envelope = parsed as RealtimeEnvelope;
    this.dispatch(envelope.event, envelope.data);
  }

  /**
   * Entrega un evento a los listeners como si viniera del broker.
   * Fuera de este archivo solo lo usan los mocks.
   */
  dispatch<E extends RealtimeEventName>(event: E, data: RealtimeEventPayloads[E]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        // Un listener roto no puede tumbar a los demás.
        console.error('[realtime] listener falló para:', event, error);
      }
    }
  }

  private scheduleReconnect(): void {
    this.setStatus('reconnecting');
    const exponential = Math.min(BASE_DELAY_MS * 2 ** this.attempt, MAX_DELAY_MS);
    // Jitter: la mitad fija, la mitad aleatoria.
    const delay = exponential / 2 + Math.random() * (exponential / 2);
    this.attempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intentionallyClosed) this.open();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) this.socket.send('ping');
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private clearTimers(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.stopHeartbeat();
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }
}

export const realtimeSocket = new RealtimeSocket();
