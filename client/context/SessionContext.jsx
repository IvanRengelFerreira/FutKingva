import { createContext, useContext, useState } from 'react';
import { NOTIFICATIONS } from '../data/mockData.js';

// Sesión simulada: no hay servidor, así que «iniciar sesión» solo guarda el rol elegido
// en el navegador (localStorage). Se mantiene al recargar y al cambiar de página.
//
// Uso en cualquier componente o vista:
//   const { user, login, logout } = useSession();
//   user      → null si es un invitado; si no, uno de los usuarios de DEMO_USERS
//   login('user' | 'editor' | 'admin')
//   logout()
//   notifications, unreadCount, markAllRead()  → avisos del usuario (campana y Mi perfil)
//   Ejemplo: {user?.role === 'editor' && <p>Solo para editores</p>}
// Para que una página sea solo para ciertos roles, ver components/RequireRole.

const STORAGE_KEY = 'futkingva-session';

// Usuario de ejemplo de cada rol: se llama como el rol (sale así en la navbar y en el menú móvil).
const DEMO_USERS = {
  user: { role: 'user', name: 'Usuario', initials: 'U' },
  editor: { role: 'editor', name: 'Editor', initials: 'E' },
  admin: { role: 'admin', name: 'Admin', initials: 'A' },
};

// Panel de cada rol (los usuarios normales no tienen). Lo usan la navbar y el menú móvil.
export const ROLE_PANELS = {
  editor: { label: 'Panel de editor', path: '/editor' },
  admin: { label: 'Panel de administración', path: '/admin' },
};

const SessionContext = createContext(null);

// Si el navegador bloquea localStorage (p. ej. con las cookies desactivadas), la sesión
// funciona igual pero no se recuerda al recargar, en vez de dejar la página en blanco.
function readStoredRole() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeRole(role) {
  try {
    if (role) localStorage.setItem(STORAGE_KEY, role);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin localStorage: la sesión dura hasta recargar.
  }
}

// Envuelve toda la web en App.jsx para que cualquier página pueda leer la sesión.
export function SessionProvider({ children }) {
  // Rol guardado de la visita anterior (si no hay o no es válido, invitado).
  const [user, setUser] = useState(() => DEMO_USERS[readStoredRole()] ?? null);
  // Avisos de ejemplo (data/mockData.js). «Leídas» dura hasta recargar o volver a entrar.
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => n.unread).length;

  function login(role) {
    storeRole(role);
    setUser(DEMO_USERS[role]);
    setNotifications(NOTIFICATIONS);
  }

  function markAllRead() {
    setNotifications((list) => list.map((n) => ({ ...n, unread: false })));
  }

  function logout() {
    storeRole(null);
    setUser(null);
  }

  return (
    <SessionContext.Provider value={{ user, login, logout, notifications, unreadCount, markAllRead }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
