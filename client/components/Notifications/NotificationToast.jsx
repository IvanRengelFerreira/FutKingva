import { useEffect, useState } from 'react';
import ballIcon from '../../assets/icon-ball.svg';
import closeIcon from '../../assets/icon-close.svg';

// Aviso emergente de gol: aparece abajo a la izquierda en cualquier página y se va solo a los 5 s.
// Diseño: Figma › Mockups › 00 · Componentes interactivos › Aviso emergente (toast)
// Simulación: sale una vez por visita (al poco de entrar con sesión), como si llegara el gol en ese momento.
// Uso (lo pone Notifications): <NotificationToast title="¡GOL! Baena · 89'" detail="Espanyol 0 – 1 Atlético" />

const SHOWN_KEY = 'futkingva-toast-shown';
const DELAY = 1500;     // ms hasta que aparece
const DURATION = 5000;  // ms que se queda en pantalla

function alreadyShown() {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === 'yes';
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(SHOWN_KEY, 'yes');
  } catch {
    // Sin sessionStorage: volverá a salir al recargar.
  }
}

export default function NotificationToast({ title, detail }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alreadyShown()) return;
    let hideTimer;
    const showTimer = setTimeout(() => {
      markShown();
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), DURATION);
    }, DELAY);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
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
      <button className="notification-toast__close" type="button" onClick={() => setVisible(false)} aria-label="Cerrar aviso">
        <span style={{ '--icon': `url("${closeIcon}")` }} aria-hidden="true" />
      </button>
    </div>
  );
}
