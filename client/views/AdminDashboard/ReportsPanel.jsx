import Tag from '../../components/Tag/Tag.jsx';
import AdminIcon from './AdminIcons.jsx';

// Pestaña «Moderación»: reportes pendientes con Aprobar (se mantiene el contenido) y Eliminar (se retira).
// Diseño: Figma › Mockups › 20 · Panel de administración › Estado «Moderación»
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365
// El color de la etiqueta reutiliza el de las categorías de Tag: Comentario en violeta, Artículo en oro.
const TYPES = {
  comment: { label: 'Comentario', category: 'Previa' },
  article: { label: 'Artículo', category: 'Táctica' },
};

function TypeTag({ type }) {
  const { label, category } = TYPES[type] ?? { label: type ?? '—', category: '' };
  return <Tag category={category} className="admin-tag">{label}</Tag>;
}

function ReportActions({ report, onResolve }) {
  return (
    <div className="admin-actions">
      <button type="button" className="admin-action admin-action--win" onClick={() => onResolve(report.id, 'approve')}>
        <AdminIcon name="check" />
        <span className="admin-action__text">Aprobar</span>
      </button>
      <button type="button" className="admin-action admin-action--loss" onClick={() => onResolve(report.id, 'remove')}>
        <AdminIcon name="trash" />
        <span className="admin-action__text">Eliminar</span>
      </button>
    </div>
  );
}

export default function ReportsPanel({ reports, message, onResolve }) {
  return (
    <div className="admin-reports">
      <p className="admin-reports__message" role="status">{message}</p>

      {reports.length === 0 ? (
        <p className="admin-empty">No quedan reportes pendientes.</p>
      ) : (
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
                  <th scope="col" className="admin-table__end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span className="admin-report__content">
                        <span className="admin-report__flag"><AdminIcon name="flag" size={16} /></span>
                        {report.content ?? '—'}
                      </span>
                    </td>
                    <td><TypeTag type={report.type} /></td>
                    <td className="admin-table__muted">{report.reason ?? '—'}</td>
                    <td>{report.author ?? '—'}</td>
                    <td className="admin-table__muted">{report.date ?? '—'}</td>
                    <td className="admin-table__end"><ReportActions report={report} onResolve={onResolve} /></td>
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
                  <span className="admin-report__flag"><AdminIcon name="flag" /></span>
                  <TypeTag type={report.type} />
                  <span className="admin-report__date">{report.date ?? '—'}</span>
                </div>
                <p className="admin-report__title">{report.content ?? '—'}</p>
                <p className="admin-report__meta">{report.reason ?? '—'} · {report.author ?? '—'}</p>
                <ReportActions report={report} onResolve={onResolve} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
