# Servidor de FutKingva — puesta en marcha

Comandos para **PowerShell** (Windows). Rama: `backend`.

## Antes de empezar

- Node.js **22.18 o superior** → `node -v`
- **Docker Desktop** instalado y abierto
- El archivo de datos **`futkingva-2026-11-11.dump`** (te lo pasa Ivan)

## Primera vez

**1. Bajar la rama** (desde la raíz del repositorio)

```powershell
git fetch
git switch backend
git pull
```

**2. Arrancar la base de datos** (desde la raíz)

```powershell
docker compose up -d db
docker ps
```

Tiene que salir `futkingva-db` con `(healthy)`.

**3. Crear el `.env`**

```powershell
cd src/server
Copy-Item .env.example .env
```

Si el puerto 3000 ya lo usa otra aplicación, cambia `PORT=` en `.env`.

**4. Instalar dependencias**

```powershell
npm install
```

**5. Generar el cliente de Prisma**

```powershell
npx prisma@7.10.1 generate
```

**6. Cargar los datos** (cambia la ruta por la de tu archivo `.dump`)

```powershell
docker cp C:\ruta\al\futkingva-2026-11-11.dump futkingva-db:/tmp/datos.dump
docker exec futkingva-db pg_restore -U futkingva -d futkingva --no-owner /tmp/datos.dump
docker exec futkingva-db rm /tmp/datos.dump
npx prisma@7.10.1 migrate resolve --applied 0_init
```

**7. Arrancar el servidor**

```powershell
npm run dev
```

Abre <http://localhost:3000/api/health> → tiene que salir `"status":"ok"`.

**8. Arrancar el front** (otra terminal, desde la raíz)

```powershell
cd src/client
npm install
npm run dev
```

## Cada día

1. Abrir Docker Desktop.
2. `npm run dev` en `src/server`.
3. `npm run dev` en `src/client`.

## Si algo falla

| Mensaje | Solución |
|---|---|
| `Falta el cliente de Prisma` | Paso 5 |
| `Falta la variable de entorno DATABASE_URL` | Paso 3 |
| `/api/health` responde `SERVICE_UNAVAILABLE` (503) | Docker Desktop cerrado o la BD parada → paso 2 |
| `EADDRINUSE` (puerto ocupado) | Cambia `PORT=` en `.env` |
| `/api/health` muestra otra web | Otra aplicación usa ese puerto → cambia `PORT=` en `.env` |

## Empezar de cero (borra todos los datos)

```powershell
docker compose down -v
docker compose up -d db
```

Y repetir el paso 6.

## Cambiar las tablas

No editar tablas a mano. Avisar a Ivan: los cambios se hacen con una migración nueva (`prisma/migrations/`), y solo una persona a la vez.
