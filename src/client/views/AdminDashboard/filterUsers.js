// Filtros y parámetros de consulta de la pestaña «Usuarios» de 20 · Panel de administración.
// El filtrado y la paginación se delegan en el servidor (GET /api/admin/users) para buscar sobre
// toda la base de datos y mantener totales de paginación exactos.

export const NO_FILTERS = { query: '', role: 'all', status: 'all' };

export function isFiltering({ query, role, status }) {
  return Boolean(query.trim()) || role !== 'all' || status !== 'all';
}

export function buildUsersQuery({ query, role, status }, page, limit) {
  const search = query.trim();
  return {
    ...(search ? { search } : {}),
    ...(role !== 'all' ? { role } : {}),
    ...(status !== 'all' ? { status } : {}),
    limit,
    offset: (page - 1) * limit,
  };
}
