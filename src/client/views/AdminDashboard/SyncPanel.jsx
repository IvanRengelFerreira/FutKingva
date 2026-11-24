// TEMPORAL: sección del panel de administración para actualizar datos de LaLiga desde football-data.org.
// La sincronización automática periódica se implementará en otra tarea.

import { useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import { shortTime, timeAgo } from '../../services/format.js';
import { getSyncRuns, runSyncResource } from '../../services/sync.js';
import { useApi } from '../../services/useApi.js';
import { useFormSubmit } from '../../services/useFormSubmit.js';
import './SyncPanel.css';

const RESOURCES = [
  { id: 'matches', title: 'Partidos y clasificación', buttonLabel: 'Actualizar partidos y clasificación' },
  { id: 'scorers', title: 'Goleadores', buttonLabel: 'Actualizar goleadores' },
];

// El color reutiliza las categorías de Tag: Datos (azul), Crónica (rojo) y Táctica (oro en la etiqueta Temporal).
// Para OK se omite category y el verde lo pone .admin-sync__status--ok.
const STATUS_META = {
  OK: { label: 'Correcto', className: 'admin-sync__status--ok' },
  RUNNING: { label: 'En curso', category: 'Datos', className: '' },
  ERROR: { label: 'Error', category: 'Crónica', className: '' },
};

function plural(count, singular, pluralWord) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

function buildResultMessage(resource, result) {
  const time = result.finishedAt ? shortTime(result.finishedAt) : '';
  const records = plural(result.records ?? 0, 'registro actualizado', 'registros actualizados');

  if (resource === 'scorers') {
    const skipped = plural(result.skipped ?? 0, 'omitido', 'omitidos');
    return `Goleadores actualizados: ${records}, ${skipped}${time ? ` (${time})` : ''}.`;
  }
  return `Partidos y clasificación actualizados: ${records}${time ? ` (${time})` : ''}.`;
}

function RunStatusTag({ status }) {
  if (!status) {
    return <Tag className="admin-tag">Sin ejecuciones</Tag>;
  }
  const meta = STATUS_META[status] ?? { label: status, className: '' };
  return (
    <Tag category={meta.category} className={`admin-tag ${meta.className}`.trim()}>
      {meta.label}
    </Tag>
  );
}

function SyncRunRow({ item, run }) {
  const timestamp = run?.finishedAt ?? run?.startedAt;

  return (
    <li className="admin-sync__item">
      <div className="admin-sync__item-head">
        <span className="admin-sync__item-title">{item.title}</span>
        <RunStatusTag status={run?.status} />
      </div>
      {run ? (
        <div className="admin-sync__item-meta">
          <span>
            Última ejecución: {timeAgo(timestamp)} ({shortTime(timestamp)})
          </span>
          {run.records != null && <span>· {plural(run.records, 'registro', 'registros')}</span>}
          {run.requests != null && <span>· {plural(run.requests, 'petición', 'peticiones')}</span>}
          {run.error && <p className="admin-sync__item-error">{run.error}</p>}
        </div>
      ) : (
        <p className="admin-sync__item-empty">Todavía no se ha lanzado ninguna sincronización manual.</p>
      )}
    </li>
  );
}

export default function SyncPanel() {
  const { data, error, loading, reload } = useApi((signal) => getSyncRuns({ signal }), []);
  const { sending, message, submit } = useFormSubmit();
  const [runningResource, setRunningResource] = useState(null);
  const [feedback, setFeedback] = useState('');

  const runsByResource = new Map((data?.items ?? []).map((run) => [run.resource, run]));

  function triggerSync(resource) {
    setFeedback('');
    setRunningResource(resource);

    submit(async () => {
      try {
        const result = await runSyncResource(resource);
        setFeedback(buildResultMessage(resource, result));
        reload();
      } catch (err) {
        // Refrescamos también en error para que aparezca el registro ERROR recién guardado en sync_runs
        reload();
        throw err;
      } finally {
        setRunningResource(null);
      }
    });
  }

  return (
    <section className="admin-sync" aria-labelledby="admin-sync-heading">
      <div className="admin-sync__header">
        <div className="admin-sync__title-row">
          <h2 className="admin-sync__title" id="admin-sync-heading">
            Sincronización de datos (temporal)
          </h2>
          <Tag category="Táctica" className="admin-tag">
            Temporal
          </Tag>
        </div>
        <p className="admin-sync__subtitle">
          Actualiza manualmente los datos de LaLiga desde football-data.org para comprobar la web con resultados al día.
        </p>
      </div>

      <div className="admin-sync__actions">
        {RESOURCES.map((item) => (
          <Button key={item.id} variant="secondary" disabled={sending} onClick={() => triggerSync(item.id)}>
            {runningResource === item.id ? 'Actualizando…' : item.buttonLabel}
          </Button>
        ))}
      </div>

      <FieldError>{message}</FieldError>
      <p className="admin-reports__message" role="status">
        {feedback}
      </p>

      {loading && !data ? (
        <LoadingState label="Cargando historial de sincronización…" />
      ) : error ? (
        <ErrorState error={error} title="No se ha podido cargar el estado de sincronización" onRetry={reload} />
      ) : (
        <ul className="admin-sync__list">
          {RESOURCES.map((item) => (
            <SyncRunRow key={item.id} item={item} run={runsByResource.get(item.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}
