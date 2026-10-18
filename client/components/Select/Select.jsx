import { useId } from 'react';
import './Select.css';
import FieldError from '../FieldError/FieldError.jsx';
import chevronIcon from '../../assets/icon-chevron-down.svg';

// Desplegable con flecha. Usa el <select> del navegador (funciona con teclado y en móvil)
// con el aspecto de la guía de estilo.
// Dos tamaños:
//   size="md" (por defecto) → formularios con etiqueta: Contacto, Editor de artículo, Actualizar datos
//   size="sm"               → filtros sobre la página: Equipos, Clasificaciones, Admin
// Diseño: Figma › Mockups › 16 · Contacto (Asunto) y 02 · Equipos y jugadores (Filtros)
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=59-1306
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=43-130
// Uso (la página guarda la opción elegida con useState):
//   const [subject, setSubject] = useState('datos');
//   <Select
//     label="Asunto"
//     options={[{ value: 'datos', label: 'Error en los datos' }, { value: 'otro', label: 'Otro' }]}
//     value={subject}
//     onChange={(e) => setSubject(e.target.value)}
//   />
//   <Select size="sm" label="Liga" hideLabel options={['LaLiga', 'Premier League']} … />
// Las opciones pueden ser textos ('LaLiga') u objetos { value, label }.
// placeholder="Elige un asunto" añade una primera opción vacía que no se puede volver a elegir.
export default function Select({
  label,
  hideLabel = false,
  options = [],
  placeholder,
  size = 'md',
  error,
  disabled = false,
  className = '',
  id,
  ...rest
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const messageId = `${fieldId}-message`;

  const controlClasses = [
    'select__control',
    `select__control--${size}`,
    error && 'select__control--error',
  ].filter(Boolean).join(' ');

  return (
    <div className={`select ${className}`.trim()}>
      {label && (
        <label
          className={`select__label${hideLabel ? ' select__label--hidden' : ''}`}
          htmlFor={fieldId}
        >
          {label}
        </label>
      )}

      <div className={controlClasses}>
        <select
          id={fieldId}
          className="select__input"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          {...rest}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((option) => {
            const { value, label: text } = typeof option === 'object' ? option : { value: option, label: option };
            return <option key={value} value={value}>{text}</option>;
          })}
        </select>
        <img
          className="select__chevron"
          src={chevronIcon}
          alt=""
          width={size === 'sm' ? 14 : 16}
          height={size === 'sm' ? 14 : 16}
        />
      </div>

      <FieldError id={messageId}>{error}</FieldError>
    </div>
  );
}
