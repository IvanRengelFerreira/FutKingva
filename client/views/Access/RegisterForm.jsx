import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Checkbox from '../../components/Checkbox/Checkbox.jsx';
import Button from '../../components/Button/Button.jsx';
import { isValidEmail, passwordStrength, STRENGTH_LABELS } from './validation.js';
import userIcon from '../../assets/icon-user-field.svg';
import mailIcon from '../../assets/icon-mail.svg';
import lockIcon from '../../assets/icon-lock.svg';

// Pestaña «Registrarse» de 14 · Acceso.
// La barra de seguridad se actualiza al escribir la contraseña; «Las contraseñas no coinciden»
// sale en cuanto se escribe en «Repetir contraseña»; el resto de errores, al pulsar «Crear cuenta».
export default function RegisterForm({ onSubmit, onSwitch }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', repeat: '' });
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const strength = passwordStrength(form.password);

  const errors = {
    username: !form.username.trim() ? 'Elige un nombre de usuario' : null,
    email: !form.email ? 'Escribe tu correo electrónico' : !isValidEmail(form.email) ? 'El correo no es válido' : null,
    password: !form.password ? 'Elige una contraseña' : strength < 2 ? 'La contraseña es demasiado débil' : null,
    repeat: form.repeat !== form.password ? 'Las contraseñas no coinciden' : null,
    accepted: !accepted ? 'Tienes que aceptar las condiciones para crear la cuenta' : null,
  };

  // Cada campo enseña su error al enviar; «Repetir contraseña», también mientras se escribe
  const shown = (field) => (submitted || (field === 'repeat' && form.repeat) ? errors[field] : null);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).every((error) => !error)) onSubmit();
  }

  return (
    <form className="access__form" onSubmit={handleSubmit} noValidate>
      <TextField
        label="Nombre de usuario"
        name="username"
        autoComplete="username"
        icon={userIcon}
        value={form.username}
        onChange={update('username')}
        error={shown('username')}
      />
      <TextField
        label="Correo electrónico"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        icon={mailIcon}
        value={form.email}
        onChange={update('email')}
        error={shown('email')}
      />

      <div className="access__password">
        <TextField
          label="Contraseña"
          type="password"
          name="new-password"
          autoComplete="new-password"
          icon={lockIcon}
          value={form.password}
          onChange={update('password')}
          error={shown('password')}
        />
        {form.password && (
          <div className={`access__strength access__strength--${strength}`}>
            <div className="access__strength-bars" aria-hidden="true">
              {[1, 2, 3, 4].map((level) => (
                <span key={level} className={level <= strength ? 'access__strength-bar--on' : undefined} />
              ))}
            </div>
            <p aria-live="polite">Seguridad: {STRENGTH_LABELS[strength].toLowerCase()}</p>
          </div>
        )}
      </div>

      <TextField
        label="Repetir contraseña"
        type="password"
        name="repeat-password"
        autoComplete="new-password"
        icon={lockIcon}
        value={form.repeat}
        onChange={update('repeat')}
        error={shown('repeat')}
      />

      <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} error={shown('accepted')}>
        Acepto las condiciones de uso y la política de privacidad
      </Checkbox>

      <Button className="access__submit" type="submit">Crear cuenta</Button>

      <p className="access__switch">
        ¿Ya tienes cuenta?{' '}
        <button className="access__link" type="button" onClick={onSwitch}>Inicia sesión</button>
      </p>
    </form>
  );
}
