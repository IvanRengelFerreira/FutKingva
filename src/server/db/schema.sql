-- =====================================================================
-- FutKingva · Esquema de la base de datos (PostgreSQL 17)
-- =====================================================================
-- Flujo: este archivo crea las tablas → `npx prisma db pull` genera
-- schema.prisma a partir de la BD → `npx prisma generate` crea el cliente.
-- Las tablas se cambian AQUÍ, nunca en schema.prisma.
--
-- Aplicar sobre la BD de Docker (vacía):
--   docker exec -i futkingva-db psql -U futkingva -d futkingva -v ON_ERROR_STOP=1 < src/server/db/schema.sql
--
-- Convenciones:
--   · Tablas y columnas en inglés, snake_case, tablas en plural.
--   · Fechas con zona horaria (timestamptz), guardadas en UTC; la web las muestra en hora de Madrid.
--   · Todos los ids son numéricos: bigint (64 bits) GENERATED ALWAYS AS IDENTITY,
--     y bigint también en todas las claves ajenas. Nunca ids de texto.
--   · Ids de las tres fuentes en columnas propias, únicas, para sincronizar sin duplicar:
--       fd_id = football-data.org · af_id = API-Football · tm_id = Transfermarkt
--     (la competición de Transfermarkt es un código, 'ES1', y va en tm_code)
--   · La tabla `session` es la excepción: su formato lo fija connect-pg-simple (sid de texto).
--   · Origen de cada dato (data_source) para mostrar «estimado» o «corregido por un editor»
--     y para que la sincronización no pise lo que ha puesto un editor.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------

CREATE TYPE user_role        AS ENUM ('USER', 'EDITOR', 'ADMIN');
CREATE TYPE user_status      AS ENUM ('ACTIVE', 'BLOCKED');

-- De dónde sale un dato
CREATE TYPE data_source      AS ENUM ('FOOTBALL_DATA', 'API_FOOTBALL', 'TRANSFERMARKT', 'EDITOR', 'ESTIMATED', 'SIMULATOR');

-- Estados de partido de football-data.org (se guardan tal cual)
CREATE TYPE match_status     AS ENUM ('SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED', 'FINISHED', 'SUSPENDED', 'POSTPONED', 'CANCELLED', 'AWARDED');

CREATE TYPE match_event_type AS ENUM ('GOAL', 'OWN_GOAL', 'PENALTY_GOAL', 'MISSED_PENALTY',
                                      'YELLOW_CARD', 'SECOND_YELLOW', 'RED_CARD', 'SUBSTITUTION', 'VAR');

-- Posición general (la de football-data: Goalkeeper / Defence / Midfield / Offence).
-- La detallada («Extremo», «Lateral derecho»…) va en players.detailed_position.
CREATE TYPE position_group   AS ENUM ('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD');
CREATE TYPE preferred_foot   AS ENUM ('LEFT', 'RIGHT', 'BOTH');

CREATE TYPE article_status   AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE report_status    AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
CREATE TYPE notification_type AS ENUM ('GOAL', 'CARD', 'MATCH_START', 'MATCH_END', 'STANDINGS', 'ARTICLE', 'SYSTEM');
CREATE TYPE sync_status      AS ENUM ('RUNNING', 'OK', 'ERROR');

-- ---------------------------------------------------------------------
-- updated_at automático (lo pone la BD, no el servidor)
-- ---------------------------------------------------------------------

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- 1. Competiciones y temporadas
-- =====================================================================

