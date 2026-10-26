import Avatar from '../../components/Avatar/Avatar.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import Select from '../../components/Select/Select.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import AdminIcon from './AdminIcons.jsx';
import searchIcon from '../../assets/icon-search-small.svg';

// Pestaña «Usuarios»: buscador, filtros por rol y estado, tabla (escritorio) o tarjetas (móvil)
// con cambio de rol, bloquear / desbloquear y eliminar, y paginación.
// Diseño: Figma › Mockups › 20 · Panel de administración › Estado «Usuarios»
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365
const ROLES = [
  { value: 'user', label: 'Usuario' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Administrador' },
];
const ROLE_FILTER = [{ value: 'all', label: 'Rol: Todos' }, ...ROLES];
const STATUS_FILTER = [
  { value: 'all', label: 'Estado: Todos' },
  { value: 'active', label: 'Activo' },
  { value: 'blocked', label: 'Bloqueado' },
];

// Quita tildes y mayúsculas para buscar
function normalize(text = '') {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function isFiltering({ query, role, status }) {
  return Boolean(query.trim()) || role !== 'all' || status !== 'all';
}

export function filterUsers(users, { query, role, status }) {
  const search = normalize(query);
  return users.filter(
    (user) =>
      (role === 'all' || user.role === role) &&
      (status === 'all' || user.status === status) &&
      (!search || normalize(user.name).includes(search) || normalize(user.email).includes(search))
  );
}

// Acciones de una fila: la cuenta propia no se puede bloquear ni eliminar («—»)
function UserActions({ user, onToggleBlock, onDelete, compact }) {
  if (user.isCurrentUser) {
    return compact ? null : <span className="admin-users__none" aria-label="Sin acciones para tu propia cuenta">—</span>;
  }
  const blocked = user.status === 'blocked';
  const blockLabel = blocked ? 'Desbloquear' : 'Bloquear';
  return (
    <div className="admin-actions">
      <button
        type="button"
        className={`admin-action ${blocked ? 'admin-action--win' : 'admin-action--gold'}`}
        onClick={() => onToggleBlock(user.id)}
        aria-label={`${blockLabel} a ${user.name}`}
      >
        <AdminIcon name={blocked ? 'unlock' : 'lock'} />
        <span className="admin-action__text">{blockLabel}</span>
      </button>
      <button
        type="button"
        className="admin-action admin-action--loss"
        onClick={() => onDelete(user.id)}
        aria-label={`Eliminar a ${user.name}`}
      >
        <AdminIcon name="trash" />
        <span className="admin-action__text">Eliminar</span>
      </button>
    </div>
  );
}

function RoleSelect({ user, onChangeRole }) {
  return (
    <Select
      size="sm"
      label={`Rol de ${user.name}`}
      hideLabel
      options={ROLES}
      value={user.role}
      disabled={user.isCurrentUser} // No te puedes quitar el rol de administrador a ti mismo
      onChange={(e) => onChangeRole(user.id, e.target.value)}
      className={`admin-role admin-role--${user.role}`}
    />
  );
}

function UserName({ user }) {
  return (
    <span className="admin-user">
      <Avatar initials={user.initials} name={user.name} size={34} className={`admin-avatar admin-avatar--${user.role}`} />
      <span className="admin-user__name">
        {user.name}
        {user.isCurrentUser && <span className="admin-user__you"> (tú)</span>}
      </span>
    </span>
  );
}

export default function UsersPanel({
  users, filters, onFilters, page, totalPages, onPage, onChangeRole, onToggleBlock, onDelete,
}) {
  const filtering = isFiltering(filters);

  return (
    <div className="admin-users">
      <div className="admin-users__filters">
        <TextField
          size="sm"
          label="Buscar usuario"
          hideLabel
          placeholder="Buscar por nombre o correo…"
          icon={searchIcon}
          value={filters.query}
          onChange={(e) => onFilters({ ...filters, query: e.target.value })}
          className="admin-users__search"
        />
        <Select
          size="sm"
          label="Filtrar por rol"
          hideLabel
          options={ROLE_FILTER}
          value={filters.role}
          onChange={(e) => onFilters({ ...filters, role: e.target.value })}
        />
        <Select
          size="sm"
          label="Filtrar por estado"
          hideLabel
          options={STATUS_FILTER}
          value={filters.status}
          onChange={(e) => onFilters({ ...filters, status: e.target.value })}
        />
      </div>

      {users.length === 0 ? (
        <p className="admin-empty">
          {filtering ? 'Ningún usuario coincide con la búsqueda.' : 'Esta página no está cargada en la maqueta.'}
        </p>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className="admin-table admin-users__desktop">
            <table>
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Registro</th>
                  <th scope="col" className="admin-table__end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={user.status === 'blocked' ? 'admin-row--blocked' : undefined}>
                    <td><UserName user={user} /></td>
                    <td className="admin-table__muted">{user.email ?? '—'}</td>
                    <td><RoleSelect user={user} onChangeRole={onChangeRole} /></td>
                    <td><StatusBadge status={user.status} /></td>
                    <td className="admin-table__muted">{user.registered ?? '—'}</td>
                    <td className="admin-table__end">
                      <UserActions user={user} onToggleBlock={onToggleBlock} onDelete={onDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: una tarjeta por usuario */}
          <ul className="admin-users__mobile">
            {users.map((user) => (
              <li key={user.id} className={`admin-card${user.status === 'blocked' ? ' admin-card--blocked' : ''}`}>
                <div className="admin-card__top">
                  <Avatar initials={user.initials} name={user.name} size={38} className={`admin-avatar admin-avatar--${user.role}`} />
                  <div className="admin-card__who">
                    <span className="admin-user__name">
                      {user.name}
                      {user.isCurrentUser && <span className="admin-user__you"> (tú)</span>}
                    </span>
                    <span className="admin-card__email">{user.email ?? '—'}</span>
                  </div>
                  <StatusBadge status={user.status} />
                </div>
                <div className="admin-card__bottom">
                  <RoleSelect user={user} onChangeRole={onChangeRole} />
                  <UserActions user={user} onToggleBlock={onToggleBlock} onDelete={onDelete} compact />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Sin filtros se pagina la lista completa (1.284 usuarios, solo 8 cargados); con filtros, solo lo que coincide */}
      {!filtering && <Pagination page={page} totalPages={totalPages} onChange={onPage} label="Paginación de usuarios" />}
    </div>
  );
}
