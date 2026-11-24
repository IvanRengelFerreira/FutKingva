import { useState } from 'react';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import StatCard from '../../components/StatCard/StatCard.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import { getAdminStats } from '../../services/admin.js';
import { useApi } from '../../services/useApi.js';
import UsersPanel from './UsersPanel.jsx';
import ReportsPanel from './ReportsPanel.jsx';
import './AdminDashboard.css';

// 20 · Panel de administración (RF8): gestión de usuarios y moderación de contenido.
// Datos y acciones conectados a la API (/api/admin/*).
// Diseño: Figma › Mockups › 20 · Panel de administración
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365
function AdminStats({ stats }) {
  return (
    <div className="admin__stats">
      <StatCard
        value={stats.users.toLocaleString('es-ES', { useGrouping: 'always' })}
        label={
          <>
            Usuarios<span className="admin__more"> registrados</span>
          </>
        }
      />
      <StatCard value={stats.editors} label="Editores" tone="info" />
      <StatCard
        value={stats.blockedAccounts}
        label={
          <>
            {/* En móvil, solo «Bloqueadas» */}
            <span className="admin__more">Cuentas </span>bloqueadas
          </>
        }
      />
      <StatCard
        value={stats.pendingReports}
        label={
          <>
            Reportes<span className="admin__more"> pendientes</span>
          </>
        }
        tone="loss"
      />
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const { data: stats, error, loading, reload: reloadStats } = useApi((signal) => getAdminStats({ signal }), []);

  const pendingReports = stats?.pendingReports ?? 0;
  const tabs = [
    { id: 'users', label: 'Usuarios' },
    {
      id: 'moderation',
      label: (
        <>
          Moderación
          {pendingReports > 0 && (
            <span className="admin__badge" aria-label={`${pendingReports} pendientes`}>
              {pendingReports}
            </span>
          )}
        </>
      ),
    },
  ];

  return (
    <section className="page admin">
      <RoleNotice role="admin" />

      <header className="page-header">
        <div className="page-header__text">
          <p className="page-header__eyebrow">Zona de administración</p>
          <h1 className="page-header__title">Panel de administración</h1>
          <p className="page-header__subtitle">Gestión de usuarios y moderación de contenido.</p>
        </div>
      </header>

      {/* Solo mostramos LoadingState en la carga inicial: reloadStats() tras una acción mantiene los indicadores
          anteriores mientras refresca para no desmontar los paneles ni perder sus filtros, página y avisos */}
      {loading && !stats ? (
        <LoadingState label="Cargando panel de administración…" />
      ) : error ? (
        <ErrorState error={error} title="No se ha podido cargar el panel de administración" onRetry={reloadStats} />
      ) : (
        <>
          <AdminStats stats={stats} />
          <Tabs label="Secciones del panel" tabs={tabs} active={tab} onChange={setTab} />
          {tab === 'users' ? <UsersPanel onStatsChange={reloadStats} /> : <ReportsPanel onStatsChange={reloadStats} />}
        </>
      )}
    </section>
  );
}
