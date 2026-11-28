# Estadísticas avanzadas de jugadores de LaLiga (`sync/`)

Guía de referencia sobre la migración `20261126191000_player_advanced_stats`, las fuentes externas utilizadas y cómo ejecutar el importador de estadísticas de jugadores.

---

## 1. Qué faltaba en la base de datos y qué añade la migración

Antes de este cambio:

- En **2026/27**, `player_season_stats` solo tenía los 103 goleadores de `football-data.org` (partidos, goles, asistencias y penaltis), sin minutos, titularidades, tarjetas ni valoración.
- En **todas las temporadas (2012/13–2026/27)**, `rating` estaba vacío y no existían columnas para **xG**, **tiros a puerta**, **% de pase** ni **pases clave**, que muestran **04 · Ficha de jugador** y **10 · Comparador**.

La migración `prisma/migrations/20261126191000_player_advanced_stats/migration.sql` añade (sin tocar ningún `CHECK`, índice de expresión ni trigger de `0_init`):

| Tabla / Tipo          | Cambio                         | Restricción / Detalle                                              |
| --------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `data_source`         | Valores `'FOTMOB'` y `'FBREF'` | Identifica el origen en `player_season_stats` y `sync_runs`        |
| `teams`               | `fm_id bigint` (`UNIQUE`)      | Id del club en FotMob para enlazar sin depender de ids internos    |
| `players`             | `fm_id bigint` (`UNIQUE`)      | Id del jugador en FotMob para sincronizaciones repetibles          |
| `player_season_stats` | `xg numeric(5,2)`              | `CHECK (xg IS NULL OR xg >= 0)`                                    |
| `player_season_stats` | `shots_on_target smallint`     | `CHECK (shots_on_target IS NULL OR shots_on_target >= 0)`          |
| `player_season_stats` | `pass_accuracy numeric(4,1)`   | `CHECK (pass_accuracy IS NULL OR pass_accuracy BETWEEN 0 AND 100)` |
| `player_season_stats` | `key_passes smallint`          | `CHECK (key_passes IS NULL OR key_passes >= 0)`                    |

---

## 2. Fuentes de datos utilizadas (y descartadas)

| Fuente                                                                   | Estado                                                                          | Uso en FutKingva                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FotMob / Opta** (`data.fotmob.com`)                                    | Pública, JSON estáticos en CDN, sin API key ni bloqueos (2017/18–2026/27)       | **Fuente principal:** partidos, minutos, goles, penaltis, asistencias, **xG**, **% de pase**, **pases clave**, **amarillas**, **rojas**, **valoración media** y tiros a puerta (respaldo por 90 min) |
| **Kaggle / FBref** (`hubertsidorowicz/football-players-stats-YYYY-YYYY`) | Descarga pública vía API REST de Kaggle, actualizada a diario (2024/25–2026/27) | **Complemento:** aporta **titularidades (`starts`)** y el entero exacto de **tiros a puerta (`SoT`)** (FBref dejó de publicar xG y % de pase de Opta en 2026)                                        |
| `dcaribou/transfermarkt-datasets`                                        | Pipeline pausado en julio de 2026                                               | Descartada para 2026/27 (se conserva lo ya importado de 2012/13–2025/26)                                                                                                                             |
| `api.sofascore.com` / API-Football gratis                                | `403 Forbidden` / temporada 2026 bloqueada en plan gratuito                     | Descartadas para estadísticas de temporada                                                                                                                                                           |

### Correspondencia de campos en FotMob (`league id = 87`)

