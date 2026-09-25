import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/context';
import { login, type LoginPayload } from '../services';

export function useLogin() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      setError(null);
      try {
        const session = await login(payload);
        signIn(session);
        navigate('/booking', { replace: true });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo iniciar sesión');
      } finally {
        setLoading(false);
      }
    },
    [signIn, navigate],
  );

  return { submit, loading, error };
}
