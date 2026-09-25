import { ScreenPlaceholder } from '@/components';

interface TrackingScreenProps {
  serviceId: string;
}

export function TrackingScreen({ serviceId }: TrackingScreenProps) {
  return <ScreenPlaceholder title={`Tu barbero en camino · ${serviceId}`} branch="feature/client-tracking" />;
}