1. Se consulta `https://www.fotmob.com/api/data/leagues?id=87&season=YYYY/YYYY+1` para obtener las URLs de la temporada en `data.fotmob.com/stats/87/season/<id>/<métrica>.json`.
2. De cada archivo estático se extrae por `(jugador, equipo)`:
   - `mins_played.json` → `played` (`MatchesPlayed`) y `minutes` (`MinutesPlayed`).
   - `goals.json` → `goals` (`StatValue`) y `penalties` (`SubStatValue`, acotado a `<= goals`).
   - `goal_assist.json` → `assists` (`StatValue`).
   - `expected_goals.json` → `xg` (`StatValue`, redondeado a 2 decimales).
   - `ontarget_scoring_att.json` → `shots_on_target` (`round(StatValue * MinutesPlayed / 90)`, sustituido por `SoT` entero si está disponible el CSV de FBref/Kaggle).
   - `accurate_pass.json` → `pass_accuracy` (`SubStatValue`, % entre 0 y 100 con 1 decimal; si no alcanza el mínimo de minutos de FotMob queda `null`).
   - `total_att_assist.json` → `key_passes` (`StatValue`, ocasiones creadas Opta).
   - `yellow_card.json` y `red_card.json` → `yellow_cards` y `red_cards` (`StatValue`; `0` si jugó minutos y no figura en el listado de amonestados).
   - `rating.json` → `rating` (`StatValue` en escala 0–10 con 1 decimal; `null` si no tiene calificación media).

---

## 3. Reglas de emparejado y protección de datos

- **Clubes (`playerMatcher.js`):** tabla fija de los 31 clubes de LaLiga (2017/18–2026/27) referenciados por `fd_id` o `tm_id` (nunca por `id` autoincremental), guardando su `fm_id` al importar.
- **Jugadores (`playerMatcher.js`):**
  1. Primero por `fm_id` si ya estaba vinculado.
  2. Después dentro de la plantilla/historial de ese club por nombre normalizado sin tildes, apellidos, alias conocidos (`Yeremay Hernández` ↔ `Peke`, `Alejandro Santiago` ↔ `Muñeco`, `Yusi` ↔ `Youssef Enríquez`) y año de nacimiento en caso de homónimos (`Pablo García` en el Racing).
  3. Respaldo global solo si el nombre completo normalizado es único en toda la tabla `players`.
  4. Los canteranos o altas recientes que aún no existen en `players` se omiten sin crear duplicados.
- **Respeto al editor (`19 · Actualizar datos`):** cualquier columna marcada con `"EDITOR"` dentro de `player_season_stats.field_sources` **nunca se sobrescribe**, y siempre se garantiza `CHECK (penalties <= goals)`.
- **Respeto al histórico de Transfermarkt:** al importar temporadas pasadas (`< temporada actual`), se conservan `played`, `starts`, `minutes`, `goals`, `assists`, `penalties`, `yellow_cards` y `red_cards` que ya existan, rellenando únicamente lo que faltaba (`xg`, `shots_on_target`, `pass_accuracy`, `key_passes` y `rating`).

---

## 4. Cómo ejecutarlo (PowerShell)

Todos los comandos se lanzan desde `src/server` con el contenedor `futkingva-db` arrancado:

```powershell
cd src/server

# 1. Si acabas de hacer git pull y aún no tenías aplicada la migración:
npx prisma@7.10.1 migrate deploy
npx prisma@7.10.1 generate

# 2. Probar en seco (no escribe nada en la BD):
npm run import:stats:dry

# 3. Importar la temporada actual (2026/27):
npm run import:stats

# 4. (Opcional) Importar una temporada concreta (p. ej. 2025/26):
node sync/importPlayerStats.js --season=2025

# 5. (Opcional) Rellenar xG, % pase, pases clave, tiros y valoración en todas las temporadas disponibles (2017/18–2026/27):
node sync/importPlayerStats.js --all-seasons

# 6. (Opcional) Pasar un CSV local de FBref en vez de descargarlo de Kaggle:
node sync/importPlayerStats.js --season=2026 --fbref-csv="C:\ruta\players_data_light-2026_2027.csv"

# 7. Probar e importar los retratos de futbolistas que faltan desde FotMob:
npm run import:photos:dry
npm run import:photos

# 8. Probar e importar las apariciones y valoraciones por partido (temporada actual o todas 2017/18–2026/27):
npm run import:appearances:dry
npm run import:appearances
node sync/importAppearances.js --all-seasons

# 9. Probar e importar los datos y estadísticas de árbitros (metadatos CTA/FIFA + temporada actual):
npm run import:referees:dry
npm run import:referees
```

