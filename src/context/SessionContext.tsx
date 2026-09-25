import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { configureApiClient } from '@/lib/api-client';
import { readStorage, removeStorage, writeStorage } from '@/utils';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
}

export interface Session {
  token: string;
  user: SessionUser;
}

interface SessionContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const STORAGE_KEY = 'barberia.session';

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    readStorage<Session | null>(STORAGE_KEY, null),
  );

  const signIn = useCallback((next: Session) => {
    writeStorage(STORAGE_KEY, next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    removeStorage(STORAGE_KEY);
    setSession(null);
  }, []);

  // El cliente REST lee el token de aquí en vez de tocar localStorage.
  // Se registra en render (no en efecto) para que la primera petición de un
  // hijo ya salga autenticada.
  configureApiClient({
    getToken: () => session?.token ?? null,
    onUnauthorized: signOut,
  });

  const value = useMemo<SessionContextValue>(
    () => ({ session, isAuthenticated: session !== null, signIn, signOut }),
    [session, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return context;
}