CREATE TABLE competitions (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              text        NOT NULL,                    -- 'LaLiga' (la API dice «Primera Division»)
  country           text,
  emblem_url        text,
  fd_id             bigint      UNIQUE,                      -- 2014 (código PD)
  af_id             bigint      UNIQUE,                      -- 140
  tm_code           text        UNIQUE,                      -- 'ES1'
  current_season_id bigint,                                 -- FK más abajo (seasons aún no existe)
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE seasons (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  competition_id   bigint      NOT NULL REFERENCES competitions (id) ON DELETE CASCADE,
  start_year       smallint    NOT NULL,                     -- 2026 → temporada 2026/27
  label            text        NOT NULL,                     -- '2026/27'
  starts_on        date,
  ends_on          date,
  current_matchday smallint,
  fd_id            bigint      UNIQUE,
  UNIQUE (competition_id, start_year),
  CHECK (start_year BETWEEN 1900 AND 2100),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on > starts_on)
);

ALTER TABLE competitions
  ADD CONSTRAINT competitions_current_season_fk
  FOREIGN KEY (current_season_id) REFERENCES seasons (id) ON DELETE SET NULL;

-- =====================================================================
-- 2. Equipos, jugadores y árbitros
-- =====================================================================

CREATE TABLE teams (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           text        NOT NULL,                       -- 'FC Barcelona'
  short_name     text        NOT NULL,                       -- 'Barça'
  tla            char(3),                                    -- 'FCB'
  crest_url      text,
  founded        smallint,
  club_colors    text,
  venue          text,
  venue_capacity integer,
  city           text,
  website        text,
  fd_id          bigint      UNIQUE,
  af_id          bigint      UNIQUE,
  tm_id          bigint      UNIQUE,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (venue_capacity IS NULL OR venue_capacity > 0)
);

-- Qué equipos juegan cada temporada y con qué entrenador
CREATE TABLE season_teams (
  season_id  bigint  NOT NULL REFERENCES seasons (id) ON DELETE CASCADE,
  team_id    bigint  NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  coach_name text,
  PRIMARY KEY (season_id, team_id)
);

CREATE TABLE players (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              text           NOT NULL,                 -- como se muestra: 'Pedri'
  first_name        text,
  last_name         text,
  date_of_birth     date,                                    -- sirve para emparejar Transfermarkt ↔ football-data
  nationality       text,
  position          position_group,                          -- NULL = «Sin posición»
  detailed_position text,                                    -- 'Extremo', 'Central'… (Transfermarkt o editor)
  foot              preferred_foot,
  height_cm         smallint,
  photo_url         text,
  market_value_eur  bigint,
  team_id           bigint         REFERENCES teams (id) ON DELETE SET NULL,  -- equipo actual
  shirt_number      smallint,
  fd_id             bigint         UNIQUE,
  af_id             bigint         UNIQUE,
  tm_id             bigint         UNIQUE,
  updated_at        timestamptz    NOT NULL DEFAULT now(),
  CHECK (height_cm IS NULL OR height_cm BETWEEN 140 AND 220),
  CHECK (shirt_number IS NULL OR shirt_number BETWEEN 1 AND 99),
  CHECK (market_value_eur IS NULL OR market_value_eur >= 0)
);

CREATE INDEX players_team_idx ON players (team_id);
CREATE INDEX players_name_idx ON players (lower(name));    -- búsqueda por nombre (RF10)

CREATE TABLE referees (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           text        NOT NULL,                       -- 'Jesús Gil Manzano'
  short_name     text,                                       -- 'Gil Manzano'
  nationality    text,
  committee      text,                                       -- comité territorial
  is_fifa        boolean     NOT NULL DEFAULT false,
  first_season   smallint,                                   -- año de debut en Primera
  fd_id          bigint      UNIQUE,
  af_id          bigint      UNIQUE,
  updated_at     timestamptz NOT NULL DEFAULT now()
);
-- Transfermarkt no da id de árbitro, solo el nombre: se empareja por nombre al importar.

-- =====================================================================
-- 3. Partidos, eventos y estadísticas por partido
-- =====================================================================

