// Formato común de un usuario en las respuestas de la API.
//   publicUser(user) → { id, name, email, role, initials }   (mismo formato que usa SessionContext)

/** Usuario tal como se envía al front: nunca password_hash ni status. null si no hay usuario */
export function publicUser(user) {
  if (!user) return null;
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase(),
    initials: user.name.trim().charAt(0).toUpperCase(),
  };
}
