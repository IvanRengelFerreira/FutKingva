// Descarga los CSV de transfermarkt-datasets (licencia CC0) que necesita el importador.
// https://github.com/dcaribou/transfermarkt-datasets
// Solo baja los que falten; los archivos quedan en src/server/data/transfermarkt/ (ignorado por git).

import { existsSync, mkdirSync, createWriteStream, renameSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const BASE_URL = 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data';

export const FILES = ['games', 'appearances', 'game_events', 'players', 'clubs'];

export async function ensureFiles(dir) {
  mkdirSync(dir, { recursive: true });
  for (const name of FILES) {
    const target = join(dir, `${name}.csv.gz`);
    if (existsSync(target)) continue;

    const url = `${BASE_URL}/${name}.csv.gz`;
    console.log(`  Descargando ${name}.csv.gz…`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No se pudo descargar ${url} (HTTP ${response.status}).`);
    }
    // Se escribe en un .part y se renombra al acabar: una descarga cortada no deja un archivo a medias
    const partial = `${target}.part`;
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
    renameSync(partial, target);
  }
}
