import type { Session } from '@/context';

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Login mock con token dummy.
 *
 * Cuando el gateway exponga /auth/login, sustituir el cuerpo por:
 *   return apiClient.post<Session>('/auth/login', payload);
 * Nada más de la app cambia.
 */
export async function login(payload: LoginPayload): Promise<Session> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!payload.email.includes('@') || payload.password.length < 4) {
    throw new Error('Credenciales inválidas');
  }

  return {
    token: `dummy.${btoa(payload.email)}.token`,
    user: {
      id: 'user-1',
      name: payload.email.split('@')[0],
      email: payload.email,
      role: 'CUSTOMER',
    },
  };
}
