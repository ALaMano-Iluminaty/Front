import type { Session } from '@/context';

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Login mock con token dummy.
 *
 * El rol se deduce del correo mientras no haya backend: un correo que empiece
 * por "barbero" entra como vendedor. Cuando el gateway exponga /auth/login,
 * sustituir el cuerpo por:
 *   return apiClient.post<Session>('/auth/login', payload);
 */
export async function login(payload: LoginPayload): Promise<Session> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!payload.email.includes('@') || payload.password.length < 4) {
    throw new Error('Credenciales inválidas');
  }

  const isSeller = payload.email.toLowerCase().startsWith('barbero');

  return {
    token: `dummy.${btoa(payload.email)}.token`,
    user: {
      id: isSeller ? 'vendor-demo' : 'user-demo',
      name: payload.email.split('@')[0],
      email: payload.email,
      role: isSeller ? 'SELLER' : 'CUSTOMER',
    },
  };
}
