import { useState } from 'react';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import Tag from '../../components/Tag/Tag.jsx';
import { getAdminReports, resolveAdminReport } from '../../services/admin.js';
import { shortDate } from '../../services/format.js';
import { useApi } from '../../services/useApi.js';
import { validateReportAction } from '../../../shared/validation/admin.js';
import AdminIcon from './AdminIcons.jsx';
import { useAdminAction } from './useAdminAction.js';

// Pestaña «Moderación»: reportes pendientes con Aprobar (se mantiene sin cambios) y Eliminar (pasa a borrador).
// Diseño: Figma › Mockups › 20 · Panel de administración › Estado «Moderación»
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365
const REPORTS_PER_PAGE = 20;

// En la BD solo existen reportes de artículos (no hay tabla de comentarios).
// El color de la etiqueta reutiliza el de la categoría Táctica de Tag (oro).
const TYPES = {
  article: { label: 'Artículo', category: 'Táctica' },
};

function TypeTag({ type }) {
  const { label, category } = TYPES[type] ?? { label: type ?? '—', category: '' };
  return (
    <Tag category={category} className="admin-tag">
      {label}
    </Tag>
  );
}

function ReportActions({ report, disabled, onResolve }) {
  return (
    <div className="admin-actions">
      <button
        type="button"
        className="admin-action admin-action--win"
        disabled={disabled}
        onClick={() => onResolve(report, 'dismiss')}
      >
        <AdminIcon name="check" />
        <span className="admin-action__text">Aprobar</span>
      </button>
      <button
        type="button"
        className="admin-action admin-action--loss"
        disabled={disabled}
        onClick={() => onResolve(report, 'remove')}
      >
        <AdminIcon name="trash" />
        <span className="admin-action__text">Eliminar</span>
      </button>
    </div>
  );
}

function ReportsList({ reports, sending, onResolve }) {
  if (reports.length === 0) {
    return <p className="admin-empty">No quedan reportes pendientes.</p>;
  }

  return (
    <>
      {/* Escritorio: tabla */}
      <div className="admin-table admin-reports__desktop">
        <table>
          <thead>
            <tr>
              <th scope="col">Contenido</th>
              <th scope="col">Tipo</th>
              <th scope="col">Motivo del reporte</th>
              <th scope="col">Autor</th>
              <th scope="col">Fecha</th>
              <th scope="col" className="admin-table__end">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <span className="admin-report__content">
                    <span className="admin-report__flag">
                      <AdminIcon name="flag" size={16} />
                    </span>
                    {report.content ?? '—'}
                  </span>
                </td>
                <td>
                  <TypeTag type={report.type} />
                </td>
                <td className="admin-table__muted">{report.reason ?? '—'}</td>
                <td>{report.author ?? '—'}</td>
                <td className="admin-table__muted">{report.createdAt ? shortDate(report.createdAt) : '—'}</td>
                <td className="admin-table__end">
                  <ReportActions report={report} disabled={sending} onResolve={onResolve} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: una tarjeta por reporte */}
      <ul className="admin-reports__mobile">
        {reports.map((report) => (
          <li key={report.id} className="admin-card admin-card--report">
            <div className="admin-report__head">
              <span className="admin-report__flag">
                <AdminIcon name="flag" />
              </span>
              <TypeTag type={report.type} />
              <span className="admin-report__date">{report.createdAt ? shortDate(report.createdAt) : '—'}</span>
            </div>
            <p className="admin-report__title">{report.content ?? '—'}</p>
            <p className="admin-report__meta">
              {report.reason ?? '—'} · {report.author ?? '—'}
            </p>
            <ReportActions report={report} disabled={sending} onResolve={onResolve} />
          </li>
        ))}
      </ul>
    </>
  );
}

export default function ReportsPanel({ onStatsChange }) {
  const [page, setPage] = useState(1);

  const query = { status: 'pending', limit: REPORTS_PER_PAGE, offset: (page - 1) * REPORTS_PER_PAGE };
  const { data, error, loading, reload } = useApi((signal) => getAdminReports(query, { signal }), [page]);

  const reports = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / REPORTS_PER_PAGE);

  const { sending, statusMessage, errorMessage, runAction } = useAdminAction({
    itemCount: reports.length,
    page,
    setPage,
    reload,
    onStatsChange,
  });

  function resolveReport(report, action) {
    const content = report.content ?? 'contenido';
    const successMessage =
      action === 'dismiss'
        ? `Reporte descartado: «${content}» se mantiene sin cambios.`
        : `Artículo retirado a borrador: «${content}».`;

    runAction(() => resolveAdminReport(report.id, action), {
      errors: validateReportAction({ action }),
      successMessage,
      removed: true,
      // Si otro administrador ya lo resolvió (409), refrescamos para no dejar el reporte obsoleto en pantalla
      onConflict: () => {
        reload();
        onStatsChange();
      },
    });
  }

  return (
    <div className="admin-reports">
      <FieldError>{errorMessage}</FieldError>
      <p className="admin-reports__message" role="status">
        {statusMessage}
      </p>

      {loading ? (
        <LoadingState label="Cargando reportes…" />
      ) : error ? (
        <ErrorState error={error} title="No se han podido cargar los reportes" onRetry={reload} />
      ) : (
        <>
          <ReportsList reports={reports} sending={sending} onResolve={resolveReport} />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} label="Paginación de reportes" />
        </>
      )}
    </div>
  );
}
