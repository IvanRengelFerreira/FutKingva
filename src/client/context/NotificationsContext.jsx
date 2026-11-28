import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from './SessionContext.jsx';
import { getNotifications, markNotificationsRead } from '../services/notifications.js';
import { isConnected, onConnectionChange, onEvent, reconnect } from '../services/realtime.js';
import { timeAgo } from '../services/format.js';

// Avisos del usuario (RF9): campana de la navbar, menú móvil y Mi perfil.
// Con sesión se cargan del servidor (GET /api/me/notifications) y los nuevos llegan en directo
// por Socket.IO (notification:new). Sin sesión, la lista está vacía.
//
// Uso en cualquier componente o vista:
//   const { notifications, unreadCount, markAllRead, connected } = useNotifications();
//   notifications → lista de avisos ({ id, type, title, detail, time, unread, toast? })
//   unreadCount   → cuántos quedan sin leer
//   markAllRead() → los marca todos como leídos (también en el servidor)
//   connected     → false mientras se corta la conexión en directo («Reconectando…»)

const NotificationsContext = createContext(null);

/** Une avisos sin repetir (por id), del más reciente al más antiguo */
function mergeById(first, second) {
  const seen = new Set();
  return [...first, ...second]
    .filter((item) => !seen.has(item.id) && seen.add(item.id))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

// Va dentro de SessionProvider (App.jsx): en cada inicio o cierre de sesión la lista vuelve a empezar.
export function NotificationsProvider({ children }) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const [items, setItems] = useState([]);
  // Sin leer que no caben en la lista (solo se cargan los últimos 20): suman en el contador de la campana
  const [olderUnread, setOlderUnread] = useState(0);
  const [connected, setConnected] = useState(isConnected);

  // Cada inicio o cierre de sesión cambia el objeto user: se vacía la lista en este mismo render
  const [lastUser, setLastUser] = useState(user);
  if (lastUser !== user) {
    setLastUser(user);
    setItems([]);
    setOlderUnread(0);
  }

  useEffect(() => {
    // El servidor mete a cada navegador en la sala de su usuario al conectarse: con la sesión nueva hay que reconectar
    reconnect();
    if (userId == null) return;

    // Los que llegan en directo: arriba del todo y, si es un gol, también como aviso emergente
    const off = onEvent('notification:new', (notice) => {
      const toast = notice.type === 'goal' ? { title: notice.title, detail: notice.detail } : undefined;
      setItems((list) => mergeById([{ ...notice, toast }], list));
    });

    const controller = new AbortController();
    const load = () =>
      getNotifications({ signal: controller.signal })
        .then((data) => {
          setItems((list) => mergeById(list, data.items));
          setOlderUnread(Math.max(0, data.unreadCount - data.items.filter((item) => item.unread).length));
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          console.warn('[avisos] No se han podido cargar los avisos:', error.message);
        });
    load();

    // Al volver la conexión se piden otra vez: los avisos creados mientras estaba cortada no han llegado
    const offConnection = onConnectionChange((up) => {
      if (up) load();
    });

    return () => {
      off();
      offConnection();
      controller.abort();
    };
  }, [userId]);

  useEffect(() => onConnectionChange(setConnected), []);

  // La hora relativa («hace 5 min») se calcula al pintar, para que no se quede vieja
  const notifications = items.map((item) => ({ ...item, time: timeAgo(item.createdAt) }));
  const unreadCount = olderUnread + notifications.filter((n) => n.unread).length;

  function markAllRead() {
    setItems((list) => list.map((n) => ({ ...n, unread: false })));
    setOlderUnread(0);
    markNotificationsRead().catch((error) => {
      console.warn('[avisos] No se han podido marcar como leídos en el servidor:', error.message);
    });
  }

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead, connected }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
