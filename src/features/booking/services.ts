import { apiClient } from '@/lib/api-client';

export interface Slot {
  /** ISO 8601, inicio del slot. */
  start: string;
  durationMinutes: number;
  available: boolean;
  /** Bloqueado temporalmente por otro usuario (5.2). */
  lockedBy?: string | null;
}

export interface DaySchedule {
  barberId: string;
  /** YYYY-MM-DD */
  date: string;
  slots: Slot[];
}

export interface Booking {
  id: string;
  barberId: string;
  customerId: string;
  slotStart: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

export function fetchSchedule(barberId: string, date: string): Promise<DaySchedule> {
  return apiClient.get<DaySchedule>(`/booking/barbers/${barberId}/schedule`, { query: { date } });
}

/**
 * 5.2 — Reserva optimista de slot antes de confirmar.
 * Lanza ApiError 409 si otro usuario llegó primero.
 */
export function lockSlot(barberId: string, slotStart: string): Promise<{ expiresAt: string }> {
  return apiClient.post<{ expiresAt: string }>('/booking/locks', { barberId, slotStart });
}

export function releaseSlot(barberId: string, slotStart: string): Promise<void> {
  return apiClient.delete<void>('/booking/locks', { query: { barberId, slotStart } });
}

/** 5.3 — Confirmación. También puede fallar con 409. */
export function createBooking(barberId: string, slotStart: string): Promise<Booking> {
  return apiClient.post<Booking>('/booking', { barberId, slotStart });
}

export function cancelBooking(bookingId: string): Promise<void> {
  return apiClient.delete<void>(`/booking/${bookingId}`);
}
