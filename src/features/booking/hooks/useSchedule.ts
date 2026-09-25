import { useCallback, useEffect, useState } from 'react';
import { RealtimeEvent, useRealtime } from '@/lib/realtime';
import { useSession } from '@/context';
import { fetchSchedule, type Slot } from '../services';

/**
 * 5.1 + 5.2 — Agenda de un día, viva.
 *
 * Los eventos del broker reescriben la disponibilidad sin recargar: si otro
 * usuario bloquea o reserva un slot, aquí se ve al momento.
 */
export function useSchedule(barberId: string, date: string) {
  const { session } = useSession();
  const myId = session?.user.id;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const schedule = await fetchSchedule(barberId, date);
      setSlots(schedule.slots);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, [barberId, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchSlot = useCallback((slotStart: string, patch: Partial<Slot>) => {
    setSlots((current) =>
      current.map((slot) => (slot.start === slotStart ? { ...slot, ...patch } : slot)),
    );
  }, []);

  useRealtime(RealtimeEvent.BookingSlotLocked, (payload) => {
    if (payload.barberId !== barberId) return;
    // El bloqueo propio ya está reflejado de forma optimista.
    if (payload.lockedBy === myId) return;
    patchSlot(payload.slotStart, { lockedBy: payload.lockedBy, available: false });
  });

  useRealtime(RealtimeEvent.BookingSlotReleased, (payload) => {
    if (payload.barberId !== barberId) return;
    patchSlot(payload.slotStart, { lockedBy: null, available: true });
  });

  useRealtime(RealtimeEvent.BookingCreated, (payload) => {
    if (payload.barberId !== barberId) return;
    patchSlot(payload.slotStart, { available: false, lockedBy: null });
  });

  useRealtime(RealtimeEvent.BookingCancelled, (payload) => {
    if (payload.barberId !== barberId) return;
    patchSlot(payload.slotStart, { available: true, lockedBy: null });
  });

  return { slots, loading, error, reload: load, patchSlot };
}
