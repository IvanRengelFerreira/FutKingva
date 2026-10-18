import { Link } from 'react-router';
import './Button.css';

// Botón de la web: primario (oro), secundario (borde oro), terciario y peligro.
// Diseño: Figma › Guía de estilo › 3. Componentes › Botones
// https://www.figma.com/design/jxq2ktu8XWk06sm5n6F8CP?node-id=30-24
// Uso:
//   <Button onClick={guardar}>Guardar</Button>                 → primario
//   <Button variant="secondary">★ Seguir</Button>
//   <Button variant="danger" disabled>Eliminar usuario</Button>
//   <Button to="/acceso">Crear cuenta</Button>                 → enlace con aspecto de botón
//   <Button type="submit">Entrar</Button>                      → dentro de un formulario
export default function Button({
  variant = 'primary',
  to,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = `button button--${variant} ${className}`.trim();

  // Si lleva «to» es un enlace a otra página (con React Router)
  if (to) {
    return (
      <Link className={classes} to={to} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
