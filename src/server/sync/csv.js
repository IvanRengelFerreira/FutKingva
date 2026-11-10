// Lector de CSV comprimidos (.csv.gz) línea a línea, sin cargar el archivo entero en memoria.
// Entiende campos entre comillas con comas, comillas dobles ("") y saltos de línea dentro.
// Devuelve cada fila como objeto { cabecera: valor } con los valores en texto ('' = vacío).

import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';

/**
 * Parte una línea de CSV en campos.
 * @returns {{ fields: string[], open: boolean }} open = la línea acaba dentro de unas comillas
 */
function splitLine(line, state = { fields: [], field: '', quoted: false }) {
  let { field, quoted } = state;
  const fields = state.fields;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      fields.push(field);
      field = '';
    } else {
      field += c;
    }
  }
  return { fields, field, quoted };
}

/**
 * Recorre las filas de un .csv.gz.
 * @param {string} file ruta del archivo
 * @param {(row: Record<string, string>) => boolean} [filter] si devuelve false, la fila se salta
 */
export async function* readCsvGz(file, filter) {
  const lines = createInterface({
    input: createReadStream(file).pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  let header = null;
  let pending = null; // fila a medias (campo entre comillas con salto de línea)

  for await (const line of lines) {
    const state = pending ? { ...pending, field: pending.field + '\n' } : undefined;
    const parsed = splitLine(line, state);
    if (parsed.quoted) {
      pending = parsed;
      continue;
    }
    pending = null;
    const values = [...parsed.fields, parsed.field];

    if (!header) {
      header = values;
      continue;
    }
    const row = {};
    for (let j = 0; j < header.length; j++) row[header[j]] = values[j] ?? '';
    if (!filter || filter(row)) yield row;
  }
}