CREATE TABLE matches (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  season_id       bigint       NOT NULL REFERENCES seasons (id) ON DELETE CASCADE,
  matchday        smallint,
  utc_date        timestamptz  NOT NULL,
  status          match_status NOT NULL DEFAULT 'SCHEDULED',
  minute          smallint,                                  -- minuto actual si está en juego
  home_team_id    bigint       NOT NULL REFERENCES teams (id),
  away_team_id    bigint       NOT NULL REFERENCES teams (id),
  home_goals      smallint,
  away_goals      smallint,
  home_goals_ht   smallint,                                  -- descanso
  away_goals_ht   smallint,
  referee_id      bigint       REFERENCES referees (id) ON DELETE SET NULL,
  venue           text,                                      -- NULL = estadio del local
  attendance      integer,
  home_formation  text,
  away_formation  text,
  home_coach      text,
  away_coach      text,
  source          data_source  NOT NULL,
  is_simulated    boolean      NOT NULL DEFAULT false,       -- partido del simulador de la demo
  fd_id           bigint       UNIQUE,
  af_id           bigint       UNIQUE,
  tm_id           bigint       UNIQUE,
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  CHECK (home_team_id <> away_team_id),
  CHECK (home_goals IS NULL OR home_goals >= 0),
  CHECK (away_goals IS NULL OR away_goals >= 0),
  CHECK (minute IS NULL OR minute BETWEEN 0 AND 130),
  CHECK (attendance IS NULL OR attendance >= 0),
  CHECK (status <> 'FINISHED' OR (home_goals IS NOT NULL AND away_goals IS NOT NULL))
);

CREATE INDEX matches_season_matchday_idx ON matches (season_id, matchday);
CREATE INDEX matches_date_idx            ON matches (utc_date);
CREATE INDEX matches_status_idx          ON matches (status);
CREATE INDEX matches_home_team_idx       ON matches (home_team_id);
CREATE INDEX matches_away_team_idx       ON matches (away_team_id);
CREATE INDEX matches_referee_idx         ON matches (referee_id);

-- Goles, tarjetas y cambios. Si el jugador del evento no se encuentra en la BD
-- (p. ej. «D. Berdos» de API-Football), se guarda su nombre en player_name.
CREATE TABLE match_events (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id            bigint           NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  minute              smallint         NOT NULL,
  extra_minute        smallint,                              -- 45+2 → minute 45, extra_minute 2
  type                match_event_type NOT NULL,
  team_id             bigint           NOT NULL REFERENCES teams (id),
  player_id           bigint           REFERENCES players (id) ON DELETE SET NULL,
  player_name         text,
  related_player_id   bigint           REFERENCES players (id) ON DELETE SET NULL,  -- asistente o jugador que entra
  related_player_name text,
  detail              text,                                  -- 'Right-footed shot', motivo de la tarjeta…
  source              data_source      NOT NULL,
  external_key        text,                                  -- para no repetir el evento al volver a sincronizar
  created_at          timestamptz      NOT NULL DEFAULT now(),
  UNIQUE (source, external_key),
  CHECK (minute BETWEEN 0 AND 130),
  CHECK (extra_minute IS NULL OR extra_minute BETWEEN 1 AND 30),
  CHECK (player_id IS NOT NULL OR player_name IS NOT NULL)
);

CREATE INDEX match_events_match_idx  ON match_events (match_id, minute);
CREATE INDEX match_events_player_idx ON match_events (player_id);

-- Lo que hizo cada jugador en cada partido (histórico de Transfermarkt; también el directo)
CREATE TABLE appearances (
  match_id     bigint      NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  player_id    bigint      NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  team_id      bigint      NOT NULL REFERENCES teams (id),
  is_starter   boolean,
  minutes      smallint    NOT NULL DEFAULT 0,
  goals        smallint    NOT NULL DEFAULT 0,
  assists      smallint    NOT NULL DEFAULT 0,
  yellow_cards smallint    NOT NULL DEFAULT 0,
  red_cards    smallint    NOT NULL DEFAULT 0,
  source       data_source NOT NULL,
  PRIMARY KEY (match_id, player_id),
  CHECK (minutes BETWEEN 0 AND 130),
  CHECK (goals >= 0 AND assists >= 0),
  CHECK (yellow_cards BETWEEN 0 AND 2 AND red_cards BETWEEN 0 AND 1)
);

