// Comprueba el cuerpo de la petición con una función de reglas antes de llegar al controlador.
// La función recibe req.body y devuelve { campo: 'mensaje' } con los campos que fallan ({} si todo vale);
// las de los formularios están en src/shared/validation/ y las usa también el front.
//
//   authRouter.post('/login', validate(validateLogin), auth.login);
//
// Si algo falla responde 400 VALIDATION_ERROR con esos `fields`, y el controlador ya no se ejecuta.

import { AppError } from '../errors/AppError.js';

export function validate(validator) {
  return (req, res, next) => {
    // Sin cabecera Content-Type: application/json, Express 5 deja req.body sin definir
    req.body ??= {};
    const fields = validator(req.body);
    if (Object.keys(fields).length) throw AppError.badRequest('Revisa los datos del formulario', fields);
    next();
  };
}
