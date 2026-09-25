import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { createBooking, lockSlot, releaseSlot, type Booking, type Slot } from '../services';

type ReservationState = 'idle' | 'locking' | 'locked' | 'confirming' | 'confirmed' | 'conflict';

/**
 * 5.2 + 5.3 — Flujo de reserva con concurrencia.
 *
 * lock -> confirmar (o soltar). El 409 en cualquiera de los dos pasos
 * significa que otro usuario ganó la carrera: se avisa y se recarga.
 */
export function useSlotReservation(barberId: string, onScheduleChanged: () => void) {
  const [state, setState] = useState<ReservationState>('idle');
  const [selected, setSelected] = useState<Slot | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Para soltar el lock al desmontar sin meter `selected` en las deps.
  const heldRef = useRef<string | null>(null);

  const release = useCallback(async () => {
    const held = heldRef.current;
    heldRef.current = null;
    setSelected(null);
    setState('idle');
    setError(null);
    if (held) {
      try {
        await releaseSlot(barberId, held);
      } catch {
        // El lock caduca solo en el backend: no hay nada que hacer aquí.
      }
    }
  }, [barberId]);

  const select = useCallback(
    async (slot: Slot) => {
      setSelected(slot);
      setState('locking');
      setError(null);
      try {
        await lockSlot(barberId, slot.start);
        heldRef.current = slot.start;
        setState('locked');
      } catch (caught) {
        if (caught instanceof ApiError && caught.isConflict) {
          setState('conflict');
          setError('Otro cliente acaba de tomar ese horario.');
          onScheduleChanged();
          return;
        }
        setState('idle');
        setSelected(null);
        setError(caught instanceof Error ? caught.message : 'No se pudo reservar el horario');
      }
    },
    [barberId, onScheduleChanged],
  );

  const confirm = useCallback(async () => {
    if (!selected) return;
    setState('confirming');
    try {
      const created = await createBooking(barberId, selected.start);
      heldRef.current = null;
      setBooking(created);
      setState('confirmed');
    } catch (caught) {
      if (caught instanceof ApiError && caught.isConflict) {
        heldRef.current = null;
        setState('conflict');
        setError('El horario dejó de estar disponible mientras confirmabas.');
        onScheduleChanged();
        return;
      }
      setState('locked');
      setError(caught instanceof Error ? caught.message : 'No se pudo confirmar la cita');
    }
  }, [barberId, selected, onScheduleChanged]);

  // Si el usuario se va con un lock abierto, se suelta.
  useEffect(() => {
    return () => {
      const held = heldRef.current;
      if (held) void releaseSlot(barberId, held).catch(() => undefined);
    };
  }, [barberId]);

  return { state, selected, booking, error, select, confirm, release };
}
