import { useState } from 'react';
import { Link } from 'react-router';
import TextField from '../../components/TextField/TextField.jsx';
import Checkbox from '../../components/Checkbox/Checkbox.jsx';
import Button from '../../components/Button/Button.jsx';
import FieldError from '../../components/FieldError/FieldError.jsx';
import { validateLogin } from '../../../shared/validation/auth.js';
import { useFormSubmit } from '../../services/useFormSubmit.js';
import mailIcon from '../../assets/icon-mail.svg';
import lockIcon from '../../assets/icon-lock.svg';

// Pestaña «Iniciar sesión» de 14 · Acceso.
// Los errores salen al pulsar «Entrar» y se van en cuanto se corrige el campo.
// onSubmit({ email, password, remember }) llama al servidor; si falla, aquí se enseña el porqué.
export default function LoginForm({ onSubmit, onSwitch }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const { submitted, sending, serverFields, message, clearServerError, submit } = useFormSubmit();

  const errors = validateLogin(form);
  const shown = (field) => (submitted ? errors[field] : null) ?? serverFields[field];

  function update(field) {
    return (e) => {
      setForm({ ...form, [field]: e.target.value });
      clearServerError(field);
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    submit(() => onSubmit({ email: form.email.trim(), password: form.password, remember }), errors);
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
        value={form.email}
        onChange={update('email')}
        error={shown('email')}
      />
      <TextField
        label="Contraseña"
        type="password"
        name="password"
        autoComplete="current-password"
        icon={lockIcon}
        value={form.password}
        onChange={update('password')}
        error={shown('password')}
      />

      <div className="access__row">
        <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>Recordarme</Checkbox>
        {/* De momento no hay recuperación de contraseña: lleva a Contacto */}
        <Link className="access__link" to="/contacto">¿Olvidaste tu contraseña?</Link>
      </div>

      <FieldError>{message}</FieldError>
      <Button className="access__submit" type="submit" disabled={sending}>Entrar</Button>

      <p className="access__switch">
        ¿No tienes cuenta?{' '}
        <button className="access__link" type="button" onClick={onSwitch}>Regístrate</button>
      </p>
    </form>
  );
}