CREATE INDEX appearances_player_idx ON appearances (player_id);

-- =====================================================================
-- 4. Estadísticas por temporada y clasificación
-- =====================================================================

-- Totales del jugador en una temporada y equipo (si cambia de equipo a mitad, dos filas).
-- Histórico: se calcula desde appearances. Temporada actual: goleadores de football-data
-- + lo que ponga el editor. field_sources dice de dónde sale cada campo:
--   {"minutes": "EDITOR", "rating": "ESTIMATED"}  (si un campo no está, vale `source`)
CREATE TABLE player_season_stats (
  season_id      bigint       NOT NULL REFERENCES seasons (id) ON DELETE CASCADE,
  player_id      bigint       NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  team_id        bigint       NOT NULL REFERENCES teams (id),
  played         smallint     NOT NULL DEFAULT 0,
  starts         smallint,
  minutes        integer,
  goals          smallint     NOT NULL DEFAULT 0,
  assists        smallint     NOT NULL DEFAULT 0,
  penalties      smallint     NOT NULL DEFAULT 0,          -- goles de penalti
  yellow_cards   smallint,
  red_cards      smallint,
  rating         numeric(3,1),                             -- nota media (estimada o del editor)
  source         data_source  NOT NULL,
  field_sources  jsonb        NOT NULL DEFAULT '{}'::jsonb,
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (season_id, player_id, team_id),
  CHECK (played >= 0 AND goals >= 0 AND assists >= 0 AND penalties >= 0),
  CHECK (penalties <= goals),
  CHECK (minutes IS NULL OR minutes >= 0),
  CHECK (rating IS NULL OR rating BETWEEN 0 AND 10),
  CHECK (jsonb_typeof(field_sources) = 'object')
);

CREATE INDEX player_season_stats_player_idx ON player_season_stats (player_id);

-- Estadísticas del árbitro por temporada (del histórico se calculan; de la actual, estimadas/editor)
CREATE TABLE referee_season_stats (
  season_id     bigint      NOT NULL REFERENCES seasons (id) ON DELETE CASCADE,
  referee_id    bigint      NOT NULL REFERENCES referees (id) ON DELETE CASCADE,
  matches       smallint    NOT NULL DEFAULT 0,
  yellow_cards  smallint    NOT NULL DEFAULT 0,
  red_cards     smallint    NOT NULL DEFAULT 0,
  penalties     smallint    NOT NULL DEFAULT 0,
  source        data_source NOT NULL,
  field_sources jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (season_id, referee_id),
  CHECK (matches >= 0 AND yellow_cards >= 0 AND red_cards >= 0 AND penalties >= 0),
  CHECK (jsonb_typeof(field_sources) = 'object')
);

-- Clasificación (RF6). La recalcula el servidor con los partidos FINISHED
-- (y en directo, con los IN_PLAY) cada vez que cambia un resultado.
CREATE TABLE standings (
  season_id     bigint      NOT NULL REFERENCES seasons (id) ON DELETE CASCADE,
  team_id       bigint      NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  position      smallint    NOT NULL,
  played        smallint    NOT NULL DEFAULT 0,
  won           smallint    NOT NULL DEFAULT 0,
  drawn         smallint    NOT NULL DEFAULT 0,
  lost          smallint    NOT NULL DEFAULT 0,
  goals_for     smallint    NOT NULL DEFAULT 0,
  goals_against smallint    NOT NULL DEFAULT 0,
  points        smallint    NOT NULL DEFAULT 0,
  form          varchar(5),                                -- últimos 5: 'WWDLW' (la API la da a null)
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (season_id, team_id),
  -- Sin UNIQUE (season_id, position): al recalcular, dos equipos se intercambian el puesto fila a fila
  CHECK (position >= 1),
  CHECK (played = won + drawn + lost),
  CHECK (goals_for >= 0 AND goals_against >= 0),
  CHECK (form IS NULL OR form ~ '^[WDL]{0,5}$')
);

