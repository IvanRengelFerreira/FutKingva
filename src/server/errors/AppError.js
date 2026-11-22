// Error esperado de la API: se responde con su estado HTTP y su código, en el formato común
//   { "error": { "code": "NOT_FOUND", "message": "…", "fields": { … } } }

export class AppError extends Error {
  /**
   * @param {number} status estado HTTP (400, 404…)
   * @param {string} code código para el front ('NOT_FOUND', 'VALIDATION_ERROR'…)
   * @param {string} message texto para mostrar al usuario (en español)
   * @param {Record<string, string>} [fields] errores por campo de formulario o parámetro
   */
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message, fields) {
    return new AppError(400, 'VALIDATION_ERROR', message, fields);
  }

  static notFound(message = 'No se ha encontrado lo que buscas') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  /** Sin sesión (o la sesión ha caducado) */
  static unauthorized(message = 'Tienes que iniciar sesión para hacer esto') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  /** Correo o contraseña incorrectos al iniciar sesión (no se dice cuál de los dos falla) */
  static invalidCredentials(message = 'El correo o la contraseña no son correctos') {
    return new AppError(401, 'INVALID_CREDENTIALS', message);
  }

  /** Con sesión, pero sin permiso (rol insuficiente, cuenta bloqueada, recurso de otro usuario…) */
  static forbidden(message = 'No tienes permiso para hacer esto') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  /** Choca con algo que ya existe (email ya registrado, posición repetida en el equipo ideal…) */
  static conflict(message, fields) {
    return new AppError(409, 'CONFLICT', message, fields);
  }
}
