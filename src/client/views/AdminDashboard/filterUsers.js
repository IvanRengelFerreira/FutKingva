// Búsqueda y filtros de la pestaña «Usuarios» de 20 · Panel de administración (UsersPanel).

import { toSearchText } from '../../utils/text.js';

export function isFiltering({ query, role, status }) {
  return Boolean(query.trim()) || role !== 'all' || status !== 'all';
}

export function filterUsers(users, { query, role, status }) {
  const search = toSearchText(query);
  return users.filter(
    (user) =>
      (role === 'all' || user.role === role) &&
      (status === 'all' || user.status === status) &&
      (!search || toSearchText(user.name).includes(search) || toSearchText(user.email).includes(search)),
  );
}