-- =====================================================================
-- 5. Usuarios y sesión
-- =====================================================================

CREATE TABLE users (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         text        NOT NULL UNIQUE,
  password_hash text        NOT NULL,                        -- bcrypt, coste 12
  name          text        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'USER',
  status        user_status NOT NULL DEFAULT 'ACTIVE',       -- BLOCKED = no puede iniciar sesión (RF8)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (email LIKE '%_@_%'),                                -- se guarda tal cual lo escribe el usuario
  CHECK (length(name) BETWEEN 2 AND 60)
);

-- Sin distinguir mayúsculas: «Ivan@x.es» e «ivan@x.es» no pueden ser dos cuentas
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

-- Sesiones de express-session (formato de connect-pg-simple)
CREATE TABLE session (
  sid    varchar      NOT NULL PRIMARY KEY,
  sess   json         NOT NULL,
  expire timestamp(6) NOT NULL
);

CREATE INDEX session_expire_idx ON session (expire);

-- =====================================================================
-- 6. Datos del usuario: favoritos, comparativas, equipo ideal, avisos
-- =====================================================================

-- RF3
CREATE TABLE favorite_teams (
  user_id    bigint      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  team_id    bigint      NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, team_id)
);

CREATE TABLE favorite_players (
  user_id    bigint      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  player_id  bigint      NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, player_id)
);

-- RF4: comparativas guardadas, de 2 a 4 jugadores
-- (el mínimo de 2 lo comprueba el servidor al guardar)
CREATE TABLE comparisons (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(name) BETWEEN 1 AND 40)
);

CREATE INDEX comparisons_user_idx ON comparisons (user_id);

CREATE TABLE comparison_players (
  comparison_id bigint   NOT NULL REFERENCES comparisons (id) ON DELETE CASCADE,
  player_id     bigint   NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  sort_order    smallint NOT NULL,                           -- 1 = jugador A (serie/1), 2 = B…
  PRIMARY KEY (comparison_id, player_id),
  UNIQUE (comparison_id, sort_order),
  CHECK (sort_order BETWEEN 1 AND 4)                         -- como mucho 4 jugadores
);

-- RF5: un equipo ideal por usuario
CREATE TABLE ideal_teams (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint      NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  name       text        NOT NULL,
  formation  text        NOT NULL DEFAULT '4-3-3',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(name) BETWEEN 1 AND 24),
  CHECK (formation ~ '^[1-5](-[1-5]){2,3}$')                 -- '4-3-3', '4-2-3-1'…
);

-- Regla de negocio: no se repite posición (PK) ni jugador (UNIQUE).
-- slot = posición del campo como en el front: 'POR', 'LD', 'DFC1', 'MC2', 'DC'…
CREATE TABLE ideal_team_players (
  ideal_team_id bigint  NOT NULL REFERENCES ideal_teams (id) ON DELETE CASCADE,
  slot          text    NOT NULL,
  player_id     bigint  NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  PRIMARY KEY (ideal_team_id, slot),
  UNIQUE (ideal_team_id, player_id),
  CHECK (slot ~ '^(POR|LD|LI|DFC|MC|MI|MD|ED|EI|DC)[1-3]?$')
);

