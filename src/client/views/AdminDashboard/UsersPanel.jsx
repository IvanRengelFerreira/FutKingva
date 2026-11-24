import { useEffect, useRef, useState } from 'react';
import Avatar from '../../components/Avatar/Avatar.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import Select from '../../components/Select/Select.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import TextField from '../../components/TextField/TextField.jsx';
import { deleteAdminUser, getAdminUsers, updateAdminUser } from '../../services/admin.js';
import { shortDate } from '../../services/format.js';
import { useApi } from '../../services/useApi.js';
import { validateAdminUserUpdate } from '../../../shared/validation/admin.js';
import AdminIcon from './AdminIcons.jsx';
import { NO_FILTERS, buildUsersQuery, isFiltering } from './filterUsers.js';
import { useAdminAction } from './useAdminAction.js';
import searchIcon from '../../assets/icon-search-small.svg';

// Pestaña «Usuarios»: buscador, filtros por rol y estado, tabla (escritorio) o tarjetas (móvil)
// con cambio de rol, bloquear / desbloquear y eliminar, y paginación desde la API.
// Diseño: Figma › Mockups › 20 · Panel de administración › Estado «Usuarios»
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=64-1365
const USERS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 250;

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

const toggledStatus = (status) => (status === 'blocked' ? 'active' : 'blocked');

// Confirmación de «Eliminar» en la propia fila. Al aparecer, el foco va a «¿Eliminar?»
function ConfirmDeleteActions({ user, disabled, onDelete, onCancel }) {
  return (
    <div className="admin-actions">
      <button
        type="button"
        className="admin-action admin-action--loss"
        disabled={disabled}
        onClick={() => onDelete(user)}
        aria-label={`Confirmar: eliminar a ${user.name}`}
        autoFocus
      >
        <AdminIcon name="trash" />
        <span className="admin-action__text">¿Eliminar?</span>
      </button>
      <button
        type="button"
        className="admin-action admin-action--gold"
        disabled={disabled}
        onClick={onCancel}
        aria-label={`No eliminar a ${user.name}`}
      >
        <span className="admin-action__text">Cancelar</span>
      </button>
    </div>
  );
}

// «Bloquear / Desbloquear» y «Eliminar». Si se vuelve de «Cancelar», el foco regresa a «Eliminar»
function BlockDeleteActions({ user, disabled, onToggleBlock, onDelete, focusDelete, onFocused }) {
  const deleteButton = useRef(null);
  const blocked = user.status === 'blocked';
  const blockLabel = blocked ? 'Desbloquear' : 'Bloquear';

  useEffect(() => {
    if (!focusDelete) return;
    deleteButton.current?.focus();
    onFocused();
  }, [focusDelete, onFocused]);

  return (
    <div className="admin-actions">
      <button
        type="button"
        className={`admin-action ${blocked ? 'admin-action--win' : 'admin-action--gold'}`}
        disabled={disabled}
        onClick={() => onToggleBlock(user)}
        aria-label={`${blockLabel} a ${user.name}`}
      >
        <AdminIcon name={blocked ? 'unlock' : 'lock'} />
        <span className="admin-action__text">{blockLabel}</span>
      </button>
      <button
        ref={deleteButton}
        type="button"
        className="admin-action admin-action--loss"
        disabled={disabled}
        onClick={() => onDelete(user)}
        aria-label={`Eliminar a ${user.name}`}
      >
        <AdminIcon name="trash" />
        <span className="admin-action__text">Eliminar</span>
      </button>
    </div>
  );
}

// Acciones de una fila: la cuenta propia no se puede bloquear ni eliminar («—»)
function UserActions({ user, disabled, onToggleBlock, onDelete, confirming, onCancelDelete, compact }) {
  // Al cancelar, «Eliminar» recupera el foco (si no, se iría al principio de la página)
  const [returnFocus, setReturnFocus] = useState(false);

  if (user.isCurrentUser) {
    return compact ? null : (
      <span className="admin-users__none" aria-label="Sin acciones para tu propia cuenta">
        —
      </span>
    );
  }

  if (confirming) {
    const cancel = () => {
      setReturnFocus(true);
      onCancelDelete();
    };
    return <ConfirmDeleteActions user={user} disabled={disabled} onDelete={onDelete} onCancel={cancel} />;
  }

  return (
    <BlockDeleteActions
      user={user}
      disabled={disabled}
      onToggleBlock={onToggleBlock}
      onDelete={onDelete}
      focusDelete={returnFocus}
      onFocused={() => setReturnFocus(false)}
    />
  );
}

function RoleSelect({ user, disabled, onChangeRole }) {
  return (
    <Select
      size="sm"
      label={`Rol de ${user.name}`}
      hideLabel
      options={ROLES}
      value={user.role}
      disabled={user.isCurrentUser || disabled} // No te puedes quitar el rol de administrador a ti mismo
      onChange={(e) => onChangeRole(user, e.target.value)}
      className={`admin-role admin-role--${user.role}`}
    />
  );
}

function DisplayName({ user }) {
  return (
    <span className="admin-user__name">
      {user.name}
      {user.isCurrentUser && <span className="admin-user__you"> (tú)</span>}
    </span>
  );
}

function UserName({ user }) {
  return (
    <span className="admin-user">
      <Avatar
        initials={user.initials}
        name={user.name}
        size={34}
        className={`admin-avatar admin-avatar--${user.role}`}
      />
      <DisplayName user={user} />
    </span>
  );
}

