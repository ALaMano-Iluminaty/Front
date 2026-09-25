import { useState } from 'react';
import { Button, Modal } from '@/components';
import { formatTime, toDateKey } from '@/utils';
import { useSchedule } from '../hooks/useSchedule';
import { useSlotReservation } from '../hooks/useSlotReservation';
import type { Slot } from '../services';

interface BookingAgendaProps {
  barberId?: string;
}

export function BookingAgenda({ barberId = 'barber-1' }: BookingAgendaProps) {
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const { slots, loading, error, reload } = useSchedule(barberId, date);
  const reservation = useSlotReservation(barberId, reload);

  const isBusy = (slot: Slot) => !slot.available || Boolean(slot.lockedBy);

  return (
    <section className="agenda">
      <header className="agenda__header">
        <h2>Agenda</h2>
        <input
          type="date"
          className="agenda__date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Fecha de la cita"
        />
      </header>

      {error ? (
        <div className="panel panel--error">
          <p>{error}</p>
          <Button variant="secondary" onClick={() => void reload()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="agenda__loading">Cargando horarios…</p>
      ) : (
        <ul className="agenda__slots">
          {slots.map((slot) => (
            <li key={slot.start}>
              <button
                type="button"
                className={`slot ${isBusy(slot) ? 'slot--busy' : ''}`}
                disabled={isBusy(slot)}
                onClick={() => void reservation.select(slot)}
              >
                {formatTime(slot.start)}
                {slot.lockedBy ? <span className="slot__tag">en proceso</span> : null}
              </button>
            </li>
          ))}
          {slots.length === 0 ? <li className="agenda__empty">No hay horarios ese día.</li> : null}
        </ul>
      )}

      <Modal
        open={reservation.selected !== null || reservation.state === 'conflict'}
        title="Confirmar cita"
        onClose={() => void reservation.release()}
        footer={
          reservation.state === 'confirmed' || reservation.state === 'conflict' ? (
            <Button onClick={() => void reservation.release()}>Cerrar</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => void reservation.release()}>
                Cancelar
              </Button>
              <Button
                onClick={() => void reservation.confirm()}
                loading={reservation.state === 'confirming'}
                disabled={reservation.state !== 'locked'}
              >
                Confirmar
              </Button>
            </>
          )
        }
      >
        {reservation.state === 'conflict' ? (
          <p className="panel panel--error">{reservation.error}</p>
        ) : reservation.state === 'confirmed' ? (
          <p>Cita confirmada para las {formatTime(reservation.booking?.slotStart ?? '')}.</p>
        ) : (
          <>
            <p>
              Horario: <strong>{reservation.selected ? formatTime(reservation.selected.start) : ''}</strong>
            </p>
            <p className="agenda__lock-hint">
              {reservation.state === 'locking'
                ? 'Reservando el horario…'
                : 'Te lo guardamos unos minutos mientras confirmas.'}
            </p>
            {reservation.error ? <p className="panel panel--error">{reservation.error}</p> : null}
          </>
        )}
      </Modal>
    </section>
  );
}
