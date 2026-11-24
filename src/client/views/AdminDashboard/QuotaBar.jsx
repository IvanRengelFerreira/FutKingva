// TEMPORAL: barra de cuota restante de football-data.org para el panel de sincronización manual (20 · Administración).
// La sincronización automática periódica se implementará en otra tarea.

import { useEffect, useId, useState } from 'react';
import './QuotaBar.css';

const LOW_QUOTA_THRESHOLD = 2;
const TICK_INTERVAL_MS = 1000;
const MS_PER_SECOND = 1000;

function computeRemainingSeconds(resetAt, now) {
  if (!resetAt) return 0;
  const resetMs = Date.parse(resetAt);
  if (!Number.isFinite(resetMs)) return 0;
  return Math.max(0, Math.ceil((resetMs - now) / MS_PER_SECOND));
}

function ActiveQuota({ quota, limit, labelId }) {
  const [now, setNow] = useState(() => Date.now());
  const { resetAt } = quota;
  const secondsLeft = computeRemainingSeconds(resetAt, now);

  useEffect(() => {
    if (!resetAt) return undefined;
    const resetMs = Date.parse(resetAt);
    if (!Number.isFinite(resetMs) || resetMs <= Date.now()) return undefined;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= resetMs) clearInterval(timer);
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [resetAt]);

  // Cuando la cuenta atrás llega a 0 el minuto ya se reinició en la API; mostramos el límite completo sin volver a pedir
  const isReset = Boolean(resetAt) && secondsLeft === 0;
  const effectiveAvailable = isReset ? limit : Math.min(Math.max(quota.available, 0), limit);
  const percent = Math.round((effectiveAvailable / limit) * 100);
  const isLow = effectiveAvailable <= LOW_QUOTA_THRESHOLD;

  return (
    <div className={`quota-bar${isLow ? ' quota-bar--low' : ''}`}>
      <div className="quota-bar__head">
        <span id={labelId} className="quota-bar__label">
          Peticiones disponibles: <strong className="quota-bar__count">{effectiveAvailable}</strong> de {limit} este
          minuto
        </span>
        {secondsLeft > 0 && <span className="quota-bar__reset">se reinicia en {secondsLeft} s</span>}
      </div>
      <div
        className="quota-bar__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={effectiveAvailable}
        aria-labelledby={labelId}
      >
        <div className="quota-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function QuotaBar({ quota }) {
  const labelId = useId();
  const { limit } = quota;

  if (quota.available == null) {
    return (
      <div className="quota-bar">
        <div className="quota-bar__head">
          <span id={labelId} className="quota-bar__empty-text">
            Sin datos todavía: se sabrá tras la primera actualización
          </span>
        </div>
        <div
          className="quota-bar__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-labelledby={labelId}
        >
          <div className="quota-bar__fill" style={{ width: '0%' }} />
        </div>
      </div>
    );
  }

  // La clave reinicia el reloj interno al llegar una cuota nueva sin depender de efectos síncronos
  const quotaKey = `${quota.resetAt ?? 'none'}-${quota.updatedAt ?? 'none'}`;
  return <ActiveQuota key={quotaKey} quota={quota} limit={limit} labelId={labelId} />;
}
