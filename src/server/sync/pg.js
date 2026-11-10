// Conexión directa a PostgreSQL con `pg` para las cargas masivas (importadores).
// La API REST usará Prisma; aquí se usa SQL porque hay que insertar cientos de miles
// de filas con INSERT … ON CONFLICT, y Prisma lo haría fila a fila.

import pg from 'pg';

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  // Sin .env (p. ej. en Docker): DATABASE_URL tiene que venir del entorno.
}

export function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta DATABASE_URL (copia .env.example como .env en src/server).');
  }
  return new pg.Pool({ connectionString: process.env.DATABASE_URL });
}

const CHUNK = 5000;

/**
 * Inserta (o actualiza) muchas filas de golpe con unnest():
 *   INSERT INTO tabla (a, b) SELECT * FROM unnest($1::tipo[], $2::tipo[]) <onConflict> RETURNING …
 * Un parámetro por columna (no por valor), así que no hay límite de filas por consulta.
 *
 * @param {import('pg').PoolClient} client
 * @param {object} options
 * @param {string} options.table
 * @param {Array<[string, string]>} options.columns [nombre, tipo SQL] en el orden de cada fila
 * @param {unknown[][]} options.rows valores de cada fila, en el orden de `columns`
 * @param {string} [options.onConflict] p. ej. 'ON CONFLICT (tm_id) DO UPDATE SET name = EXCLUDED.name'
 * @param {string} [options.returning] p. ej. 'id, tm_id'
 * @returns {Promise<object[]>} filas devueltas por RETURNING (todas las tandas juntas)
 */
export async function bulkUpsert(client, { table, columns, rows, onConflict = '', returning }) {
  const names = columns.map(([name]) => name).join(', ');
  const params = columns.map(([, type], i) => `$${i + 1}::${type}[]`).join(', ');
  const sql = `INSERT INTO ${table} (${names}) SELECT * FROM unnest(${params}) ${onConflict}`
    + (returning ? ` RETURNING ${returning}` : '');

  const result = [];
  for (let start = 0; start < rows.length; start += CHUNK) {
    const chunk = rows.slice(start, start + CHUNK);
    const arrays = columns.map((_, i) => chunk.map((row) => row[i] ?? null));
    const { rows: returned } = await client.query(sql, arrays);
    result.push(...returned);
  }
  return result;
}
