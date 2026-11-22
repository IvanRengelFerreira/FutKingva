# Cómo añadir una ruta a la API

Normas comunes para que las rutas de los tres funcionen y respondan igual.
Patrón acordado: **MVC ligero**. El **modelo** son la BD y Prisma (`prisma/schema.prisma`), la **vista** es React (`src/client`) y el **controlador** son las funciones de Express que atienden cada ruta.

## 1. Archivos

Un archivo de rutas y uno de controlador **por recurso** (en inglés y en plural):

```
src/server/
├── routes/<recurso>.js        # Qué URL va a qué función y quién puede entrar
├── controllers/<recurso>.js   # Lee la petición, consulta con Prisma y responde
└── app.js                     # Una línea por recurso en la zona «Rutas de la API»
```

```js
// routes/teams.js
import { Router } from 'express';
import * as teams from '../controllers/teams.js';

export const teamsRouter = Router();
teamsRouter.get('/', teams.list);
teamsRouter.get('/:id', teams.detail);
```

```js
// app.js, en la zona «Rutas de la API»
app.use('/api/teams', teamsRouter);
```

Cada uno toca solo sus archivos y su línea de `app.js`. Si necesitas algo de un recurso que lleva otra persona, pídeselo en vez de cambiar su archivo.

## 2. Controladores

```js
// controllers/teams.js
import { prisma } from '../db.js';
import { AppError } from '../errors/AppError.js';

export async function detail(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest('El id del equipo no es válido', { id: 'Tiene que ser un número' });
  }

  const team = await prisma.teams.findUnique({ where: { id: BigInt(id) } });
  if (!team) throw AppError.notFound('No existe ese equipo');

  res.json({ id: team.id, name: team.name, shortName: team.short_name, crestUrl: team.crest_url });
}
```

- Funciones `async`. **No hace falta `try/catch`**: Express 5 pasa cualquier error al gestor común (`middleware/errorHandler.js`), que responde en el formato de la API.
- Errores esperados con `AppError`; para el resto (BD caída, fallos de Prisma) basta con no capturarlos.
- Las consultas, con **Prisma** (`prisma.<tabla>`). SQL a mano solo si Prisma no puede (`prisma.$queryRaw`).
- Comprueba siempre los datos que llegan (`req.params`, `req.query`, `req.body`): **el servidor nunca se fía del cliente**.
- Una consulta que necesitan **varios archivos** va en `db.js` junto a `prisma` (p. ej. `findUserByEmail`), no copiada en cada uno. *Provisional: si se aprueba una capa de servicios, se moverá allí.*

### Validar el cuerpo de un formulario

Las reglas de un formulario van en `src/shared/validation/<recurso>.js`: **las mismas funciones** las usa el front (error junto al campo antes de enviar) y el servidor. Cada función recibe los datos y devuelve `{ campo: 'mensaje' }` solo con lo que falla (`{}` si todo vale). En el servidor se ponen en la ruta con `validate`:

```js
// routes/auth.js
import { validate } from '../middleware/validate.js';
import { validateLogin } from '../../shared/validation/auth.js';

authRouter.post('/login', validate(validateLogin), auth.login);
```

Si algo falla, `validate` responde **400** con esos `fields` y el controlador no llega a ejecutarse: dentro de él, `req.body` ya está comprobado. No repitas el `if (Object.keys(fields).length) …` en cada controlador.

## 3. Formato de las respuestas

| Qué | Norma |
|---|---|
| Nombres de campos | **camelCase** en el JSON (`shortName`), aunque en la BD sean `short_name`: se convierten en el controlador |
| Ids | Números. Los `BigInt` de Prisma se convierten solos al responder |
| Fechas | Texto ISO (`2026-11-17T20:00:00.000Z`); Prisma ya las da así al hacer `res.json` |
| Listados | `{ items, total, limit, offset }`. `?limit=` por defecto 20 y máximo 100; `?offset=` por defecto 0 |
| Crear | **201** con lo creado |
| Borrar o acción sin respuesta | **204** sin cuerpo (`res.status(204).end()`) |
| Usuarios | Siempre con `publicUser(user)` (`middleware/auth.js`): nunca se envía `password_hash` |

## 4. Errores

Formato común: `{ "error": { "code", "message", "fields"? } }`. `message` va **en español** porque el front lo enseña tal cual.

| Cuándo | Cómo | Respuesta |
|---|---|---|
| Datos no válidos | `AppError.badRequest('…', { campo: 'motivo' })` | 400 `VALIDATION_ERROR` |
| Sin sesión | `requireAuth` / `AppError.unauthorized()` | 401 `UNAUTHORIZED` |
| Correo o contraseña incorrectos | `AppError.invalidCredentials()` | 401 `INVALID_CREDENTIALS` |
| Sin permiso | `requireRole(...)` / `AppError.forbidden()` | 403 `FORBIDDEN` |
| No existe | `AppError.notFound('…')` | 404 `NOT_FOUND` |
| Ya existe o choca | `AppError.conflict('…', fields)` | 409 `CONFLICT` |
| BD caída | (automático) | 503 `SERVICE_UNAVAILABLE` |

`fields` son los errores de cada campo del formulario. El front los pinta junto al campo con `FieldError`.

## 5. Rutas privadas

```js
import { requireAuth, requireRole } from '../middleware/auth.js';

meRouter.get('/favorites', requireAuth, favorites.list);               // con sesión
articlesRouter.post('/', requireRole('editor'), articles.create);      // solo editores
adminRouter.patch('/users/:id', requireRole('admin'), users.update);   // solo administradores
```

