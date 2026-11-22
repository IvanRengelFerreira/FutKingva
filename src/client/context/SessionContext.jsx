import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import * as authApi from '../services/auth.js';

// Sesión del usuario (RF1), guardada en el servidor: el navegador solo tiene la cookie.
// Al cargar la web se pregunta al servidor quién es (GET /api/auth/me); mientras tanto ready = false.
//
// Uso en cualquier componente o vista:
//   const { user, ready, login, register, logout } = useSession();
//   user      → null si es un invitado; si no, { id, name, email, role, initials } (role: 'user' | 'editor' | 'admin')
//   ready     → false hasta saber si hay sesión (al cargar la web). Con false, user todavía es null.
//   await login({ email, password, remember })                 → inicia sesión (lanza ApiError si falla)
//   await register({ name, email, password, repeat, accepted }) → crea la cuenta y entra (lanza ApiError si falla)
//   logout()  → cierra la sesión ya. Para un botón «Cerrar sesión», mejor useLogout() (ver abajo).
//   Ejemplo: {user?.role === 'editor' && <p>Solo para editores</p>}
// Los avisos del usuario están aparte: context/NotificationsContext.jsx (useNotifications).
// Para que una página sea solo para ciertos roles, ver components/RequireRole.
// ⚠ Ocultar algo en el front es solo comodidad: quien protege de verdad es el servidor.

// Panel de cada rol (los usuarios normales no tienen). Lo usan la navbar y el menú móvil.
export const ROLE_PANELS = {
  editor: { label: 'Panel de editor', path: '/editor' },
  admin: { label: 'Panel de administración', path: '/admin' },
};

const SessionContext = createContext(null);

// Envuelve toda la web en App.jsx para que cualquier página pueda leer la sesión.
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  // «Cerrar sesión» pendiente: se cierra al llegar a Inicio (ver useLogout y LogoutOnHome)
  const [logoutPending, setLogoutPending] = useState(false);

  // ¿Hay sesión de una visita anterior? Si el servidor no responde, se entra como invitado.
  useEffect(() => {
    const controller = new AbortController();
    authApi
      .getMe({ signal: controller.signal })
      // Si mientras tanto ya ha entrado (login en /acceso), no se pisa ese usuario
      .then((me) => setUser((current) => current ?? me))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.warn('[sesión] No se ha podido comprobar la sesión:', error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, []);

  async function login(credentials) {
    setUser(await authApi.login(credentials));
  }

  async function register(data) {
    setUser(await authApi.register(data));
  }

  async function logout() {
    setLogoutPending(false);
    try {
      await authApi.logout();
    } catch (error) {
      // Sin conexión: en esta pestaña se sale igual, pero la sesión sigue abierta en el servidor
      // (al recargar volvería a entrar) hasta que caduque la cookie o se cierre sesión con conexión
      console.warn('[sesión] No se ha podido cerrar la sesión en el servidor:', error.message);
    }
    setUser(null);
  }

  return (
    <SessionContext.Provider value={{ user, ready, login, register, logout, logoutPending, setLogoutPending }}>
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