-- RF9: avisos guardados (además se envían en directo por Socket.IO)
CREATE TABLE notifications (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  text       text              NOT NULL,
  link       text,                                           -- ruta del front: '#/partidos/123'
  match_id   bigint            REFERENCES matches (id) ON DELETE SET NULL,
  is_read    boolean           NOT NULL DEFAULT false,
  created_at timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON notifications (user_id, is_read, created_at DESC);

-- =====================================================================
-- 7. Contenido del editor y moderación
-- =====================================================================

-- RF7. Si se borra al autor, el artículo se queda sin autor (no se pierde).
CREATE TABLE articles (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_id    bigint         REFERENCES users (id) ON DELETE SET NULL,
  title        text           NOT NULL,
  summary      text,
  body         text           NOT NULL,
  cover_url    text,
  tags         text[]         NOT NULL DEFAULT '{}',
  status       article_status NOT NULL DEFAULT 'DRAFT',
  published_at timestamptz,
  created_at   timestamptz    NOT NULL DEFAULT now(),
  updated_at   timestamptz    NOT NULL DEFAULT now(),
  CHECK (length(title) BETWEEN 5 AND 120),
  CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL)
);

CREATE INDEX articles_status_idx ON articles (status, published_at DESC);
CREATE INDEX articles_author_idx ON articles (author_id);

-- Historial de «Actualizar datos» del editor (página 19)
CREATE TABLE player_data_changes (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id  bigint      NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  season_id  bigint      REFERENCES seasons (id) ON DELETE CASCADE,  -- NULL = dato de la ficha, no de la temporada
  editor_id  bigint      REFERENCES users (id) ON DELETE SET NULL,
  field      text        NOT NULL,
  old_value  text,
  new_value  text,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX player_data_changes_player_idx ON player_data_changes (player_id, created_at DESC);

-- RF8: denuncias de contenido que revisa el administrador
CREATE TABLE reports (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporter_id bigint        REFERENCES users (id) ON DELETE SET NULL,
  article_id  bigint        REFERENCES articles (id) ON DELETE CASCADE,
  reason      text          NOT NULL,
  status      report_status NOT NULL DEFAULT 'PENDING',
  resolved_by bigint        REFERENCES users (id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  CHECK ((status = 'PENDING') = (resolved_at IS NULL))
);

CREATE INDEX reports_status_idx ON reports (status, created_at);

-- Formulario de contacto
CREATE TABLE contact_messages (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text        NOT NULL,
  email      text        NOT NULL,
  subject    text        NOT NULL,
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email LIKE '%_@_%'),
  CHECK (length(message) BETWEEN 10 AND 2000)
);

-- =====================================================================
-- 8. Registro de la sincronización
-- =====================================================================

-- Una fila por ejecución: «Última actualización» en los paneles y diagnóstico de errores
CREATE TABLE sync_runs (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source      data_source NOT NULL,                          -- FOOTBALL_DATA, API_FOOTBALL, TRANSFERMARKT
  resource    text        NOT NULL,                          -- 'matches', 'teams', 'live', 'history'…
  season_id   bigint      REFERENCES seasons (id) ON DELETE SET NULL,
  status      sync_status NOT NULL DEFAULT 'RUNNING',
  records     integer,                                       -- filas creadas o cambiadas
  requests    smallint,                                      -- peticiones gastadas a la API
  error       text,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CHECK (finished_at IS NULL OR finished_at >= started_at),
  CHECK (status <> 'ERROR' OR error IS NOT NULL)
);

CREATE INDEX sync_runs_recent_idx ON sync_runs (source, resource, started_at DESC);

-- ---------------------------------------------------------------------
-- Triggers de updated_at
-- ---------------------------------------------------------------------

CREATE TRIGGER competitions_updated_at        BEFORE UPDATE ON competitions        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER teams_updated_at               BEFORE UPDATE ON teams               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER players_updated_at             BEFORE UPDATE ON players             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER referees_updated_at            BEFORE UPDATE ON referees            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER matches_updated_at             BEFORE UPDATE ON matches             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER player_season_stats_updated_at BEFORE UPDATE ON player_season_stats FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER referee_season_stats_updated_at BEFORE UPDATE ON referee_season_stats FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER standings_updated_at           BEFORE UPDATE ON standings           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER users_updated_at               BEFORE UPDATE ON users               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER ideal_teams_updated_at         BEFORE UPDATE ON ideal_teams         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER articles_updated_at            BEFORE UPDATE ON articles            FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