---

## 5. Retratos de futbolistas (`20261127023000_player_photos` e `importPlayerPhotos.js`)

- **Esquema (`players`):**
  - Añade `photo_source data_source` junto a `photo_url` con restricciones `CHECK` para impedir cadenas vacías o siluetas genéricas (`default.jpg`) y exigir que `(photo_url IS NULL) = (photo_source IS NULL)`.
  - Conserva los **2.520** retratos reales del histórico marcados como `'TRANSFERMARKT'` y limpia a `NULL` las **198** siluetas `default.jpg` de Transfermarkt.
- **Importador (`sync/importPlayerPhotos.js`):**
  1. Busca únicamente jugadores con `photo_url IS NULL` (los `CHECK` garantizan que entonces tampoco tienen `photo_source`, así que nunca pisa una foto puesta por un editor).
  2. Enlaza los `fm_id` pendientes cruzando primero las plantillas completas de FotMob (`/api/data/teams`) y después el autocompletado (`/searchapi/suggest`). **Siempre tiene que coincidir el nombre exacto**:
     - En las plantillas, el nombre (apodo o nombre completo) y, si los dos lados lo tienen, el año de nacimiento. Si dos jugadores de FotMob encajan con el mismo de la BD, se deja sin enlazar.
     - En el buscador, primero entre los de sus clubes; sin club en común, solo con el nombre completo (dos palabras o más, nunca un apodo de una palabra) y si es el único resultado con ese nombre.
  3. Verifica con `HEAD` en `images.fotmob.com/image_resources/playerimages/<fm_id>.png` que exista un retrato real (`200 image/*`) antes de guardar `photo_url` y `photo_source = 'FOTMOB'`.
  4. **Un `fm_id` nuevo solo se guarda junto con su retrato verificado.** Si no hay foto no se guarda nada: `importPlayerStats` empareja por `fm_id` y un enlace dudoso metería las estadísticas de un jugador en otro.
  5. Si falla una plantilla o una búsqueda (429, timeout…), se cuenta como petición fallida y la importación sigue. El buscador va con 2 peticiones a la vez y una pausa de 250 ms entre ellas.
  6. Cada ejecución queda en `sync_runs` (`resource = 'player_photos'`): `OK` con los retratos añadidos (y, si hubo peticiones fallidas, cuántas en `error`) o, si la importación entera falla, `ERROR` con el motivo.
  - ⚠ Incluso `import:photos:dry` necesita la migración `20261127023000_player_photos` aplicada (lee `photo_source`).
  7. Quienes no tienen retrato oficial en ningún proveedor quedan con `photo_url = NULL` y el componente `<Avatar />` muestra automáticamente sus iniciales.

---

## 6. Apariciones y valoraciones por partido (`20261128213000_match_appearances_rating` e `importAppearances.js`)

- **Esquema (`matches` y `appearances`):**
  - Añade `fm_id bigint UNIQUE` en `matches` para enlazar cada partido real con FotMob y hacer las siguientes importaciones incrementales.
  - Añade `rating numeric(3,1)` (`CHECK 0..10`) y `pass_accuracy numeric(4,1)` (`CHECK 0..100`) en `appearances`.
- **Importador (`sync/importAppearances.js`):**
  1. Empareja los partidos finalizados de FotMob (`/api/data/leagues`) con `matches` (`is_simulated = false`) y omite los que ya tienen `fm_id` y valoraciones cargadas (salvo `--force`).
  2. Descarga `/api/data/matchDetails` con concurrencia moderada y reintento automático.
  3. En la **temporada actual (`2026/27`)** inserta y actualiza `appearances` completas (titularidad, minutos, goles, asistencias, tarjetas, `rating` y `pass_accuracy`).
  4. En **temporadas históricas (`2017/18–2025/26`)** conserva intactos los minutos, goles, asistencias y tarjetas de Transfermarkt y rellena únicamente `rating` y `pass_accuracy`.
  5. Registra cada ejecución por temporada en `sync_runs` (`resource = 'appearances'`).

