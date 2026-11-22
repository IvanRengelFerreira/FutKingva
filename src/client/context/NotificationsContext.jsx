import { createContext, useContext, useState } from 'react';
import { NOTIFICATIONS } from '../data/mockData.js';
import { useSession } from './SessionContext.jsx';

// Avisos del usuario (RF9): campana de la navbar, menú móvil y Mi perfil.
// Aún son de ejemplo (data/mockData.js); los de verdad llegarán en tiempo real (Socket.IO).
//
// Uso en cualquier componente o vista:
//   const { notifications, unreadCount, markAllRead } = useNotifications();
//   notifications → lista de avisos ({ id, type, title, detail, time, unread, toast? })
//   unreadCount   → cuántos quedan sin leer
//   markAllRead() → los marca todos como leídos. Dura hasta recargar o volver a entrar.

const NotificationsContext = createContext(null);

// Va dentro de SessionProvider (App.jsx): en cada inicio o cierre de sesión la lista vuelve a empezar.
export function NotificationsProvider({ children }) {
  const { user } = useSession();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => n.unread).length;

  // Cada inicio o cierre de sesión cambia el objeto user: se reinicia la lista en este mismo render
  const [lastUser, setLastUser] = useState(user);
  if (lastUser !== user) {
    setLastUser(user);
    setNotifications(NOTIFICATIONS);
  }

  function markAllRead() {
    setNotifications((list) => list.map((n) => ({ ...n, unread: false })));
  }

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
