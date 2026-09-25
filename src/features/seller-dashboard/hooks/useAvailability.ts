import { useCallback, useEffect, useRef, useState } from 'react';
import { useBeforeSignOut } from '@/context';
import { useWatchPosition, type GeoPoint } from '@/lib/geo';
import { USE_MOCKS } from '@/lib/mock';
import { ClientEvent, realtimeSocket } from '@/lib/realtime';
import { startOnlineSimulation } from '../mocks';

/**
 * El GPS puede disparar varias lecturas por segundo; con una cada 2 s el
 * mapa del cliente se ve fluido (interpola) y no se inunda el socket.
 */
const MIN_EMIT_INTERVAL_MS = 2_000;

/**
 * Quieto, el GPS no emite lecturas nuevas: se reenvía la última posición
 * para que el servidor no lo tome por desconectado.
 */
const KEEPALIVE_MS = 10_000;

function announceOffline(): void {
  realtimeSocket.emit(ClientEvent.VendorOffline, { at: new Date().toISOString() });
}

/**
 * 2.2 — Disponibilidad del barbero.
 *
 * En línea: `watchPosition` activo y cada posición sale por WebSocket.
 * Desconectado: `clearWatch` (lo hace useWatchPosition al pasar a false) y
 * VENDOR_OFFLINE, para desaparecer del mapa de los clientes al instante en
 * vez de esperar a que el servidor note el silencio.
 */
export function useAvailability() {
  const [online, setOnline] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const lastEmit = useRef(0);

  const onlineRef = useRef(online);
  onlineRef.current = online;

  const emitPosition = useCallback((point: GeoPoint) => {
    const now = Date.now();
    lastEmit.current = now;
    const updatedAt = new Date(now).toISOString();
    realtimeSocket.emit(ClientEvent.VendorLocationUpdate, { ...point, updatedAt });
    setLastSentAt(updatedAt);
  }, []);

  const { status: gpsStatus, position } = useWatchPosition(online, (point) => {
    if (Date.now() - lastEmit.current < MIN_EMIT_INTERVAL_MS) return;
    emitPosition(point);
  });

  const positionRef = useRef<GeoPoint | null>(position);
  positionRef.current = position;
  // Tras reconectarse, la última posición guardada es de la sesión anterior:
  // no se reenvía hasta que el GPS dé una lectura nueva ('active').
  const gpsActiveRef = useRef(false);
  gpsActiveRef.current = gpsStatus === 'active';

  useEffect(() => {
    if (!online) return;
    const timer = setInterval(() => {
      const point = positionRef.current;
      if (point && gpsActiveRef.current && Date.now() - lastEmit.current >= KEEPALIVE_MS) emitPosition(point);
    }, 1_000);
    return () => clearInterval(timer);
  }, [online, emitPosition]);

  const goOnline = useCallback(() => {
    setGpsError(null);
    lastEmit.current = 0;
    setOnline(true);
  }, []);

  const goOffline = useCallback(() => {
    if (!onlineRef.current) return;
    announceOffline();
    setOnline(false);
    setLastSentAt(null);
  }, []);

  // Sin GPS no hay forma de aparecer en el mapa: se vuelve a desconectado y se explica.
  useEffect(() => {
    if (!online) return;
    if (gpsStatus === 'denied' || gpsStatus === 'unavailable') {
      setGpsError(
        gpsStatus === 'denied'
          ? 'Sin permiso de ubicación no puedes aparecer en el mapa. Actívalo en el navegador.'
          : 'No hay señal de GPS en este dispositivo.',
      );
      goOffline();
    }
  }, [online, gpsStatus, goOffline]);

  // Cerrar sesión, salir de la pantalla o cerrar la pestaña también desconectan.
  useBeforeSignOut(() => {
    if (onlineRef.current) announceOffline();
  });

  useEffect(() => {
    if (!online) return;
    window.addEventListener('pagehide', announceOffline);
    return () => window.removeEventListener('pagehide', announceOffline);
  }, [online]);

  useEffect(
    () => () => {
      if (onlineRef.current) announceOffline();
    },
    [],
  );

  useEffect(() => {
    if (!online || !USE_MOCKS) return;
    return startOnlineSimulation(() => positionRef.current);
  }, [online]);

  return {
    online,
    toggle: online ? goOffline : goOnline,
    gpsStatus,
    gpsError,
    position,
    lastSentAt,
  };
}
