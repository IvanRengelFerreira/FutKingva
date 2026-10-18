import { useId } from 'react';
import './Checkbox.css';
import FieldError from '../FieldError/FieldError.jsx';
import checkIcon from '../../assets/icon-check.svg';

// Casilla de verificación con su texto al lado. Marcada: cuadrado oro con ✓.
// Por dentro es un <input type="checkbox"> de verdad (funciona con teclado y lectores de pantalla).
// Diseño: Figma › Mockups › 16 · Contacto («Acepto la política de privacidad») y 14 · Acceso («Recordarme»)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-1313
// Uso (la página guarda si está marcada con useState):
//   const [accepted, setAccepted] = useState(false);
//   <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)}>
//     Acepto la política de privacidad
//   </Checkbox>
//   <Checkbox … error="Tienes que aceptar la política de privacidad">…</Checkbox>
// El texto puede llevar enlaces: <Checkbox>Acepto las <Link to="/…">condiciones de uso</Link></Checkbox>
export default function Checkbox({ children, error, className = '', id, ...rest }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const messageId = `${fieldId}-message`;

  return (
    <div className={`checkbox ${className}`.trim()}>
      <label className={`checkbox__label${error ? ' checkbox__label--error' : ''}`} htmlFor={fieldId}>
        <input
          id={fieldId}
          className="checkbox__input"
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          {...rest}
        />
        <span className="checkbox__box" aria-hidden="true">
          <img src={checkIcon} alt="" width="13" height="13" />
        </span>
        <span className="checkbox__text">{children}</span>
      </label>

      <FieldError id={messageId}>{error}</FieldError>
    </div>
  );
}
