// Descarga opcional del CSV de FBref publicado en Kaggle (hubertsidorowicz/football-players-stats-YYYY-YYYY)
// para aportar titularidades (Starts) y tiros a puerta enteros exactos (SoT) sin instalar paquetes externos.

import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

const KAGGLE_DOWNLOAD_BASE = 'https://www.kaggle.com/api/v1/datasets/download/hubertsidorowicz';
const LALIGA_COMP = 'es La Liga';
const REQUEST_TIMEOUT_MS = 20000;

// Cabecera local de archivo ZIP («PK\x03\x04») y método DEFLATE (8)
const ZIP_LOCAL_HEADER_SIG = 0x04034b50;
const ZIP_STORED = 0;
const ZIP_DEFLATE = 8;
const ZIP_EOCD_SIG = 0x06054b50;
const ZIP_CENTRAL_SIG = 0x02014b50;
const MAX_EOCD_COMMENT = 65557;

function findCentralDirectoryOffset(buf) {
  const minPos = Math.max(0, buf.length - MAX_EOCD_COMMENT);
  for (let pos = buf.length - 22; pos >= minPos; pos--) {
    if (buf.readUInt32LE(pos) === ZIP_EOCD_SIG) {
      return { offset: buf.readUInt32LE(pos + 16), entries: buf.readUInt16LE(pos + 10) };
    }
  }
  return null;
}

// Lee el directorio central del ZIP (funciona incluso cuando los tamaños van en data descriptors con bit 3)
function extractLightCsvFromZip(buf) {
  const dir = findCentralDirectoryOffset(buf);
  if (!dir) return null;

  let cursor = dir.offset;
  for (let i = 0; i < dir.entries && cursor + 46 <= buf.length; i++) {
    if (buf.readUInt32LE(cursor) !== ZIP_CENTRAL_SIG) break;
    const method = buf.readUInt16LE(cursor + 10);
    const compressedSize = buf.readUInt32LE(cursor + 20);
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const localOffset = buf.readUInt32LE(cursor + 42);
    const fileName = buf.subarray(cursor + 46, cursor + 46 + nameLen).toString('utf8');
    cursor += 46 + nameLen + extraLen + commentLen;

    if (!fileName.includes('light') || !fileName.endsWith('.csv')) continue;
    if (buf.readUInt32LE(localOffset) !== ZIP_LOCAL_HEADER_SIG) return null;

    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const slice = buf.subarray(dataStart, dataStart + compressedSize);

    if (method === ZIP_STORED) return slice.toString('utf8');
    if (method === ZIP_DEFLATE) return inflateRawSync(slice).toString('utf8');
  }
  return null;
}

// Lector RFC 4180 sencillo: soporta comas dentro de comillas («"MF,FW"») y comillas escapadas («""»)
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseIntOrNull(raw) {
  if (raw == null || raw === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 ? Math.trunc(num) : null;
}

function parseLaLigaRows(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols[idx.Comp] !== LALIGA_COMP) continue;
    rows.push({
      name: (cols[idx.Player] ?? '').trim(),
      squad: (cols[idx.Squad] ?? '').trim(),
      bornYear: parseIntOrNull(cols[idx.Born]),
      played: parseIntOrNull(cols[idx.MP]),
      starts: parseIntOrNull(cols[idx.Starts]),
      minutes: parseIntOrNull(cols[idx.Min]),
      shotsOnTarget: parseIntOrNull(cols[idx.SoT]),
      yellowCards: parseIntOrNull(cols[idx.CrdY]),
      redCards: parseIntOrNull(cols[idx.CrdR]),
    });
  }
  return rows;
}

/**
 * Devuelve las filas de LaLiga en FBref/Kaggle para `startYear` (disponible desde 2024/25), o `[]` si no existe.
 */
export async function fetchFbrefSeasonStats(startYear, localCsvPath = null) {
  if (localCsvPath) {
    const csvText = await readFile(localCsvPath, 'utf8');
    return { rows: parseLaLigaRows(csvText), requests: 0 };
  }

  // El autor publica datasets anuales a partir de la 2024-2025
  if (startYear < 2024) return { rows: [], requests: 0 };
  const slug = `football-players-stats-${startYear}-${startYear + 1}`;
  const url = `${KAGGLE_DOWNLOAD_BASE}/${slug}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) return { rows: [], requests: 1 };
    const buffer = Buffer.from(await response.arrayBuffer());
    const csvText = extractLightCsvFromZip(buffer);
    return { rows: csvText ? parseLaLigaRows(csvText) : [], requests: 1 };
  } catch {
    // Si Kaggle falla o no existe esa temporada, seguimos con los datos de FotMob
    return { rows: [], requests: 1 };
  }
}
