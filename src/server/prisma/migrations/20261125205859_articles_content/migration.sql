-- =====================================================================
-- FutKingva · articles_content: artículos de los editores (páginas 08, 09, 17 y 18)
-- =====================================================================
-- Escrita a mano a partir de lo que generó `migrate dev --create-only` (Prisma quería borrar
-- y volver a crear `body`, lo que pierde el texto). No toca los CHECK, triggers ni índices de 0_init.
--
--   articles.category  Táctica | Crónica | Previa | Datos
--   articles.views     visitas totales (se suman en cada GET /api/articles/:id)
--   articles.body      texto en bloques jsonb, sin HTML (la web lo pinta con React)
--   articles.cover     portada dibujada { "type": …, … } (la forma la comprueba el servidor;
--                      los ids de equipo de dentro no llevan clave ajena)
--   articles.cover_url se quita: no hay servidor de archivos
--   users.title        cargo que sale bajo el autor («Editora», «Editor»…); opcional
--   article_daily_views visitas por día → «Visitas este mes» y la comparación con el mes anterior (17)
--   saved_articles     artículos guardados por cada usuario (botón «Guardar» de 09)
--
-- «Programado» = PUBLISHED con published_at en el futuro (el enum article_status no cambia).

-- Categoría (con un valor provisional por si la tabla ya tiene filas)
ALTER TABLE articles ADD COLUMN category text NOT NULL DEFAULT 'Datos';
ALTER TABLE articles ALTER COLUMN category DROP DEFAULT;
ALTER TABLE articles ADD CONSTRAINT articles_category_check
  CHECK (category IN ('Táctica', 'Crónica', 'Previa', 'Datos'));

-- Visitas totales
ALTER TABLE articles ADD COLUMN views integer NOT NULL DEFAULT 0;
ALTER TABLE articles ADD CONSTRAINT articles_views_check CHECK (views >= 0);

-- Cuerpo en bloques: el texto que ya hubiera pasa a ser un párrafo (no se pierde)
ALTER TABLE articles ALTER COLUMN body TYPE jsonb USING jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'spans', jsonb_build_array(jsonb_build_object('text', body))));
ALTER TABLE articles ADD CONSTRAINT articles_body_check CHECK (jsonb_typeof(body) = 'array');

-- Portada dibujada
ALTER TABLE articles ADD COLUMN cover jsonb;
ALTER TABLE articles ADD CONSTRAINT articles_cover_check
  CHECK (cover IS NULL OR (jsonb_typeof(cover) = 'object' AND cover ? 'type'));

ALTER TABLE articles DROP COLUMN cover_url;

-- Cargo del autor
ALTER TABLE users ADD COLUMN title text;
ALTER TABLE users ADD CONSTRAINT users_title_check CHECK (title IS NULL OR length(title) BETWEEN 1 AND 40);

-- Visitas por día (una fila por artículo y día con visitas; se suma junto con articles.views)
CREATE TABLE article_daily_views (
  article_id bigint  NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  day        date    NOT NULL,
  views      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, day),
  CHECK (views >= 0)
);

CREATE INDEX article_daily_views_day_idx ON article_daily_views (day);

-- Artículos guardados (como favorite_players / favorite_teams)
CREATE TABLE saved_articles (
  user_id    bigint      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  article_id bigint      NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);

CREATE INDEX saved_articles_article_idx ON saved_articles (article_id);
