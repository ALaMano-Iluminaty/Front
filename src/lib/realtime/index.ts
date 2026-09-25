export { realtimeSocket } from './socket';
export type { ConnectionStatus } from './socket';
export { useRealtime, useConnectionStatus } from './useRealtime';
export { RealtimeEvent, isRealtimeEnvelope } from './events';
export type {
  RealtimeEventName,
  RealtimeEventPayloads,
  RealtimeEnvelope,
  ServiceStatus,
  GeoPoint,
  BarberLocationUpdatedPayload,
  BookingSlotLockPayload,
  BookingChangedPayload,
  ServiceStatusChangedPayload,
} from './events';
