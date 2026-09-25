import { useCallback, useEffect, useState } from 'react';
import { RealtimeEvent, useRealtime } from '@/lib/realtime';
import { useRealtimeConnection } from '@/context';
import { fetchService, type ServiceDetail } from '../services';

/**
 * 6.1 + 6.2 + 6.4 — Estado del servicio en tiempo real.
 *
 * El WS manda mientras hay conexión. Al reconectar se resincroniza por REST,
 * porque los cambios ocurridos durante el corte nunca llegaron.
 */
export function useServiceStatus(bookingId: string) {
  const { isOnline, isRecovering } = useRealtimeConnection();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    try {
      setService(await fetchService(bookingId));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el servicio');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    setLoading(true);
    void sync();
  }, [sync]);

  // 6.4 — resincronización tras recuperar la conexión.
  useEffect(() => {
    if (isOnline) void sync();
  }, [isOnline, sync]);

  useRealtime(RealtimeEvent.ServiceStatusChanged, (payload) => {
    if (payload.bookingId !== bookingId) return;
    setService((current) =>
      current
        ? {
            ...current,
            status: payload.status,
            history: [
              ...current.history,
              { status: payload.status, changedAt: payload.changedAt, note: payload.note },
            ],
          }
        : current,
    );
  });

  return { service, loading, error, isStale: !isOnline, isRecovering, refresh: sync };
}
