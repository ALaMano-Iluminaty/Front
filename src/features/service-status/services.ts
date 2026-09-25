import { apiClient } from '@/lib/api-client';
import type { ServiceStatus } from '@/lib/realtime';

export interface ServiceStatusEntry {
  status: ServiceStatus;
  changedAt: string;
  note?: string;
}

export interface ServiceDetail {
  bookingId: string;
  barberId: string;
  barberName: string;
  status: ServiceStatus;
  slotStart: string;
  /** 6.2 — histórico, para pintar la línea de tiempo. */
  history: ServiceStatusEntry[];
}

export function fetchService(bookingId: string): Promise<ServiceDetail> {
  return apiClient.get<ServiceDetail>(`/services/${bookingId}`);
}

export function fetchActiveService(): Promise<ServiceDetail | null> {
  return apiClient.get<ServiceDetail | null>('/services/active');
}
