# ArcadeCore

Backend modular (Node.js, Express, TypeScript, PostgreSQL, Prisma) para varias aplicaciones: autenticación JWT, usuarios, apps registradas, panel admin, quiz con preguntas por app y puntuaciones.

## Requisitos

- Node.js 20+ (recomendado)
- PostgreSQL accesible vía `DATABASE_URL`

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto. Variables mínimas:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión PostgreSQL (obligatoria) |
| `JWT_ACCESS_SECRET` | Secreto para firmar access tokens (obligatoria) |
| `PORT` | Puerto HTTP (por defecto `3000`) |
| `BCRYPT_SALT_ROUNDS` | Rondas bcrypt (por defecto `12`) |
| `JWT_ACCESS_EXPIRES_IN` | Duración del access token (por defecto `15m`) |
| `JWT_REFRESH_EXPIRES_DAYS` | Duración del refresh en días (por defecto `1`) |

## Instalación y base de datos

```bash
npm install
npx prisma generate
```

Aplicar migraciones y datos iniciales:

```bash
# Producción / CI (sin prompts)
npm run db:setup
```

En desarrollo también puedes usar:

```bash
npm run prisma:migrate   # interactivo
npm run db:seed          # solo seed (tras migraciones)
```

## Ejecutar el servidor

```bash
npm run dev
```

Por defecto el API queda en `http://localhost:3000` (o el `PORT` que definas).

Compilar y arrancar en modo producción:

```bash
npm run build
npm start
```

## Prefijo del API

Todas las rutas de negocio bajo la versión actual:

`http://localhost:3000/api/v1`

Salud del servicio (sin prefijo de versión):

`GET http://localhost:3000/health`

## Qué incluye el servicio (estado actual)

- **Auth** (`/api/v1/auth`): registro, login, refresh y logout con access token (corto) y refresh token rotado.
- **Usuarios** (`/api/v1/users`): alta de usuario asociado a una `app_id`.
- **Apps** (`/api/v1/apps`): listado y creación de aplicaciones registradas en el sistema (`quiz`, `administration`, etc.).
- **Admin** (`/api/v1/admin`): operaciones reservadas a tokens emitidos para la app administrativa (ver más abajo): listado de usuarios, listado de apps, listado global de preguntas y creación de preguntas para cualquier app destino.
- **Quiz / preguntas** (`/api/v1/questions`): consulta de preguntas **solo de la app del usuario** según el `appId` del JWT (sin pasar `app_id` en query).
- **Scores** (`/api/v1/scores`): registro de puntuaciones ligadas a usuario y app.

La documentación interactiva OpenAPI está en Swagger (sección siguiente).

## Preguntas (quiz): cómo funcionan

- Cada **pregunta** pertenece a **una app** (`app_id` en base de datos). Las apps de quiz (inglés, programación, League of Legends, etc.) son filas distintas en la tabla `apps`; **cada una define su propio banco de preguntas** al que solo se accede en listado “jugador” con un usuario registrado en esa misma app.
- Cada app de quiz define **dificultades** en la tabla `difficulties` (`id`, `name`, `is_active`, `app_id`). Una pregunta lleva **`difficulty_id`** (FK obligatoria a una dificultad de la misma app).
- Tipos soportados en modelo: `fill_blank`, `multiple_choice`, `word_order`.
- Para **`fill_blank`** y **`multiple_choice`**: el enunciado es texto (`question` string); debe haber al menos una opción en `options` y **`answer` debe coincidir exactamente con una de las opciones** (elección múltiple guiada).

### Quién puede crear o listar “todo”

- **Dificultades (admin)**: `GET/POST /api/v1/admin/difficulties`, `PATCH/DELETE /api/v1/admin/difficulties/:id` (listar requiere query `app_id`).
- **Crear preguntas** y **listar todas las preguntas** (filtro opcional `app_id`, `difficulty_id`): rutas bajo **`/api/v1/admin`**, con token **`ADMIN_APP`**. El cuerpo de creación incluye **`app_id`** (app destino) y **`difficulty_id`**.

### Consulta desde una app de quiz

- **`GET /api/v1/questions`**: JWT de la app de quiz; solo preguntas de ese `app_id` (del token). Query opcional: `difficulty_id`.
- **`GET /api/v1/questions/random`**: misma regla; query opcional: `difficulty_id`.

El login usa **`app_name`** (nombre único de la app en BD), no el id numérico, para obtener tokens con el `appId` correcto.

## App y usuario por defecto (seed)

Tras `npm run db:setup` (o migraciones + `npm run db:seed`), el script [`prisma/seed.ts`](prisma/seed.ts) garantiza:

1. **App `ADMIN_APP`**
   - **Nombre**: `ADMIN_APP` (constante en código: [`src/shared/constants/adminApp.ts`](src/shared/constants/adminApp.ts)).
   - **Tipo**: `administration`.
   - **Activa**: sí.
   - Sirve para el panel admin: los endpoints `/api/v1/admin/*` exigen un JWT cuyo `appId` coincida con el **id** de esta fila (resuelto por nombre en BD, no hardcodeado).

