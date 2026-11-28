-- =====================================================================
-- FutKingva · Retratos de futbolistas y trazabilidad de su origen
-- =====================================================================
-- Añade photo_source en players para registrar de qué proveedor procede
-- cada retrato (TRANSFERMARKT, FOTMOB, EDITOR…), limpia las siluetas por
-- defecto de Transfermarkt (default.jpg, que no son fotos reales: en su
-- lugar la interfaz muestra las iniciales) e impide volver a guardar
-- cadenas vacías o siluetas genéricas. No toca ningún CHECK, índice ni
-- trigger de 0_init.
--
-- Aplicación (desde src/server):
--   npx prisma@7.10.1 migrate deploy
--   npx prisma@7.10.1 generate
-- =====================================================================

-- Origen del retrato del jugador (NULL cuando photo_url es NULL)
ALTER TABLE players
  ADD COLUMN photo_source data_source;

-- Limpia las siluetas genéricas de Transfermarkt para usar iniciales cuando no exista retrato real
UPDATE players
SET photo_url = NULL
WHERE photo_url LIKE '%/default.jpg%'
   OR length(btrim(photo_url)) = 0;

-- Etiqueta como TRANSFERMARKT los retratos reales ya cargados del histórico
UPDATE players
SET photo_source = 'TRANSFERMARKT'
WHERE photo_url IS NOT NULL
  AND photo_source IS NULL;

-- Garantiza que photo_url no guarde cadenas vacías ni siluetas por defecto y que photo_source vaya a la par
ALTER TABLE players
  ADD CONSTRAINT players_photo_url_check
    CHECK (photo_url IS NULL OR (length(btrim(photo_url)) > 0 AND photo_url NOT LIKE '%/default.jpg%')),
  ADD CONSTRAINT players_photo_source_check
    CHECK ((photo_url IS NULL) = (photo_source IS NULL));
