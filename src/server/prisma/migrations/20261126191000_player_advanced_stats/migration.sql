-- =====================================================================
-- FutKingva · Estadísticas avanzadas de jugador por temporada
-- =====================================================================
-- Añade las métricas que muestran 04 · Ficha de jugador y 10 · Comparador
-- (xG, tiros a puerta, % de pases completados y pases clave), así como el
-- identificador externo de FotMob (fm_id) en equipos y jugadores y los
-- valores correspondientes en data_source.
--
-- Aplicación pendiente (desde src/server):
--   npx prisma@7.10.1 migrate deploy
--   npx prisma@7.10.1 generate
-- =====================================================================

-- Nuevas fuentes de datos para estadísticas avanzadas y de temporada
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'FOTMOB';
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'FBREF';

-- Identificador de FotMob en equipos y jugadores para sincronizar sin duplicar
ALTER TABLE teams
  ADD COLUMN fm_id bigint;

CREATE UNIQUE INDEX teams_fm_id_key ON teams (fm_id);

ALTER TABLE players
  ADD COLUMN fm_id bigint;

CREATE UNIQUE INDEX players_fm_id_key ON players (fm_id);

-- Estadísticas avanzadas opcionales por temporada y club
ALTER TABLE player_season_stats
  ADD COLUMN xg              numeric(5,2),
  ADD COLUMN shots_on_target smallint,
  ADD COLUMN pass_accuracy   numeric(4,1),
  ADD COLUMN key_passes      smallint,
  ADD CONSTRAINT player_season_stats_xg_check
    CHECK (xg IS NULL OR xg >= 0),
  ADD CONSTRAINT player_season_stats_shots_on_target_check
    CHECK (shots_on_target IS NULL OR shots_on_target >= 0),
  ADD CONSTRAINT player_season_stats_pass_accuracy_check
    CHECK (pass_accuracy IS NULL OR pass_accuracy BETWEEN 0 AND 100),
  ADD CONSTRAINT player_season_stats_key_passes_check
    CHECK (key_passes IS NULL OR key_passes >= 0);
