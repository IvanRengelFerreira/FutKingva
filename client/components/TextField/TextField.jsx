import { useId, useState } from 'react';
import './TextField.css';
import FieldError from '../FieldError/FieldError.jsx';
import eyeIcon from '../../assets/icon-eye.svg';
import eyeOffIcon from '../../assets/icon-eye-off.svg';

// Campo de formulario con etiqueta, borde oro al escribir y estado de error.
// También sirve para textos largos (multiline → <textarea>) y contraseñas (con botón de ojo).
// Diseño: Figma › Mockups › 16 · Contacto (campos) y 14 · Acceso (icono, contraseña y error)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-1292
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-1287
// Uso (la página guarda el valor con useState):
//   const [name, setName] = useState('');
//   <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
//   <TextField label="Correo electrónico" type="email" icon={mailIcon} … />
//   <TextField label="Contraseña" type="password" error="Las contraseñas no coinciden" … />
//   <TextField label="Mensaje" multiline maxLength={1000} … />   → con contador «112 / 1000»
//   <TextField size="sm" label="Buscar" hideLabel placeholder="Buscar por nombre…" icon={searchIcon} … />
//     → size="sm": versión filtro (fondo superficie, 41 px), como el buscador de Equipos y jugadores
// El resto de props (name, required, placeholder, autoComplete…) pasan tal cual al <input>.
export default function TextField({
  label,
  hideLabel = false,
  size = 'md',
  type = 'text',
  icon,
  error,
  hint,
  multiline = false,
  value,
  maxLength,
  disabled = false,
  className = '',
  id,
  ...rest
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const messageId = `${fieldId}-message`;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  // Contador solo en textos largos con límite (como el «112 / 1000» de Contacto)
  const counter = multiline && maxLength ? `${String(value ?? '').length} / ${maxLength}` : null;
  const hasMessage = Boolean(error || hint || counter);

  const controlClasses = [
    'text-field__control',
    size === 'sm' && 'text-field__control--sm',
    multiline && 'text-field__control--multiline',
    error && 'text-field__control--error',
    disabled && 'text-field__control--disabled',
  ].filter(Boolean).join(' ');

  const inputProps = {
    id: fieldId,
    className: 'text-field__input',
    value,
    maxLength,
    disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': hasMessage ? messageId : undefined,
    ...rest,
  };

  return (
    <div className={`text-field ${className}`.trim()}>
      <label
        className={`text-field__label${hideLabel ? ' text-field__label--hidden' : ''}`}
        htmlFor={fieldId}
      >
        {label}
      </label>

      <div className={controlClasses}>
        {icon && <img className="text-field__icon" src={icon} alt="" width={size === 'sm' ? 16 : 17} height={size === 'sm' ? 16 : 17} />}

        {multiline ? <textarea {...inputProps} /> : <input type={inputType} {...inputProps} />}

        {isPassword && (
          <button
            className="text-field__toggle"
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            disabled={disabled}
          >
            <img src={showPassword ? eyeOffIcon : eyeIcon} alt="" width="17" height="17" />
          </button>
        )}
      </div>

      {/* Debajo del campo: el error tiene prioridad sobre la ayuda y el contador */}
      {error ? (
        <FieldError id={messageId}>{error}</FieldError>
      ) : (
        (hint || counter) && (
          <p className="text-field__hint" id={messageId}>
            {hint}
            {hint && counter && ' · '}
            {counter}
          </p>
        )
      )}
    </div>
  );
}
