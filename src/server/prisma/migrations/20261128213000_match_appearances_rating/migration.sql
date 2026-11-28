-- =====================================================================
-- FutKingva · Valoración y precisión de pase por partido (appearances)
-- =====================================================================
-- Añade el identificador de FotMob en matches (fm_id) para sincronizar
-- apariciones de forma incremental sin repetir peticiones, y añade en
-- appearances la valoración (rating) y el % de pase (pass_accuracy) de
-- cada jugador en cada partido. No toca ningún CHECK, índice ni trigger
-- de las migraciones anteriores.
--
-- Aplicación (desde src/server):
--   npx prisma@7.10.1 migrate deploy
--   npx prisma@7.10.1 generate
-- =====================================================================

-- Identificador de FotMob en partidos para sincronizar apariciones sin duplicar
ALTER TABLE matches
  ADD COLUMN fm_id bigint;

CREATE UNIQUE INDEX matches_fm_id_key ON matches (fm_id);

-- Valoración (0–10) y acierto en el pase (0–100 %) del jugador en ese partido
ALTER TABLE appearances
  ADD COLUMN rating        numeric(3,1),
  ADD COLUMN pass_accuracy numeric(4,1),
  ADD CONSTRAINT appearances_rating_check
    CHECK (rating IS NULL OR rating BETWEEN 0 AND 10),
  ADD CONSTRAINT appearances_pass_accuracy_check
    CHECK (pass_accuracy IS NULL OR pass_accuracy BETWEEN 0 AND 100);
