# Servidor de FutKingva — puesta en marcha

Guía paso a paso para tener el servidor y la base de datos funcionando en tu ordenador.
Todos los comandos son para **PowerShell** (Windows).

## Qué necesitas

- **Node.js 22.18 o superior.** Compruébalo con `node -v`.
- **Docker Desktop** instalado y **abierto**.
- El archivo **`futkingva-2026-11-16.dump`** con los datos (te lo pasa Ivan). Guárdalo en una carpeta fácil, por ejemplo `C:\datos\`.

## Primera vez

### 1. Bajar la rama `backend`

Desde la carpeta del repositorio:

```powershell
git fetch
git switch backend
git pull
```

### 2. Arrancar la base de datos

Desde la carpeta del repositorio:

```powershell
docker compose up -d --wait db
```

El comando termina cuando la base de datos está lista (`Container futkingva-db Healthy`).

> **¿Ya habías arrancado esta base de datos antes?** Para cargar los datos tiene que estar vacía.
> El siguiente comando **borra todo lo que tenga** (no se puede deshacer). Si nunca has guardado
> nada tuyo en ella, no pierdes nada:
>
> ```powershell
> docker compose down -v
> docker compose up -d --wait db
> ```

### 3. Cargar los datos

Cambia `C:\datos\` por la carpeta donde guardaste el archivo:

```powershell
docker cp C:\datos\futkingva-2026-11-16.dump futkingva-db:/tmp/datos.dump
docker exec futkingva-db pg_restore -U futkingva -d futkingva --no-owner /tmp/datos.dump
docker exec futkingva-db rm /tmp/datos.dump
```

Si no sale ningún error, está todo cargado: tablas, datos y el registro de migraciones.

### 4. Crear el archivo `.env`

```powershell
cd src/server
Copy-Item .env.example .env
```

Genera la clave de las sesiones con este comando y pega el resultado en `.env`, detrás de `SESSION_SECRET=`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Si el puerto 3000 ya lo usa otra aplicación, abre `.env` y cambia `PORT=3000` por otro (por ejemplo `PORT=3100`).

### 5. Instalar las dependencias

Dentro de `src/server`:

```powershell
npm install
```

### 6. Generar el cliente de Prisma

Dentro de `src/server`:

```powershell
npx prisma@7.10.1 generate
```

Si pregunta `Ok to proceed? (y)`, escribe `y` y pulsa Enter.

### 7. Comprobar que la base de datos está al día

Dentro de `src/server`:

```powershell
npx prisma@7.10.1 migrate status
```

Tiene que decir **`Database schema is up to date!`**.

### 8. Crear las cuentas de prueba

Dentro de `src/server`:

```powershell
npm run seed:demo
```

Crea `usuario@futkingva.es`, `editor@futkingva.es` y `admin@futkingva.es` (contraseña `futkingva2026`), que son las que usan los botones «Acceso rápido de prueba» de la página de Acceso. Se puede repetir sin problema: si ya existen, las deja como nuevas.

### 9. Arrancar el servidor

Dentro de `src/server`:

```powershell
npm run dev
```

Abre <http://localhost:3000/api/health> (o el puerto que pusieras). Tiene que salir `"status":"ok"`.

### 10. Arrancar la web

En **otra** terminal, desde la carpeta del repositorio:

```powershell
cd src/client
npm install
npm run dev
```

### 11. Probar el tiempo real (opcional)

Los avisos en directo van por Socket.IO, en el mismo puerto que la API. Vite lo reenvía con el mismo proxy que `/api`.

1. Entra con `usuario@futkingva.es` y sigue a un equipo (★ en su ficha).
2. En otra ventana (o en privado), entra con `admin@futkingva.es` y ve a **Panel de administración › Simulador de partidos**.
3. Empieza un partido de ese equipo y pulsa **Gol**. Al usuario le sale el aviso emergente y la campana se marca; el marcador de **Inicio** cambia para todos.
4. Al terminar, el partido sale de «Partidos en juego». Los partidos simulados **nunca** cuentan en la clasificación, los resultados ni las estadísticas. **Borrar** lo quita del panel.

Cada minuto simulado dura `SIMULATOR_TICK_MS` milisegundos (3000 si no se pone en el `.env`).

## Cada día

1. Abrir Docker Desktop (la base de datos arranca sola; si no, `docker compose up -d --wait db`).
2. `npm run dev` en `src/server`.
3. `npm run dev` en `src/client`.

Después de un `git pull`, si ha llegado una migración nueva (carpeta nueva en `prisma/migrations/`), ejecuta en `src/server`:

```powershell
npx prisma@7.10.1 migrate deploy
npx prisma@7.10.1 generate
```

## Si algo falla

| Mensaje                                                                     | Solución                                                                            |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Falta el cliente de Prisma`                                                | Paso 6                                                                              |
| `Falta la variable de entorno DATABASE_URL` o `SESSION_SECRET`              | Paso 4                                                                              |
| `/api/health` responde `SERVICE_UNAVAILABLE` (503)                          | Docker Desktop cerrado o la BD parada → paso 2                                      |
| `EADDRINUSE` (puerto ocupado) o `/api/health` muestra otra web              | Otra aplicación usa ese puerto → cambia `PORT=` en `.env`                           |
| `pg_restore: error: ... already exists`                                     | La BD ya tenía tablas → empieza de cero (abajo, borra los datos) y repite el paso 3 |
| `migrate status` dice que falta alguna migración                            | `npx prisma@7.10.1 migrate deploy`                                                  |
| «Faltan las cuentas de prueba» al pulsar Usuario / Editor / Admin en Acceso | Paso 8                                                                              |

## Empezar de cero

⚠️ **Borra todos los datos de tu base de datos y no se puede deshacer.** Desde la carpeta del repositorio:

```powershell
docker compose down -v
docker compose up -d --wait db
```

Y repetir el paso 3.

## Añadir rutas o cambiar las tablas

Antes de programar, lee **[CONVENCIONES.md](CONVENCIONES.md)**: dónde va cada archivo, el formato del JSON, los errores, cómo proteger una ruta y cómo hacer una migración.
