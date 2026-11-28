import { useEffect, useState } from 'react';
import ballIcon from '../../assets/icon-ball.svg';
import closeIcon from '../../assets/icon-close.svg';

// Aviso emergente de gol: aparece abajo a la izquierda en cualquier página y se va solo a los 5 s.
// Diseño: Figma › Mockups › 00 · Componentes interactivos › Aviso emergente (toast)
// Sale cuando llega un gol en directo (Socket.IO) de un equipo que sigue el usuario.
// Uso (lo pone Notifications): <NotificationToast key={aviso.id} title="¡Gol de Baena! · 89'" detail="Espanyol 0 – 1 Atlético" />
// Con otro key (otro aviso) vuelve a salir.

const DURATION = 5000; // ms que se queda en pantalla

export default function NotificationToast({ title, detail }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(hideTimer);
  }, []);

  if (!visible) return null;

  return (
    <div className="notification-toast" role="status">
      <span className="notification-toast__icon" aria-hidden="true">
        <span style={{ '--icon': `url("${ballIcon}")` }} />
      </span>
      <span className="notification-toast__text">
        <strong>{title}</strong>
        <span>{detail}</span>
      </span>
      <button
        className="notification-toast__close"
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Cerrar aviso"
      >
        <span style={{ '--icon': `url("${closeIcon}")` }} aria-hidden="true" />
      </button>
    </div>
  );
}
