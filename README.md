# Barbería — Frontend

React + TypeScript + Vite. Consume el **API Gateway** por REST y recibe eventos del **broker** por WebSocket.

## Arranque

```bash
npm install
cp .env.example .env    # ajustar las dos URLs
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

## Estructura

```
src/
├── components/      Solo componentes 100% genéricos (Button, Input, Modal)
├── layouts/         AppLayout (autenticado) · AuthLayout (login)
├── lib/
│   ├── api-client/  Cliente REST hacia el gateway
│   └── realtime/    Todo el WebSocket vive aquí
├── features/        Una carpeta por caso de uso, autocontenida
│   ├── auth/            login mock, token dummy
│   ├── map/             4.1 — tracking en vivo
│   ├── booking/         5.1 · 5.2 · 5.3 — agenda + concurrencia
│   └── service-status/  6.1 · 6.2 · 6.4 — estado real-time + reconexión
├── context/         Sesión y estado de la conexión
└── utils/           Helpers puros
```

### Reglas de la estructura

- Una feature **nunca** importa de otra feature. Si dos la necesitan, sube a `lib/`, `components/` o `context/`.
- Cada feature expone su superficie pública por su `index.ts`; nadie importa rutas internas desde fuera.
- `components/` es solo para lo genérico. Si tiene lógica de negocio, va dentro de la feature.
- Nadie crea un `new WebSocket` fuera de `lib/realtime/socket.ts`.

## Realtime

`lib/realtime/` tiene tres piezas:

| Archivo          | Responsabilidad                                                 |
| ---------------- | --------------------------------------------------------------- |
| `socket.ts`      | Conexión única, auth por query param, reconexión y heartbeat     |
| `events.ts`      | Contrato de eventos del broker (nombres + payloads tipados)      |
| `useRealtime.ts` | Hook base de suscripción y `useConnectionStatus()`               |

Suscribirse a un evento:

```ts
import { RealtimeEvent, useRealtime } from '@/lib/realtime';

useRealtime(RealtimeEvent.ServiceStatusChanged, (payload) => {
  // payload ya viene tipado como ServiceStatusChangedPayload
});
```

Se espera que el gateway mande mensajes con esta forma:

```json
{ "event": "service.status.changed", "data": { "bookingId": "...", "status": "ON_THE_WAY" } }
```

Cualquier mensaje que no la cumpla se descarta con un warning.

**Reconexión (6.4).** El socket reintenta con backoff exponencial y jitter (1 s → 30 s máx.).
Los eventos emitidos durante un corte se pierden: por eso las features que dependen de
estado acumulado (`useLiveBarbers`, `useServiceStatus`) vuelven a pedir el snapshot REST
al recuperar la conexión. `useConnectionStatus()` alimenta los avisos de "reconectando…".

**Cambiar a Socket.IO.** Solo se reescribe `socket.ts` manteniendo su API pública
(`connect` / `disconnect` / `on` / `onStatusChange` / `emit`). Ni `useRealtime` ni las
features se enteran.

## Concurrencia en la agenda (5.2)

`useSlotReservation` implementa _lock → confirmar → soltar_. Un `409` del gateway en
cualquiera de los dos pasos significa que otro cliente ganó la carrera: se avisa al
usuario y se recarga la agenda. El lock se libera al desmontar si quedó abierto.

## Pendiente

- Los endpoints REST de `services.ts` están escritos contra el contrato esperado; falta
  cuadrarlos con el gateway real.
- `features/auth/services.ts` devuelve un token dummy. Al existir `/auth/login`, se
  sustituye el cuerpo de `login()` por la llamada real y nada más cambia.
