import { Button } from '@/components';

interface ConnectionBannerProps {
  isStale: boolean;
  isRecovering: boolean;
  onRetry: () => void;
}

/** 6.4 — feedback explícito de que lo que se ve puede estar desactualizado. */
export function ConnectionBanner({ isStale, isRecovering, onRetry }: ConnectionBannerProps) {
  if (!isStale) return null;

  return (
    <div className="connection-banner" role="status" aria-live="polite">
      <span>
        {isRecovering
          ? 'Reconectando… el estado puede estar desactualizado.'
          : 'Sin conexión en tiempo real.'}
      </span>
      <Button variant="ghost" onClick={onRetry}>
        Actualizar ahora
      </Button>
    </div>
  );
}
