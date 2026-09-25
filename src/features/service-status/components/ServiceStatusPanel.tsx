import type { ServiceStatus } from '@/lib/realtime';
import { formatTime } from '@/utils';
import { Button } from '@/components';
import { useServiceStatus } from '../hooks/useServiceStatus';
import { ConnectionBanner } from './ConnectionBanner';

const STATUS_LABEL: Record<ServiceStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  ON_THE_WAY: 'En camino',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

/** Orden del avance, para pintar la barra de progreso. */
const FLOW: ServiceStatus[] = ['CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];

interface ServiceStatusPanelProps {
  bookingId: string;
}

export function ServiceStatusPanel({ bookingId }: ServiceStatusPanelProps) {
  const { service, loading, error, isStale, isRecovering, refresh } = useServiceStatus(bookingId);

  if (loading) return <p className="service__loading">Cargando servicio…</p>;

  if (error || !service) {
    return (
      <div className="panel panel--error">
        <p>{error ?? 'Servicio no encontrado'}</p>
        <Button variant="secondary" onClick={() => void refresh()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const currentStep = FLOW.indexOf(service.status);

  return (
    <section className="service">
      <ConnectionBanner isStale={isStale} isRecovering={isRecovering} onRetry={refresh} />

      <header className="service__header">
        <h2>{service.barberName}</h2>
        <span className={`badge badge--${service.status.toLowerCase()}`}>
          {STATUS_LABEL[service.status]}
        </span>
      </header>

      <ol className="service__flow">
        {FLOW.map((step, index) => (
          <li
            key={step}
            className={`service__step ${index <= currentStep ? 'service__step--done' : ''}`}
          >
            {STATUS_LABEL[step]}
          </li>
        ))}
      </ol>

      <h3 className="service__history-title">Historial</h3>
      <ul className="service__history">
        {service.history.map((entry) => (
          <li key={`${entry.status}-${entry.changedAt}`}>
            <time dateTime={entry.changedAt}>{formatTime(entry.changedAt)}</time>
            <span>{STATUS_LABEL[entry.status]}</span>
            {entry.note ? <em>{entry.note}</em> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
