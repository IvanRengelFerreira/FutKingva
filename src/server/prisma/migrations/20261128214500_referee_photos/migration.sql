-- =====================================================================
-- FutKingva · Retratos de árbitros e identificador de FotMob (referees)
-- =====================================================================
-- Añade fm_id, photo_url y photo_source en referees con las mismas
-- garantías de integridad que en players (20261127023000_player_photos).
-- No toca ningún CHECK, índice ni trigger de las migraciones anteriores.
--
-- Aplicación (desde src/server):
--   npx prisma@7.10.1 migrate deploy
--   npx prisma@7.10.1 generate
-- =====================================================================

ALTER TABLE referees
  ADD COLUMN fm_id        bigint,
  ADD COLUMN photo_url    text,
  ADD COLUMN photo_source data_source;

CREATE UNIQUE INDEX referees_fm_id_key ON referees (fm_id);

ALTER TABLE referees
  ADD CONSTRAINT referees_photo_url_check
    CHECK (photo_url IS NULL OR (length(btrim(photo_url)) > 0 AND photo_url NOT LIKE '%/default.jpg%')),
  ADD CONSTRAINT referees_photo_source_check
    CHECK ((photo_url IS NULL) = (photo_source IS NULL));
