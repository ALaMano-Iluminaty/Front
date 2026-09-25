/**
 * Contrato de eventos que el broker publica hacia el frontend a través del
 * WS Gateway. Un solo sitio donde mirar cuando el backend cambia el contrato.
 */

export const RealtimeEvent = {
  /** 4.1 — posición del barbero / técnico en ruta. */
  BarberLocationUpdated: 'barber.location.updated',

  /** 5.2 — otro usuario bloqueó un slot mientras lo estabas mirando. */
  BookingSlotLocked: 'booking.slot.locked',
  BookingSlotReleased: 'booking.slot.released',

  /** 5.1 / 5.3 — la agenda cambió. */
  BookingCreated: 'booking.created',
  BookingCancelled: 'booking.cancelled',

  /** 6.1 / 6.2 — el servicio en curso cambió de estado. */
  ServiceStatusChanged: 'service.status.changed',
} as const;

export type RealtimeEventName = (typeof RealtimeEvent)[keyof typeof RealtimeEvent];

export type ServiceStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BarberLocationUpdatedPayload extends GeoPoint {
  barberId: string;
  /** Grados, 0 = norte. Opcional: el backend puede no calcularlo. */
  heading?: number;
  /** ISO 8601. */
  updatedAt: string;
}

export interface BookingSlotLockPayload {
  barberId: string;
  /** ISO 8601, inicio del slot. */
  slotStart: string;
  /** Quién lo bloqueó, para no reaccionar a tu propio bloqueo. */
  lockedBy: string;
  /** ISO 8601, cuándo expira el bloqueo. */
  expiresAt?: string;
}

export interface BookingChangedPayload {
  bookingId: string;
  barberId: string;
  slotStart: string;
  customerId: string;
}

export interface ServiceStatusChangedPayload {
  bookingId: string;
  status: ServiceStatus;
  changedAt: string;
  note?: string;
}

/** Mapa evento -> payload. Da tipado a `useRealtime`. */
export interface RealtimeEventPayloads {
  [RealtimeEvent.BarberLocationUpdated]: BarberLocationUpdatedPayload;
  [RealtimeEvent.BookingSlotLocked]: BookingSlotLockPayload;
  [RealtimeEvent.BookingSlotReleased]: BookingSlotLockPayload;
  [RealtimeEvent.BookingCreated]: BookingChangedPayload;
  [RealtimeEvent.BookingCancelled]: BookingChangedPayload;
  [RealtimeEvent.ServiceStatusChanged]: ServiceStatusChangedPayload;
}

/** Sobre que envuelve todo mensaje del gateway. */
export interface RealtimeEnvelope<E extends RealtimeEventName = RealtimeEventName> {
  event: E;
  data: RealtimeEventPayloads[E];
  /** ISO 8601, emitido por el broker. */
  emittedAt?: string;
}

export function isRealtimeEnvelope(value: unknown): value is RealtimeEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.event === 'string' && 'data' in candidate;
}
