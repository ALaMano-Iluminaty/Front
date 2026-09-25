import { ScreenPlaceholder } from '@/components';

interface SellerServiceScreenProps {
  serviceId: string;
}

export function SellerServiceScreen({ serviceId }: SellerServiceScreenProps) {
  return <ScreenPlaceholder title={`Servicio activo · ${serviceId}`} branch="feature/seller-service" />;
}
