import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatRelative } from '@/utils';
import { useRealtimeConnection } from '@/context';
import { useLiveBarbers } from '../hooks/useLiveBarbers';
import type { BarberPosition } from '../services';

// Leaflet resuelve los iconos por URL relativa y Vite no los empaqueta:
// se define el icono a mano para no romper el build de producción.
const barberIcon = L.divIcon({
  className: 'barber-marker',
  html: '<span class="barber-marker__dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const DEFAULT_CENTER: [number, number] = [40.4168, -3.7038];

/** Reenfoca el mapa cuando llega el primer barbero, no en cada update. */
function FitToFirst({ barbers }: { barbers: BarberPosition[] }) {
  const map = useMap();
  const first = barbers[0];

  useEffect(() => {
    if (first) map.setView([first.lat, first.lng], 14);
    // Solo al aparecer el primero: si no, el mapa pelearía con el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first?.barberId]);

  return null;
}

export function LiveMap() {
  const { barbers, loading, error, refresh } = useLiveBarbers();
  const { isOnline } = useRealtimeConnection();

  // Al recuperar la conexión, los eventos del corte se perdieron:
  // se vuelve a pedir el snapshot.
  useEffect(() => {
    if (isOnline) void refresh();
  }, [isOnline, refresh]);

  if (error) {
    return (
      <div className="panel panel--error">
        <p>{error}</p>
        <button type="button" onClick={() => void refresh()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <section className="live-map">
      <header className="live-map__header">
        <h2>Barberos en ruta</h2>
        <span className="live-map__count">
          {loading ? 'Cargando…' : `${barbers.length} en servicio`}
        </span>
      </header>

      <MapContainer center={DEFAULT_CENTER} zoom={12} className="live-map__canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToFirst barbers={barbers} />
        {barbers.map((barber) => (
          <Marker key={barber.barberId} position={[barber.lat, barber.lng]} icon={barberIcon}>
            <Popup>
              <strong>{barber.name}</strong>
              <br />
              Actualizado {formatRelative(barber.updatedAt)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
}
