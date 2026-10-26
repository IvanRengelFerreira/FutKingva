import { useState } from 'react';
import RoleNotice from '../../components/RoleNotice/RoleNotice.jsx';
import StatCard from '../../components/StatCard/StatCard.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import UsersPanel, { filterUsers, isFiltering } from './UsersPanel.jsx';
import ReportsPanel from './ReportsPanel.jsx';
import { ADMIN_STATS, USERS, REPORTS } from '../../data/mockData.js';
import './AdminDashboard.css';

// 20 · Panel de administración (RF8): gestión de usuarios y moderación de contenido.
// Todo en estado local (sin servidor): cambiar rol, bloquear / desbloquear, eliminar usuarios y
// aprobar / eliminar reportes. Los indicadores parten de ADMIN_STATS y suman lo que se cambia.
// Solo hay 8 usuarios cargados de los 1.284: la paginación es de aspecto (las demás páginas salen vacías).
// Diseño: Figma › Mockups › 20 · Panel de administración
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365
const TOTAL_PAGES = Math.ceil(ADMIN_STATS.users / (USERS.length || 1));
const NO_FILTERS = { query: '', role: 'all', status: 'all' };

const count = (list, test) => list.filter(test).length;

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState(USERS);
  const [reports, setReports] = useState(REPORTS);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');

  const stats = {
    users: ADMIN_STATS.users - (USERS.length - users.length),
    editors: ADMIN_STATS.editors + count(users, (u) => u.role === 'editor') - count(USERS, (u) => u.role === 'editor'),
    blocked: ADMIN_STATS.blockedAccounts + count(users, (u) => u.status === 'blocked') - count(USERS, (u) => u.status === 'blocked'),
    reports: reports.length,
  };

  // Solo la primera página tiene usuarios cargados; con filtros se busca en todos los cargados
  const visibleUsers = isFiltering(filters) || page === 1 ? filterUsers(users, filters) : [];

  function changeRole(id, role) {
    setUsers((list) => list.map((u) => (u.id === id && !u.isCurrentUser ? { ...u, role } : u)));
  }

  function toggleBlock(id) {
    setUsers((list) =>
      list.map((u) => (u.id === id && !u.isCurrentUser ? { ...u, status: u.status === 'blocked' ? 'active' : 'blocked' } : u))
    );
  }

  function deleteUser(id) {
    setUsers((list) => list.filter((u) => u.id !== id || u.isCurrentUser));
  }

  function resolveReport(id, action) {
    const report = reports.find((r) => r.id === id);
    const content = report?.content ?? 'contenido';
    setReports((list) => list.filter((r) => r.id !== id));
    setMessage(
      action === 'approve'
        ? `Reporte aprobado: «${content}» se mantiene publicado.`
        : `Contenido eliminado: «${content}».`
    );
  }

  function changeTab(id) {
    setTab(id);
    setMessage('');
  }

  const tabs = [
    { id: 'users', label: 'Usuarios' },
    {
      id: 'moderation',
      label: (
        <>
          Moderación
          {reports.length > 0 && <span className="admin__badge" aria-label={`${reports.length} pendientes`}>{reports.length}</span>}
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

      <div className="admin__stats">
        <StatCard value={stats.users.toLocaleString('es-ES', { useGrouping: 'always' })} label={<>Usuarios<span className="admin__more"> registrados</span></>} />
        <StatCard value={stats.editors} label="Editores" tone="info" />
        <StatCard value={stats.blocked} label={<>{/* En móvil, solo «Bloqueadas» */}<span className="admin__more">Cuentas </span>bloqueadas</>} />
        <StatCard value={stats.reports} label={<>Reportes<span className="admin__more"> pendientes</span></>} tone="loss" />
      </div>

      <Tabs label="Secciones del panel" tabs={tabs} active={tab} onChange={changeTab} />

      {tab === 'users' ? (
        <UsersPanel
          users={visibleUsers}
          filters={filters}
          onFilters={(next) => { setFilters(next); setPage(1); }}
          page={page}
          totalPages={TOTAL_PAGES}
          onPage={setPage}
          onChangeRole={changeRole}
          onToggleBlock={toggleBlock}
          onDelete={deleteUser}
        />
      ) : (
        <ReportsPanel reports={reports} message={message} onResolve={resolveReport} />
      )}
    </section>
  );
}