- El usuario de la sesión está en `req.user` (`{ id, name, email, role, status }`), o es `null`.
- **Datos de un usuario** (favoritos, comparativas…): filtra siempre por `req.user.id`. Si alguien pide algo que no es suyo, responde **404**, no 403, para no revelar que existe.
- El front también oculta páginas por rol, pero quien protege de verdad es el servidor: toda ruta privada lleva `requireAuth` o `requireRole`.

## 6. En el front

```js
// src/client/services/teams.js
import { apiFetch } from './client.js';

export const getTeam = (id, options) => apiFetch(`/teams/${id}`, options);
```

```jsx
// En la vista
import { useApi } from '../../services/useApi.js';
import LoadingState from '../../components/LoadingState/LoadingState.jsx';
import ErrorState from '../../components/ErrorState/ErrorState.jsx';

const { data: team, error, loading, reload } = useApi((signal) => getTeam(id, { signal }), [id]);
if (loading) return <LoadingState label="Cargando equipo…" />;
if (error) return <ErrorState error={error} onRetry={reload} />;
```

- Un archivo por recurso en `src/client/services/`, con las mismas palabras que en el servidor.
- Mientras carga, **`LoadingState`**; si falla, **`ErrorState`** con `onRetry={reload}`. No hagáis avisos propios de carga o error: así se ven igual en toda la web.
- Comprueba `loading` antes que `data`: al pasar de un equipo a otro, `data` sigue teniendo el anterior hasta que llega el nuevo.
- Si un 404 debe mostrar la página de «no encontrado» en vez del aviso, compruébalo antes: `if (error?.status === 404) return <NotFound />;`.
- En desarrollo, Vite manda las peticiones a `/api` al servidor (proxy en `vite.config.js`, con el `PORT` de `src/server/.env`): hay que tener **los dos** en marcha (`npm run dev` en `src/server` y en `src/client`).
- Las vistas conectadas a la API **dejan de importar `mockData.js`**.

### Formularios que envían a la API

Con **`useFormSubmit`** (`services/useFormSubmit.js`), que lleva el «enviando» y los errores del servidor. No copies ese estado en cada formulario.

```jsx
import { useFormSubmit } from '../../services/useFormSubmit.js';

const errors = validateLogin(form);                         // mismas reglas que el servidor
const { submitted, sending, serverFields, message, clearServerError, submit } = useFormSubmit();
const shown = (field) => (submitted ? errors[field] : null) ?? serverFields[field];

<form onSubmit={(e) => { e.preventDefault(); submit(() => onSubmit(form), errors); }} noValidate>
  <TextField … error={shown('email')} onChange={(e) => { setForm(…); clearServerError('email'); }} />
  <FieldError>{message}</FieldError>
  <Button type="submit" disabled={sending}>Enviar</Button>
</form>
```

- Errores de un campo (400, 409): junto a su campo, con la prop `error` de `TextField` / `Checkbox`.
- El resto (401, 403, sin conexión): `message`, en un `FieldError` **encima del botón**.
- El botón de enviar, `disabled={sending}` mientras se envía.

## 7. Cambiar las tablas

Nunca a mano. Una migración nueva, **una persona a la vez** y avisando al resto:

1. Cambia `prisma/schema.prisma`.
2. `npx prisma@7.10.1 migrate dev --create-only --name <qué-cambia>`.
3. **Revisa el SQL generado**: Prisma no conoce los CHECK, los triggers ni los índices sobre expresiones (`lower(email)`) y puede intentar borrarlos.
4. `npx prisma@7.10.1 migrate dev` para aplicarla y `git add` de la carpeta nueva de `prisma/migrations/`.
5. Los demás, después de `git pull`: `npx prisma@7.10.1 migrate deploy` y `npx prisma@7.10.1 generate`.

## 8. Código limpio

Lo comprueba el agente revisor antes de cada commit.

| Norma | En la práctica |
|---|---|
| **Una responsabilidad por pieza** | Rutas: URL y permisos. Controladores: leer la petición, consultar y responder. Componentes: pintar. La lógica que se repite, a un hook o a un módulo propio. Un contexto por tema (`SessionContext` sesión, `NotificationsContext` avisos). |
| **Funciones cortas** | Si una función pasa de unas 30 líneas o hace dos cosas, se divide y cada parte lleva un nombre que diga qué hace. |
| **Sin duplicar** | Antes de escribir algo, busca si ya existe (`components/`, `services/`, `src/shared/`, `middleware/`, `db.js`). Si lo necesitan dos archivos, va a un sitio común, no copiado. |
| **Sin números ni textos mágicos** | Valores con significado como constantes con nombre (`REMEMBER_MS`, `PASSWORD_MIN`). Un mensaje que sale en dos sitios, una constante. |
| **Nombres que se explican** | En inglés y por lo que hacen (`findUserByEmail`, `clearServerError`), no `data2`, `aux` ni `handle`. Booleanos como pregunta (`sending`, `isValidEmail`). |
| **Comentarios del porqué** | En español, explicando lo que el código no dice (por qué el hash señuelo, por qué un 404 y no un 403). Nada de repetir lo que ya se lee. |
| **Sin restos** | Ni código comentado, ni `console.log` de depuración, ni imports o variables sin usar. `console.warn` solo para fallos que se recuperan solos. |
| **Lint y formato** | Antes de cada commit, `npm run lint` sin errores y `npm run format` (Prettier, configuración en `src/.prettierrc.json`) en `src/client` y `src/server`. |
| **Cada uno, lo suyo** | Solo tocas tus archivos y tu línea de `app.js`. Si algo común no te vale, se habla antes de cambiarlo. |
