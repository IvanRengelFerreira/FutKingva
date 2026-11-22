// Búsqueda y filtros de la pestaña «Usuarios» de 20 · Panel de administración (UsersPanel).

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
