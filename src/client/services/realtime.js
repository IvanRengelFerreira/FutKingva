// Conexión en directo con el servidor (Socket.IO, RF9). Una sola conexión para toda la web.
//
//   const off = onEvent('match:update', ({ match, lastEvent }) => …);   // dentro de un useEffect
//   return off;                                                          // al salir, se deja de escuchar
//
// Eventos que llegan del servidor (src/server/realtime/socket.js):
//   match:update, match:finished, match:removed, standings:update, notification:new, sync:done
//
// La conexión usa la cookie de sesión (en desarrollo, a través del proxy de Vite). Al abrir la web
// con doble clic (file://, sin servidor) no se conecta: los avisos en directo simplemente no llegan.

import { io } from 'socket.io-client';

const enabled = typeof window !== 'undefined' && window.location.protocol.startsWith('http');

let socket = null;

function getSocket() {
  if (!enabled) return null;
  if (!socket) {
    // Misma dirección que la web; Socket.IO se reconecta solo si se corta
    socket = io({ withCredentials: true });
    // Si es el servidor quien corta (otra pestaña ha cerrado sesión, cuenta bloqueada), Socket.IO no
    // vuelve solo: se reconecta para seguir recibiendo lo público con la sesión que haya ahora
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') socket.connect();
    });
  }
  return socket;
}

/** Escucha un evento del servidor; devuelve la función que deja de escucharlo */
export function onEvent(name, handler) {
  const current = getSocket();
  if (!current) return () => {};
  current.on(name, handler);
  return () => current.off(name, handler);
}

/** ¿Hay conexión en directo ahora mismo? (sin servidor, en file://, se da por buena: no hay nada que esperar) */
export function isConnected() {
  return enabled ? Boolean(socket?.connected) : true;
}

/** Avisa cuando se conecta (true) o se corta (false); devuelve la función que deja de avisar */
export function onConnectionChange(handler) {
  const current = getSocket();
  if (!current) return () => {};
  const up = () => handler(true);
  const down = () => handler(false);
  current.on('connect', up);
  current.on('disconnect', down);
  return () => {
    current.off('connect', up);
    current.off('disconnect', down);
  };
}

/** Tras iniciar o cerrar sesión: vuelve a conectar para que el servidor lea la cookie nueva */
export function reconnect() {
  const current = getSocket();
  if (!current) return;
  current.disconnect();
  current.connect();
}
