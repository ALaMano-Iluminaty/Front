import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppLayout, AuthLayout } from '@/layouts';
import { LoginForm, RequireAuth } from '@/features/auth';
import { LiveMap } from '@/features/map';
import { BookingAgenda } from '@/features/booking';
import { ServiceStatusPanel } from '@/features/service-status';

function ServiceRoute() {
  const { bookingId } = useParams<{ bookingId: string }>();
  if (!bookingId) return <Navigate to="/booking" replace />;
  return <ServiceStatusPanel bookingId={bookingId} />;
}

export function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginForm />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/map" element={<LiveMap />} />
          <Route path="/booking" element={<BookingAgenda />} />
          <Route path="/service/:bookingId" element={<ServiceRoute />} />
          <Route path="/service" element={<Navigate to="/booking" replace />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/booking" replace />} />
      <Route path="*" element={<Navigate to="/booking" replace />} />
    </Routes>
  );
}