---

## 7. Árbitros y estadísticas arbitrales (`20261128214500_referee_photos`, `refereeMetadata.js` e `importReferees.js`)

- **Esquema y metadatos (`referees`):**
  - Añade `fm_id bigint UNIQUE`, `photo_url` y `photo_source` con los mismos `CHECK` que en `players`.
  - Completa `committee` (comité territorial CTA), `is_fifa`, `first_season` (debut en Primera División), `short_name` y verifica con `HEAD` en el CDN de FotMob cada retrato oficial en PNG (`photo_source = 'FOTMOB'`; si no existe retrato, `<Avatar />` muestra iniciales).
- **Partidos, eventos y estadísticas (`matches`, `match_events` y `referee_season_stats`):**
  1. Asigna `matches.referee_id` en todos los partidos finalizados de la temporada actual desde FotMob (`/api/data/matchDetails`), creando el árbitro si debuta y aún no existía.
  2. Guarda en `match_events` las tarjetas y goles/penaltis con `external_key` único (`skipDuplicates`) para que las rojas por partido y temporada de `06 · Árbitros` y `07 · Ficha de árbitro` cuadren con los partidos dirigidos.
  3. Calcula y actualiza `referee_season_stats` (`matches`, `yellow_cards`, `red_cards`, `penalties`) respetando `field_sources`, y repara `red_cards = 0` en históricos donde ya existían `RED_CARD` en `match_events`.

---

## 8. Archivos implicados

- **Esquema y migraciones:**
  - `src/server/prisma/schema.prisma`
  - `src/server/prisma/migrations/20261126191000_player_advanced_stats/migration.sql`
  - `src/server/prisma/migrations/20261127023000_player_photos/migration.sql`
  - `src/server/prisma/migrations/20261128213000_match_appearances_rating/migration.sql`
  - `src/server/prisma/migrations/20261128214500_referee_photos/migration.sql`
- **Importadores:**
  - `src/server/sync/fotmobClient.js` — descarga de feeds de estadísticas, partidos/detalles por jornada, plantillas, sugerencias y verificación `HEAD` de retratos en FotMob.
  - `src/server/sync/kaggleFbref.js` — descarga y lectura en memoria del ZIP/CSV de Kaggle (`node:zlib`).
  - `src/server/sync/playerMatcher.js` — cruce de clubes y jugadores contra `teams` y `players`.
  - `src/server/sync/importPlayerStats.js` — fusión, respeto a `field_sources`, guardado transaccional, registro en `sync_runs` y CLI.
  - `src/server/sync/importAppearances.js` — importación incremental de apariciones, valoraciones y % de pase por partido.
  - `src/server/sync/refereeMetadata.js` e `importReferees.js` — metadatos CTA/FIFA, enlace arbitral en `matches`, eventos y `referee_season_stats`.
  - `src/server/sync/importPlayerPhotos.js` — enlace de `fm_id` pendientes (solo con nombre coincidente), verificación de retratos en CDN y guardado transaccional de `photo_url` + `photo_source` (y del `fm_id` nuevo solo si hay retrato).
- **Exposición en la API y formato en el cliente:**
  - `src/server/utils/players.js`, `src/server/controllers/players.js`, `teams.js`, `home.js`, `comparisons.js`, `articles.js` y `playerData.js` — exponen `xg`, `shotsOnTarget`, `passAccuracy`, `keyPasses` y `photoUrl`.
  - `src/client/components/Avatar/Avatar.jsx` — muestra el retrato del jugador con carga diferida (`lazy`) y respaldo automático a iniciales si falta o falla la URL.
  - `src/client/views/PlayerProfile/format.js` — redondea `passAccuracy` al entero al mostrar `%` en la ficha del jugador (`94.4` → `94 %`), manteniendo el decimal en base de datos para desempatar en el Comparador.
