import { apiClient } from '@/lib/api-client';
import { USE_MOCKS } from '@/lib/mock';
import { mockCreatePromo, mockMyPromos } from './mocks';

export interface MyPromo {
  promoId: string;
  vendorId: string;
  title: string;
  description: string;
  remaining: number;
  total: number;
  createdAt: string;
}

export interface NewPromo {
  title: string;
  description: string;
  totalSlots: number;
}

/** Radio en el que los clientes ven al barbero, en metros. Solo visual. */
export const COVERAGE_RADIUS_M = 3_000;

export function fetchMyPromos(vendorId: string): Promise<MyPromo[]> {
  if (USE_MOCKS) return mockMyPromos(vendorId);
  return apiClient.get<MyPromo[]>('/seller/promotions');
}

export function createPromo(vendorId: string, promo: NewPromo): Promise<MyPromo> {
  if (USE_MOCKS) return mockCreatePromo(vendorId, promo);
  return apiClient.post<MyPromo>('/seller/promotions', promo);
}
