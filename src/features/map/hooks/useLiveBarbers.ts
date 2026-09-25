import { useCallback, useEffect, useState } from 'react';
import { RealtimeEvent, useRealtime } from '@/lib/realtime';
import { fetchBarberPositions, type BarberPosition } from '../services';

/**
 * 4.1 — Posiciones en vivo.
 *
 * Patrón snapshot + deltas: REST da el estado inicial, el WS lo mantiene
 * al día. Al reconectar se vuelve a pedir el snapshot, porque los eventos
 * perdidos durante el corte no se recuperan.
 */
export function useLiveBarbers() {
  const [positions, setPositions] = useState<Map<string, BarberPosition>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const barbers = await fetchBarberPositions();
      setPositions(new Map(barbers.map((barber) => [barber.barberId, barber])));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el mapa');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useRealtime(RealtimeEvent.BarberLocationUpdated, (payload) => {
    setPositions((current) => {
      const previous = current.get(payload.barberId);
      const next = new Map(current);
      next.set(payload.barberId, {
        barberId: payload.barberId,
        name: previous?.name ?? payload.barberId,
        lat: payload.lat,
        lng: payload.lng,
        heading: payload.heading,
        updatedAt: payload.updatedAt,
      });
      return next;
    });
  });

  return {
    barbers: [...positions.values()],
    loading,
    error,
    refresh: loadSnapshot,
  };
}
