# Barbería — Frontend

React + TypeScript + Vite. Consume el **API Gateway** por REST y recibe eventos del **broker** por WebSocket.
Mapas con Leaflet (teselas CartoDB sobre OpenStreetMap, sin API key).

## Arranque

```bash
npm install
cp .env.example .env    # ajustar las URLs; VITE_USE_MOCKS=true para ver todo sin backend
npm run dev
```

| Script             | Qué hace                                  |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Servidor de desarrollo en `:5173`         |
| `npm run build`    | Typecheck + build de producción a `dist/` |
| `npm run lint`     | ESLint, sin warnings permitidos           |
| `npm run typecheck`| Solo TypeScript                           |
| `npm run format`   | Prettier sobre `src/`                     |

Variables de entorno (`.env.example`):

- `VITE_API_GATEWAY_URL` — base REST, ej. `http://localhost:8080/api`
- `VITE_WS_GATEWAY_URL` — WS del gateway, ej. `ws://localhost:8080/ws`
- `VITE_USE_MOCKS` — `true` simula datos y eventos en el navegador (ver [Modo demo](#modo-demo))

## Pantallas del MVP

| Ruta                          | Rol      | Épica / feature        | Carpeta                      |
| ----------------------------- | -------- | ---------------------- | ---------------------------- |
| `/login`, `/register`         | —        | 1.1                    | `features/auth`              |
| `/map`                        | Cliente  | 2.1 · 4.2              | `features/client-map`        |
| `/seller/dashboard`           | Barbero  | 2.2 · 4.2              | `features/seller-dashboard`  |
| `/tracking/:serviceId`        | Cliente  | 3.1                    | `features/tracking`          |
| `/seller/service/:serviceId`  | Barbero  | 3.2                    | `features/seller-service`    |

Las rutas se protegen por rol (`<RequireAuth role="…">`): un usuario con otro rol vuelve a su inicio.

## Estructura

```
src/
├── components/      Solo genérico (Button, Input, Modal, Sheet, BarberPole, Toast…)
├── layouts/         AppLayout (autenticado) · AuthLayout (login/registro)
├── lib/
│   ├── api-client/  Cliente REST hacia el gateway
│   ├── realtime/    Todo el WebSocket vive aquí
│   ├── geo/         Geolocalización del navegador + distancias
│   ├── map/         BaseMap, iconos divIcon, animación de marcadores
│   ├── service/     Máquina de estados del servicio (compartida cliente/barbero)
│   └── mock/        Interruptor del modo demo
├── features/        Una carpeta por pantalla, autocontenida
├── context/         Sesión (con roles), conexión y toasts
└── utils/           Helpers puros
```

### Reglas de la estructura

- Una feature **nunca** importa de otra feature. Si dos la necesitan, sube a `lib/`, `components/` o `context/`.
- Cada feature expone su superficie pública por su `index.ts`; nadie importa rutas internas desde fuera.
- Cada feature trae su propio CSS junto a su pantalla; `index.css` solo tiene tokens y piezas compartidas.
- `components/` es solo para lo genérico. Si tiene lógica de negocio, va dentro de la feature.
- Nadie crea un `new WebSocket` fuera de `lib/realtime/socket.ts`.

## Realtime

| Archivo          | Responsabilidad                                                 |
| ---------------- | --------------------------------------------------------------- |
| `socket.ts`      | Conexión única, auth por query param, reconexión y heartbeat     |
| `events.ts`      | Contrato de eventos (entrantes y salientes, payloads tipados)    |
| `useRealtime.ts` | Hook base de suscripción y `useConnectionStatus()`               |

Eventos del broker hacia el front: `VENDOR_LOCATION_UPDATE`, `VENDOR_DISCONNECTED`,
`PROMO_STOCK_UPDATED`, `SERVICE_ASSIGNED`, `SERVICE_STATUS_CHANGED`, `SERVICE_LOCATION_UPDATE`.
Del front hacia el gateway (barbero): `VENDOR_LOCATION_UPDATE`, `VENDOR_OFFLINE`.

Forma de todo mensaje:

```json
{ "event": "SERVICE_STATUS_CHANGED", "data": { "serviceId": "...", "status": "ON_THE_WAY", "changedAt": "..." } }
```

Cualquier mensaje que no la cumpla se descarta con un warning.

**Reconexión.** Backoff exponencial con jitter (1 s → 30 s máx.). Los eventos emitidos durante un
corte se pierden: toda feature con estado acumulado vuelve a pedir el snapshot REST al recuperar la
conexión (patrón snapshot + deltas).

## Concurrencia (4.2)

Reservar un barbero o tomar un cupo de promoción puede chocar con otro cliente. El botón pasa a
`loading` mientras la petición está en vuelo; un `409` del gateway significa que otro ganó la
carrera: se avisa con un toast y se actualiza la disponibilidad al momento.

## Modo demo

Con `VITE_USE_MOCKS=true` los `services.ts` devuelven datos simulados y el socket no abre conexión:
los mocks inyectan eventos con `realtimeSocket.dispatch()`. Sirve para ver y probar las pantallas
mientras el backend no existe. Login demo: cualquier correo entra como cliente; uno que empiece por
`barbero` entra como barbero.

## Pendiente

- Los endpoints REST de los `services.ts` están escritos contra el contrato esperado; falta
  cuadrarlos con el gateway real.
