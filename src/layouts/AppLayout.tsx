import { NavLink, Outlet } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import { useRealtimeConnection } from '@/context/RealtimeContext';
import { Button } from '@/components';

const NAV_ITEMS = [
  { to: '/map', label: 'Mapa' },
  { to: '/booking', label: 'Agenda' },
  { to: '/service', label: 'Mi servicio' },
];

export function AppLayout() {
  const { session, signOut } = useSession();
  const { isOnline, isRecovering } = useRealtimeConnection();

  return (
    <div className="app-layout">
      <header className="app-layout__header">
        <span className="app-layout__brand">Barbería</span>

        <nav className="app-layout__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-layout__session">
          <span
            className={`status-dot status-dot--${isOnline ? 'online' : isRecovering ? 'recovering' : 'offline'}`}
            title={isOnline ? 'Conectado' : isRecovering ? 'Reconectando…' : 'Sin conexión'}
            aria-live="polite"
          />
          {session ? <span className="app-layout__user">{session.user.name}</span> : null}
          <Button variant="ghost" onClick={signOut}>
            Salir
          </Button>
        </div>
      </header>

      {!isOnline ? (
        <div className="app-layout__banner" role="status">
          {isRecovering
            ? 'Reconectando con el servidor… los datos pueden estar desactualizados.'
            : 'Sin conexión en tiempo real.'}
        </div>
      ) : null}

      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
