import { useState } from 'react';
import TextField from '../../components/TextField/TextField.jsx';
import Checkbox from '../../components/Checkbox/Checkbox.jsx';
import Button from '../../components/Button/Button.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import { validateRegister } from '../../../shared/validation/auth.js';
import { passwordStrength, STRENGTH_LABELS } from './validation.js';
import { useFormSubmit } from '../../services/useFormSubmit.js';
import userIcon from '../../assets/icon-user-field.svg';
import mailIcon from '../../assets/icon-mail.svg';
import lockIcon from '../../assets/icon-lock.svg';

// Pestaña «Registrarse» de 14 · Acceso.
// La barra de seguridad se actualiza al escribir la contraseña (solo es una ayuda: lo que se exige
// es lo de src/shared/validation/auth.js); «Las contraseñas no coinciden» sale en cuanto se escribe
// en «Repetir contraseña»; el resto de errores, al pulsar «Crear cuenta».
// onSubmit({ name, email, password, repeat, accepted }) llama al servidor; si falla (p. ej. correo
// ya registrado), aquí se enseña el porqué.
export default function RegisterForm({ onSubmit, onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', repeat: '' });
  const [accepted, setAccepted] = useState(false);
  const { submitted, sending, serverFields, message, clearServerError, submit } = useFormSubmit();

  const strength = passwordStrength(form.password);
  const errors = validateRegister({ ...form, accepted });

  // Cada campo enseña su error al enviar; «Repetir contraseña», también mientras se escribe.
  // Si el formulario vale pero el servidor dice algo de un campo, sale ese mensaje.
  const showLocal = (field) => submitted || (field === 'repeat' && form.repeat);
  const shown = (field) => (showLocal(field) ? errors[field] : null) ?? serverFields[field];

  function update(field) {
    return (e) => {
      setForm({ ...form, [field]: e.target.value });
      clearServerError(field);
    };
  }

  function handleAccepted(e) {
    setAccepted(e.target.checked);
    clearServerError('accepted');
  }

  function handleSubmit(event) {
    event.preventDefault();
    submit(() => onSubmit({ ...form, name: form.name.trim(), email: form.email.trim(), accepted }), errors);
  }

  return (
    <form className="access__form" onSubmit={handleSubmit} noValidate>
      <TextField
        label="Nombre de usuario"
        name="username"
        autoComplete="username"
        icon={userIcon}
        value={form.name}
        onChange={update('name')}
        error={shown('name')}
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

      <Checkbox checked={accepted} onChange={handleAccepted} error={shown('accepted')}>
        Acepto las condiciones de uso y la política de privacidad
      </Checkbox>

      <FieldError>{message}</FieldError>
      <Button className="access__submit" type="submit" disabled={sending}>
        Crear cuenta
      </Button>

      <p className="access__switch">
        ¿Ya tienes cuenta?{' '}
        <button className="access__link" type="button" onClick={onSwitch}>
          Inicia sesión
        </button>
      </p>
    </form>
  );
}
