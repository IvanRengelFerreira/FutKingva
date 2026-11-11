// Cliente de football-data.org (API v4), con fetch de Node y sin paquetes.
// Plan gratuito: 10 peticiones por minuto → se deja al menos 6,5 s entre peticiones
// y, si aun así llega un 429, se espera lo que diga la API y se reintenta.

const BASE_URL = 'https://api.football-data.org/v4';
const MIN_GAP_MS = 6500;
const MAX_RETRIES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createFootballDataClient(token = process.env.FOOTBALL_ORG_API) {
  if (!token) {
    throw new Error('Falta FOOTBALL_ORG_API en src/server/.env (token gratuito de football-data.org).');
  }

  let lastRequestAt = 0;
  let requests = 0;

  async function get(path) {
    for (let attempt = 0; ; attempt++) {
      const wait = lastRequestAt + MIN_GAP_MS - Date.now();
      if (lastRequestAt && wait > 0) await sleep(wait);
      lastRequestAt = Date.now();
      requests++;

      const response = await fetch(`${BASE_URL}${path}`, { headers: { 'X-Auth-Token': token } });

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const seconds = Number(response.headers.get('x-requestcounter-reset')) || 60;
        console.warn(`  Límite de peticiones alcanzado: espero ${seconds} s…`);
        await sleep(seconds * 1000);
        continue;
      }
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`football-data.org ${path} → HTTP ${response.status}: ${body.slice(0, 300)}`);
      }
      return response.json();
    }
  }

  return { get, requestCount: () => requests };
}
