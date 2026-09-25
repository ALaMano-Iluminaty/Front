import { apiClient } from '@/lib/api-client';
import type { GeoPoint } from '@/lib/realtime';

export interface BarberPosition extends GeoPoint {
  barberId: string;
  name: string;
  heading?: number;
  updatedAt: string;
}

/** Snapshot inicial: el WS solo trae deltas a partir de aquí. */
export function fetchBarberPositions(): Promise<BarberPosition[]> {
  return apiClient.get<BarberPosition[]>('/tracking/barbers');
}

export function fetchBarberPosition(barberId: string): Promise<BarberPosition> {
  return apiClient.get<BarberPosition>(`/tracking/barbers/${barberId}`);
}
