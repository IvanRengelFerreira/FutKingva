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
}
