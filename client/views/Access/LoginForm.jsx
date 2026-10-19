import { useState } from 'react';
import { Link } from 'react-router';
import TextField from '../../components/TextField/TextField.jsx';
import Checkbox from '../../components/Checkbox/Checkbox.jsx';
import Button from '../../components/Button/Button.jsx';
import { isValidEmail } from './validation.js';
import mailIcon from '../../assets/icon-mail.svg';
import lockIcon from '../../assets/icon-lock.svg';

// Pestaña «Iniciar sesión» de 14 · Acceso.
// Los errores salen al pulsar «Entrar» y se van en cuanto se corrige el campo.
export default function LoginForm({ onSubmit, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    email: !email ? 'Escribe tu correo electrónico' : !isValidEmail(email) ? 'El correo no es válido' : null,
    password: !password ? 'Escribe tu contraseña' : null,
  };

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!errors.email && !errors.password) onSubmit();
  }

  return (
    <form className="access__form" onSubmit={handleSubmit} noValidate>
      <TextField
        label="Correo electrónico"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        icon={mailIcon}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={submitted ? errors.email : null}
      />
      <TextField
        label="Contraseña"
        type="password"
        name="password"
        autoComplete="current-password"
        icon={lockIcon}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={submitted ? errors.password : null}
      />

      <div className="access__row">
        <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>Recordarme</Checkbox>
        {/* No hay recuperación de contraseña sin servidor: lleva a Contacto */}
        <Link className="access__link" to="/contacto">¿Olvidaste tu contraseña?</Link>
      </div>

      <Button className="access__submit" type="submit">Entrar</Button>

      <p className="access__switch">
        ¿No tienes cuenta?{' '}
        <button className="access__link" type="button" onClick={onSwitch}>Regístrate</button>
      </p>
    </form>
  );
}
