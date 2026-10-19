import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import './Access.css';
import { useSession } from '../../context/SessionContext.jsx';
import Tabs from '../../components/Tabs/Tabs.jsx';
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';
import logo from '../../assets/logo-access.svg';

// 14 · Acceso (RF1): una sola página con dos pestañas, «Iniciar sesión» y «Registrarse».
// Diseño: Figma › Mockups › 14 · Acceso
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-1144
// Va sin navbar ni pie (ruta fuera de Layout en App.jsx): solo la tarjeta y un enlace para volver.
// /acceso?registro abre directamente la pestaña «Registrarse» (botón «Registrarse» de la navbar).
// No hay servidor: al entrar o registrarse se inicia la sesión simulada como «Usuario»
// y se vuelve a la página privada de la que venía (RequireRole) o a Inicio.

const TABS = [
  { id: 'login', label: 'Iniciar sesión' },
  { id: 'register', label: 'Registrarse' },
];

const HEADINGS = {
  login: { title: 'Bienvenido de nuevo', text: 'Entra para ver tus favoritos y avisos en directo.' },
  register: { title: 'Crea tu cuenta', text: 'Guarda favoritos, comparativas y tu equipo ideal.' },
};

// Botones de acceso rápido para probar cada rol sin rellenar el formulario
const QUICK_ACCESS = [
  { role: 'user', label: 'Usuario' },
  { role: 'editor', label: 'Editor' },
  { role: 'admin', label: 'Admin' },
];

export default function Access() {
  const { login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.search.includes('registro') ? 'register' : 'login');
  const heading = HEADINGS[tab];

  function enter(role) {
    login(role);
    navigate(location.state?.from ?? '/', { replace: true });
  }

  return (
    <div className="access">
      <Link className="access__back" to="/">← Volver a Inicio</Link>

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
            <LoginForm onSubmit={() => enter('user')} onSwitch={() => setTab('register')} />
          ) : (
            <RegisterForm onSubmit={() => enter('user')} onSwitch={() => setTab('login')} />
          )}
        </div>

        {tab === 'login' && (
          <div className="access__quick">
            <p className="access__quick-title">Acceso rápido de prueba</p>
            <div className="access__quick-buttons">
              {QUICK_ACCESS.map(({ role, label }) => (
                <button
                  key={role}
                  className={`access__quick-button access__quick-button--${role}`}
                  type="button"
                  onClick={() => enter(role)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
