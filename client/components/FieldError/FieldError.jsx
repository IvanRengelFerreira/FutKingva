import './FieldError.css';
import alertIcon from '../../assets/icon-alert.svg';

// Mensaje de error rojo con icono de alerta, debajo de un campo de formulario.
// Lo usan TextField, Select y Checkbox (no hace falta usarlo directamente en las páginas).
// Diseño: Figma › Mockups › 14 · Acceso › «Las contraseñas no coinciden»
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=58-1289
export default function FieldError({ id, children }) {
  if (!children) return null;

  return (
    <p className="field-error" id={id} role="alert">
      <img src={alertIcon} alt="" width="14" height="14" />
      {children}
    </p>
  );
}
