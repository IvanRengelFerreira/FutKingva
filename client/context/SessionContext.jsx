import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { NOTIFICATIONS } from '../data/mockData.js';

// Sesión simulada: no hay servidor, así que «iniciar sesión» solo guarda el rol elegido
// en el navegador (localStorage). Se mantiene al recargar y al cambiar de página.
//
// Uso en cualquier componente o vista:
//   const { user, login, logout } = useSession();
//   user      → null si es un invitado; si no, uno de los usuarios de DEMO_USERS
//   login('user' | 'editor' | 'admin', { name, remember })  → name: el nombre elegido al registrarse (opcional)
//                                                              remember: false para no recordarla al recargar
//   logout()  → cierra la sesión ya. Para un botón «Cerrar sesión», mejor useLogout() (ver abajo).
//   notifications, unreadCount, markAllRead()  → avisos del usuario (campana y Mi perfil)
//   Ejemplo: {user?.role === 'editor' && <p>Solo para editores</p>}
// Para que una página sea solo para ciertos roles, ver components/RequireRole.

const STORAGE_KEY = 'futkingva-session';
const NAME_KEY = 'futkingva-session-name'; // Nombre elegido al registrarse

// Usuario de ejemplo de cada rol: se llama como el rol (sale así en la navbar y en el menú móvil).
const DEMO_USERS = {
  user: { role: 'user', name: 'Usuario', initials: 'U', email: 'usuario@ejemplo.com' },
  editor: { role: 'editor', name: 'Editor', initials: 'E', email: 'editor@ejemplo.com' },
  admin: { role: 'admin', name: 'Admin', initials: 'A', email: 'admin@ejemplo.com' },
};

// Panel de cada rol (los usuarios normales no tienen). Lo usan la navbar y el menú móvil.
export const ROLE_PANELS = {
  editor: { label: 'Panel de editor', path: '/editor' },
  admin: { label: 'Panel de administración', path: '/admin' },
};

const SessionContext = createContext(null);

// Si el navegador bloquea localStorage (p. ej. con las cookies desactivadas), la sesión
// funciona igual pero no se recuerda al recargar, en vez de dejar la página en blanco.
function readStoredUser() {
  try {
    return makeUser(localStorage.getItem(STORAGE_KEY), localStorage.getItem(NAME_KEY));
  } catch {
    return null;
  }
}

function storeUser(role, name) {
  try {
    if (role) localStorage.setItem(STORAGE_KEY, role);
    else localStorage.removeItem(STORAGE_KEY);
    if (role && name) localStorage.setItem(NAME_KEY, name);
    else localStorage.removeItem(NAME_KEY);
  } catch {
    // Sin localStorage: la sesión dura hasta recargar.
  }
}

// Usuario de ejemplo del rol, con el nombre elegido al registrarse si lo hay (null si el rol no vale)
function makeUser(role, name) {
  const base = Object.hasOwn(DEMO_USERS, role) ? DEMO_USERS[role] : null;
  if (!base) return null;
  const custom = name?.trim();
  return custom ? { ...base, name: custom, initials: custom[0].toUpperCase() } : base;
}

// Envuelve toda la web en App.jsx para que cualquier página pueda leer la sesión.
export function SessionProvider({ children }) {
  // Usuario guardado de la visita anterior (si no hay o no es válido, invitado).
  const [user, setUser] = useState(readStoredUser);
  // Avisos de ejemplo (data/mockData.js). «Leídas» dura hasta recargar o volver a entrar.
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => n.unread).length;
  // «Cerrar sesión» pendiente: se cierra al llegar a Inicio (ver useLogout y LogoutOnHome)
  const [logoutPending, setLogoutPending] = useState(false);

  function login(role, { name, remember = true } = {}) {
    storeUser(remember ? role : null, name);
    setUser(makeUser(role, name));
    setNotifications(NOTIFICATIONS);
  }

  function markAllRead() {
    setNotifications((list) => list.map((n) => ({ ...n, unread: false })));
  }

  function logout() {
    storeUser(null);
    setUser(null);
    setLogoutPending(false);
  }

  return (
    <SessionContext.Provider value={{ user, login, logout, logoutPending, setLogoutPending, notifications, unreadCount, markAllRead }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

// Botón «Cerrar sesión»: primero se va a Inicio y la sesión se cierra al llegar.
// Si se cerrara antes, una página privada (RequireRole) se vería un instante sin sesión y mandaría a Acceso.
// Uso: const handleLogout = useLogout();  →  <button onClick={handleLogout}>Cerrar sesión</button>
export function useLogout() {
  const { setLogoutPending } = useSession();
  const navigate = useNavigate();
  return () => {
    setLogoutPending(true);
    navigate('/');
  };
}

// Va en Layout: cierra la sesión pendiente cuando ya se está en Inicio.
export function LogoutOnHome() {
  const { logoutPending, logout } = useSession();
  const { pathname } = useLocation();

  useEffect(() => {
    if (logoutPending && pathname === '/') logout();
  });

  return null;
}