function UsersList({
  users,
  filtering,
  sending,
  confirmDelete,
  onChangeRole,
  onToggleBlock,
  onDelete,
  onCancelDelete,
}) {
  if (users.length === 0) {
    return (
      <p className="admin-empty">
        {filtering ? 'Ningún usuario coincide con la búsqueda.' : 'No hay usuarios registrados.'}
      </p>
    );
  }

  return (
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
              <th scope="col" className="admin-table__end">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={user.status === 'blocked' ? 'admin-row--blocked' : undefined}>
                <td>
                  <UserName user={user} />
                </td>
                <td className="admin-table__muted">{user.email ?? '—'}</td>
                <td>
                  <RoleSelect user={user} disabled={sending} onChangeRole={onChangeRole} />
                </td>
                <td>
                  <StatusBadge status={user.status} />
                </td>
                <td className="admin-table__muted">{user.registeredAt ? shortDate(user.registeredAt) : '—'}</td>
                <td className="admin-table__end">
                  <UserActions
                    user={user}
                    disabled={sending}
                    onToggleBlock={onToggleBlock}
                    onDelete={onDelete}
                    confirming={confirmDelete === user.id}
                    onCancelDelete={onCancelDelete}
                  />
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
              <Avatar
                initials={user.initials}
                name={user.name}
                size={38}
                className={`admin-avatar admin-avatar--${user.role}`}
              />
              <div className="admin-card__who">
                <DisplayName user={user} />
                <span className="admin-card__email">{user.email ?? '—'}</span>
              </div>
              <StatusBadge status={user.status} />
            </div>
            <div className="admin-card__bottom">
              <RoleSelect user={user} disabled={sending} onChangeRole={onChangeRole} />
              <UserActions
                user={user}
                disabled={sending}
                onToggleBlock={onToggleBlock}
                onDelete={onDelete}
                confirming={confirmDelete === user.id}
                onCancelDelete={onCancelDelete}
                compact
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function UsersPanel({ onStatsChange }) {
  const [filters, setFilters] = useState(NO_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Retrasamos la búsqueda por texto para no lanzar una petición en cada pulsación
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.query]);

  const activeFilters = { query: debouncedQuery, role: filters.role, status: filters.status };
  const query = buildUsersQuery(activeFilters, page, USERS_PER_PAGE);
  const { data, error, loading, reload } = useApi(
    (signal) => getAdminUsers(query, { signal }),
    [debouncedQuery, filters.role, filters.status, page],
  );

  const users = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / USERS_PER_PAGE);
  const filtering = isFiltering(activeFilters);

  const { sending, statusMessage, errorMessage, runAction, clearFeedback } = useAdminAction({
    itemCount: users.length,
    page,
    setPage,
    reload,
    onStatsChange,
  });

  function updateFilters(next) {
    setFilters(next);
    setConfirmDelete(null);
    if (next.role !== filters.role || next.status !== filters.status) setPage(1);
  }

  function changeRole(user, role) {
    runAction(() => updateAdminUser(user.id, { role }), {
      errors: validateAdminUserUpdate({ role }),
      successMessage: `Rol actualizado para ${user.name}.`,
    });
  }

  function toggleBlock(user) {
    const status = toggledStatus(user.status);
    const successMessage =
      status === 'blocked' ? `Cuenta bloqueada: ${user.name}.` : `Cuenta desbloqueada: ${user.name}.`;
    runAction(() => updateAdminUser(user.id, { status }), {
      errors: validateAdminUserUpdate({ status }),
      successMessage,
    });
  }

  // «Eliminar» pide confirmación en la propia fila; al confirmar se borra en el servidor
  function deleteUser(user) {
    if (confirmDelete !== user.id) {
      setConfirmDelete(user.id);
      clearFeedback();
      return;
    }
    setConfirmDelete(null);
    runAction(() => deleteAdminUser(user.id), {
      successMessage: `Usuario eliminado: ${user.name} (${user.email}).`,
      removed: true,
    });
  }

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
          onChange={(e) => updateFilters({ ...filters, query: e.target.value })}
          className="admin-users__search"
        />
        <Select
          size="sm"
          label="Filtrar por rol"
          hideLabel
          options={ROLE_FILTER}
          value={filters.role}
          onChange={(e) => updateFilters({ ...filters, role: e.target.value })}
        />
        <Select
          size="sm"
          label="Filtrar por estado"
          hideLabel
          options={STATUS_FILTER}
          value={filters.status}
          onChange={(e) => updateFilters({ ...filters, status: e.target.value })}
        />
      </div>

      <FieldError>{errorMessage}</FieldError>
      <p className="admin-reports__message" role="status">
        {statusMessage}
      </p>

      {loading ? (
        <LoadingState label="Cargando usuarios…" />
      ) : error ? (
        <ErrorState error={error} title="No se han podido cargar los usuarios" onRetry={reload} />
      ) : (
        <>
          <UsersList
            users={users}
            filtering={filtering}
            sending={sending}
            confirmDelete={confirmDelete}
            onChangeRole={changeRole}
            onToggleBlock={toggleBlock}
            onDelete={deleteUser}
            onCancelDelete={() => setConfirmDelete(null)}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(nextPage) => {
              setConfirmDelete(null);
              setPage(nextPage);
            }}
            label="Paginación de usuarios"
          />
        </>
      )}
    </div>
  );
}
