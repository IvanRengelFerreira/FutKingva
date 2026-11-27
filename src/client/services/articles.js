// Artículos de los editores (/api/articles) y artículos guardados (/api/me/saved-articles). Responsable: Carlota.
// Formato del cuerpo y de la portada: src/shared/validation/article.js.
import { apiFetch } from './client.js';

/** 08 · Análisis: { items, total, limit, offset, featured } (query: { category, q, excludeFeatured, limit, offset }) */
export const getArticles = (query, options) => apiFetch('/articles', { ...options, query });

/** 09 · Artículo: artículo publicado con body, players, teams, related y saved (suma una visita) */
export const getArticle = (id, options) => apiFetch(`/articles/${id}`, options);

/** 17 · Panel de editor: { items, total, limit, offset, stats } (query: { status, q, limit, offset }) */
export const getMyArticles = (query, options) => apiFetch('/articles/mine', { ...options, query });

/** 18 · Editor de artículo: artículo propio en cualquier estado */
export const getArticleForEdit = (id, options) => apiFetch(`/articles/${id}/edit`, options);

/** Crear: { title, summary, category, status, publishAt, tags, cover, body } → artículo como en getArticleForEdit */
export const createArticle = (data) => apiFetch('/articles', { method: 'POST', body: data });

/** Guardar cambios (se envía el artículo entero, como al crear) */
export const updateArticle = (id, data) => apiFetch(`/articles/${id}`, { method: 'PATCH', body: data });

/** Eliminar (409 si tiene denuncias) */
export const deleteArticle = (id) => apiFetch(`/articles/${id}`, { method: 'DELETE' });

/** Guardar o quitar de guardados (botón «Guardar» de 09) */
export const saveArticle = (id) => apiFetch(`/me/saved-articles/${id}`, { method: 'PUT' });
export const unsaveArticle = (id) => apiFetch(`/me/saved-articles/${id}`, { method: 'DELETE' });