2. **Usuario administrador inicial** (solo si la tabla de usuarios está vacía)
   - **Email**: `admin@admin.com`
   - **Contraseña**: `admin@admin` (definida en el seed; **solo para desarrollo**, cámbiala o desactiva el usuario en entornos reales).
   - **App**: el usuario queda asociado a `ADMIN_APP` (`app_id` = id de esa app).
   - **Perfil**: nickname `Admin`.

Si ya existen usuarios, el seed **no** crea otro admin.

Para obtener un token de admin: `POST /api/v1/auth/login` con cuerpo que incluya `"app_name": "ADMIN_APP"`, el email y la contraseña anteriores.

## Swagger (OpenAPI)

El proyecto genera la especificación con **swagger-jsdoc** a partir de comentarios `@openapi` en [`src/shared/swagger/paths/`](src/shared/swagger/paths/) y la definición base en [`src/shared/swagger/swagger.config.ts`](src/shared/swagger/swagger.config.ts).

### Cómo ver la documentación

1. Arranca el servidor (`npm run dev`).
2. Abre en el navegador:

   **http://localhost:3000/api/docs**

   (Si usas otro `PORT`, sustituye `3000`.)

En Swagger verás los tags (Auth, Admin, Users, Apps, Questions, Scores), esquemas de request/response y podrás probar endpoints que requieran Bearer token usando el botón **Authorize** y pegando el `access_token` devuelto por login o registro.

El servidor base de los paths en la UI suele estar configurado como `http://localhost:3000/api/v1` para encajar con las rutas documentadas.

## Scripts útiles

| Script | Uso |
|--------|-----|
| `npm run dev` | Servidor en caliente con `tsx` |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta `dist/server.js` |
| `npm run typecheck` | Verifica tipos sin emitir archivos |
| `npm run prisma:generate` | Regenera el cliente Prisma |
| `npm run prisma:migrate` | Migraciones en desarrollo |
| `npm run db:seed` | Ejecuta solo el seed |
| `npm run db:setup` | `migrate deploy` + seed |

## Estructura del código (resumen)

- `src/modules/*`: un módulo por dominio (controller → service → repository).
- `src/shared/`: middleware, errores, Prisma, Swagger, configuración.
- `src/routes/index.ts`: montaje de routers bajo `/api/v1`.
- `prisma/schema.prisma` y `prisma/migrations/`: modelo de datos y evolución.

## Apps tipo chat (`CHAT-BOX`)

ArcadeCore soporta apps con `AppType.chat` para chat en tiempo real (arcade-chat en `http://localhost:3003`).

### Registrar la app

El seed crea `CHAT-BOX` (`type: chat`, url `http://localhost:3003`). También puedes crearla desde el admin dashboard.

### Auth

Igual que otras apps jugador: registro/login en generic-login con `app_name: CHAT-BOX`, refresh cookie `arcade_refresh_CHAT-BOX`, Bearer en rutas REST y query `?token=` en WebSocket.

### CORS

Incluye `http://localhost:3003` en `CORS_ORIGINS`.

### REST (`/api/v1/chat`, tag Swagger **Chat**)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/chat/private` | Lista conversaciones privadas del usuario |
| GET | `/chat/private/:peerUserId` | Historial JSON (≤50 mensajes) |
| POST | `/chat/presence/heartbeat` | Acumula tiempo activo para XP |
| GET | `/chat/me` | Perfil + progreso |

### WebSocket (`CHAT_WS_PATH`, default `/ws/chat`)

Conectar: `ws://localhost:4000/ws/chat?token=<access_token>`

**Cliente → servidor**

| Evento | Payload |
|--------|---------|
| `chat:join` | `{}` |
| `chat:global:send` | `{ text, image_url? }` |
| `chat:private:send` | `{ to_user_id, text, image_url? }` |
| `chat:presence:ping` | `{ visible: boolean }` |

**Servidor → cliente**

| Evento | Payload |
|--------|---------|
| `chat:global:message` | `{ message }` |
| `chat:private:message` | `{ peer_user_id, message }` |
| `chat:presence:online` | `{ users }` |
| `chat:system` | `{ text, code? }` |
| `chat:xp:update` | `{ level, xp, gained? }` |

### Comportamiento

- **Global:** efímero en RAM del proceso. Sin historial al conectar. Reinicio del servidor = sala vacía.
- **Privados:** persistidos en `chat_private_conversations.messages_json` (FIFO, máx. 50).
- **Imágenes:** solo URLs públicas; validación HEAD ≤10 MB (`CHAT_IMAGE_MAX_BYTES`).
- **XP:** heartbeat cada ~60s con pestaña visible; +50 XP cada `CHAT_XP_INTERVAL_MINUTES` min (default **5**; en local usa `CHAT_XP_INTERVAL_MINUTES=2` etc.) (`UserProgress`).
