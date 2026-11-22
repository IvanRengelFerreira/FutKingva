import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import './Access.css';
import { useSession } from '../../context/SessionContext.jsx';
import { useFormSubmit } from '../../services/useFormSubmit.js';
import Tabs from '../../components/Tabs/Tabs.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../../shared/demoAccounts.js';
import logo from '../../assets/logo-access.svg';

// 14 · Acceso (RF1): una sola página con dos pestañas, «Iniciar sesión» y «Registrarse».
// Diseño: Figma › Mockups › 14 · Acceso
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-1144
// Va sin navbar ni pie (ruta fuera de Layout en App.jsx): solo la tarjeta y un enlace para volver.
// /acceso?registro abre directamente la pestaña «Registrarse» (botón «Registrarse» de la navbar).
// Al entrar o registrarse, el servidor abre la sesión (cookie; sin «Recordarme», dura hasta cerrar el
// navegador) y se vuelve a la página privada de la que venía (RequireRole) o a Inicio.
// Los formularios validan antes de enviar con las mismas reglas que el servidor (src/shared/validation/auth.js).

const TABS = [
  { id: 'login', label: 'Iniciar sesión' },
  { id: 'register', label: 'Registrarse' },
];

const HEADINGS = {
  login: { title: 'Bienvenido de nuevo', text: 'Entra para ver tus favoritos y avisos en directo.' },
  register: { title: 'Crea tu cuenta', text: 'Guarda favoritos, comparativas y tu equipo ideal.' },
};

// Botones de acceso rápido: entran de verdad con la cuenta de demostración de cada rol
// (src/shared/demoAccounts.js; las crea `npm run seed:demo` en src/server)
const MISSING_DEMO_ACCOUNTS = 'Faltan las cuentas de prueba: ejecuta «npm run seed:demo» en src/server.';

export default function Access() {
  const { login, register } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.search.includes('registro') ? 'register' : 'login');
  const quick = useFormSubmit();
  const heading = HEADINGS[tab];

  function goBack() {
    navigate(location.state?.from ?? '/', { replace: true });
  }

  // Los formularios enseñan los errores; aquí solo se entra y se vuelve atrás
  async function handleLogin(credentials) {
    await login(credentials);
    goBack();
  }

  async function handleRegister(data) {
    await register(data);
    goBack();
  }

  // Un 401 aquí solo pasa si la cuenta de demo no existe en la BD: se explica cómo crearla
  function quickAccess(email) {
    quick.submit(async () => {
      try {
        await login({ email, password: DEMO_PASSWORD, remember: true });
      } catch (error) {
        throw error.status === 401 ? new Error(MISSING_DEMO_ACCOUNTS) : error;
      }
      goBack();
    });
  }

  return (
    <div className="access">
      <Link className="access__back" to="/">
        ← Volver a Inicio
      </Link>

      <section className="access__card" aria-labelledby="access-title">
        <Link to="/" aria-label="FutKingva, ir a Inicio">
          <img src={logo} alt="" width="56" height="56" />
        </Link>

        <header className="access__heading">
          <h1 id="access-title">{heading.title}</h1>
          <p>{heading.text}</p>
        </header>

        <Tabs label="Acceso" tabs={TABS} active={tab} onChange={setTab} fill />

        <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab).label}>
          {tab === 'login' ? (
            <LoginForm onSubmit={handleLogin} onSwitch={() => setTab('register')} />
          ) : (
            <RegisterForm onSubmit={handleRegister} onSwitch={() => setTab('login')} />
          )}
        </div>

        {tab === 'login' && (
          <div className="access__quick">
            <p className="access__quick-title">Acceso rápido de prueba</p>
            <div className="access__quick-buttons">
              {DEMO_ACCOUNTS.map(({ role, label, email }) => (
                <button
                  key={role}
                  className={`access__quick-button access__quick-button--${role}`}
                  type="button"
                  disabled={quick.sending}
                  onClick={() => quickAccess(email)}
                >
                  {label}
                </button>
              ))}
            </div>
            <FieldError>{quick.message}</FieldError>
          </div>
        )}
      </section>
    </div>
  );
}
