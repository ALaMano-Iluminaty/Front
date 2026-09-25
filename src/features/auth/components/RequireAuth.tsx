import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '@/context';

/** Guarda de ruta: manda al login conservando a dónde quería ir. */
export function RequireAuth() {
  const { isAuthenticated } = useSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
