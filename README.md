# Enjoy · Plataforma de Eventos e Inscripciones

Proyecto integrador de la materia **Programación Backend II** (CoderHouse).

API REST para gestionar las **clases y eventos del gimnasio Enjoy**: los organizadores (profes) crean eventos — clases, workshops, torneos o actividades — y los usuarios se inscriben ocupando un cupo.

> 🚧 **Estado:** Pre-entrega 5 — roles y autorización (401 vs 403, matriz de permisos y propiedad de eventos). Las funcionalidades se agregan en cada pre-entrega (ver [Avance](#avance)).

## Tecnologías

- Node.js + Express 5 (módulos ESM)
- MongoDB Atlas + Mongoose
- bcrypt (hash de contraseñas)
- jsonwebtoken (JWT) + cookie-parser (cookie HTTP Only)
- Passport.js (passport-local, passport-jwt)
- dotenv
- nodemon (desarrollo)
- Próximas entregas: Nodemailer

## Instalación

```bash
git clone https://github.com/Shaktulu30/enjoybackend.git
cd enjoybackend
npm install
cp .env.example .env   # completar con valores reales
```

## Variables de entorno

Definidas en `.env.example` (el archivo `.env` real **no** se sube al repo).

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto `8080`) |
| `NODE_ENV` | `development` / `production`. En `production` la cookie se emite con `secure: true` |
| `MONGO_URL` | **Obligatoria.** Connection string de MongoDB Atlas |
| `JWT_SECRET` | **Obligatoria.** Secreto para firmar los JWT (usar un valor largo y aleatorio) |
| `JWT_EXPIRES_IN` | Expiración del token (por defecto `1h`) |
| `BCRYPT_SALT_ROUNDS` | Rondas de salt para bcrypt (por defecto `10`) |
| `MAIL_SERVICE` | Servicio de correo para Nodemailer (próximas entregas) |
| `MAIL_USER` | Usuario/cuenta de correo (próximas entregas) |
| `MAIL_PASS` | Contraseña de aplicación del correo (próximas entregas) |

Si falta `MONGO_URL` o `JWT_SECRET`, el servidor no inicia e informa qué variable falta.

Para generar un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Cómo ejecutar

```bash
npm run dev   # desarrollo (nodemon)
npm start     # producción (node)
```

El servidor queda disponible en `http://localhost:<PORT>` (por defecto `http://localhost:8080`).

### Asignar roles (crear el primer admin u organizers)

El registro público siempre crea usuarios con rol `user`. Para promover un usuario ya registrado:

```bash
npm run set-role -- ana@enjoy.com admin        # o organizer / user
```

Una vez que existe un admin, los demás roles se pueden asignar desde la API con `PATCH /api/users/:uid/role`. El usuario debe **volver a iniciar sesión** para que su token refleje el nuevo rol.

## Estructura de carpetas

```
scripts/
└── set-role.js                # Asigna un rol a un usuario existente (npm run set-role)
src/
├── app.js                     # Configura Express (json, cookies, Passport, router /api, 404 y errores)
├── server.js                  # Punto de entrada: valida env, conecta a MongoDB y levanta el servidor
├── config/
│   ├── env.js                 # Carga dotenv, expone la configuración y valida variables obligatorias
│   ├── db.js                  # Conexión a MongoDB Atlas con Mongoose
│   ├── cookie.js              # Nombre y opciones de la cookie de autenticación
│   ├── passport.config.js     # Estrategias de Passport: register, login y current
│   └── roles.js               # Roles y matriz de permisos (PERMISSIONS)
├── routes/
│   ├── index.js               # Router principal montado en /api
│   ├── health.router.js
│   ├── events.router.js
│   ├── sessions.router.js
│   └── users.router.js        # Rutas administrativas
├── controllers/               # Manejo de request/response
│   ├── health.controller.js
│   ├── events.controller.js
│   ├── sessions.controller.js # Genera el JWT y maneja la cookie tras la autenticación
│   └── users.controller.js
├── services/                  # Lógica de negocio (validaciones, reglas)
│   ├── events.service.js
│   └── users.service.js
├── repositories/              # Acceso a datos desacoplado de la persistencia
│   ├── event.repository.js
│   └── user.repository.js
├── dao/                       # Operaciones concretas contra MongoDB
│   ├── event.dao.js
│   └── user.dao.js
├── dto/                       # Objetos de salida (qué datos se exponen)
│   ├── event.dto.js
│   └── user.dto.js
├── models/                    # Esquemas de Mongoose
│   ├── user.model.js
│   └── event.model.js
├── middlewares/
│   ├── auth.middleware.js     # authenticate (401) y passportCall
│   ├── authorize.middleware.js # authorize(roles permitidos) (403)
│   ├── ownership.middleware.js # authorizeEventOwner: dueño del evento o admin (403)
│   ├── notFound.middleware.js
│   └── errorHandler.middleware.js
└── utils/
    ├── response.js            # Helpers de respuesta con formato uniforme
    ├── hash.js                # createHash / isValidPassword (bcrypt)
    ├── jwt.js                 # generateToken (lo usa el controller de login)
    ├── validators.js          # Validación y normalización de datos
    └── AppError.js            # Error con código HTTP
```

## Modelos

**User**: `first_name`, `last_name`, `email` (único, guardado en minúsculas), `password` (hash bcrypt, nunca se devuelve), `role` (`user` | `organizer` | `admin`, default `user`), timestamps.

**Event**: `title`, `description`, `category` (`clase` | `workshop` | `torneo` | `actividad`), `date`, `location`, `capacity`, `organizer` (ref. User, dueño del evento), `status` (`published` | `cancelled`, default `published`), timestamps.

## Roles y autorización

### Roles

| Rol | Quién es | Cómo se obtiene |
|---|---|---|
| `user` | Socio del gimnasio que consulta e (próximamente) se inscribe a eventos | Por defecto al registrarse |
| `organizer` | Profe que crea y gestiona **sus** eventos | Lo asigna un admin (o `npm run set-role`) |
| `admin` | Administración del gimnasio | `npm run set-role` o un admin existente |

El registro público **no** permite elegir rol: si el body trae `role`, se ignora y se crea como `user`.

### Matriz de permisos

Definida en `src/config/roles.js` (`PERMISSIONS`). Las rutas referencian estas claves, nunca nombres de rol sueltos.

| Acción | Visitante | `user` | `organizer` | `admin` | Permiso |
|---|:-:|:-:|:-:|:-:|---|
| Consultar eventos publicados | ✅ | ✅ | ✅ | ✅ | — (pública) |
| Crear eventos | ❌ 401 | ❌ 403 | ✅ | ✅ | `EVENTS_CREATE` |
| Modificar eventos propios | ❌ 401 | ❌ 403 | ✅ | ✅ | `EVENTS_UPDATE_OWN` |
| Cancelar eventos propios | ❌ 401 | ❌ 403 | ✅ | ✅ | `EVENTS_CANCEL_OWN` |
| Modificar / cancelar **cualquier** evento | ❌ 401 | ❌ 403 | ❌ 403 | ✅ | `EVENTS_MANAGE_ANY` |
| Ver todos los usuarios | ❌ 401 | ❌ 403 | ❌ 403 | ✅ | `USERS_READ_ALL` |
| Cambiar el rol de un usuario | ❌ 401 | ❌ 403 | ❌ 403 | ✅ | `USERS_UPDATE_ROLE` |
| Ver la propia sesión (`/current`) | ❌ 401 | ✅ | ✅ | ✅ | autenticado |

### Middlewares

Se encadenan en las rutas en este orden; cada uno es reutilizable e independiente:

```
authenticate  →  authorize(PERMISSIONS.X)  →  authorizeEventOwner (si aplica)  →  controller
    401               403                         404 / 403
```

| Middleware | Archivo | Qué hace | Error |
|---|---|---|---|
| `authenticate` | `auth.middleware.js` | Lee el JWT de la cookie `currentUser` (estrategia Passport `current`), lo valida y deja `{ id, email, role }` en `req.user` | **401** `No autenticado` |
| `authorize(roles)` | `authorize.middleware.js` | Recibe los roles permitidos y los compara con `req.user.role` | **403** `No tenés permisos para realizar esta acción` |
| `authorizeEventOwner` | `ownership.middleware.js` | Carga el evento; deja pasar si `req.user` es su `organizer` o si su rol está en `EVENTS_MANAGE_ANY` (admin) | **404** si no existe · **403** si es ajeno |

```js
// src/routes/events.router.js
router.post('/', authenticate, authorize(PERMISSIONS.EVENTS_CREATE), createEvent);
router.put('/:eid', authenticate, authorize(PERMISSIONS.EVENTS_UPDATE_OWN), authorizeEventOwner, updateEvent);
```

### 401 vs 403

| Código | Significado | Cuándo |
|---|---|---|
| **401 Unauthorized** | **No sé quién sos.** No hay sesión válida. | Sin cookie, token inválido, manipulado o expirado |
| **403 Forbidden** | **Sé quién sos, pero no podés hacer esto.** | Sesión válida pero el rol no está permitido, o el evento pertenece a otro organizer |

El rol se toma del JWT: si un admin cambia el rol de un usuario, este debe volver a iniciar sesión para que el cambio aplique.

## Autenticación con Passport.js

Toda la autenticación pasa por estrategias de Passport definidas en **`src/config/passport.config.js`**. `app.js` solo registra las estrategias (`initializePassport()`) y ejecuta `passport.initialize()`. No se usan sesiones de servidor (`session: false`): el estado viaja en el JWT.

Las rutas delegan en la estrategia correspondiente mediante `passportCall(nombre)` (`middlewares/auth.middleware.js`), un envoltorio de `passport.authenticate(nombre, { session: false }, callback)` que deja el usuario autenticado en `req.user` y convierte los fallos al formato `{ status: "error", message }`.

```
POST /register → passportCall('register') → controller.register  → 201 { payload: usuario }
POST /login    → passportCall('login')    → controller.login     → genera JWT + cookie currentUser
GET  /current  → authenticate (= passportCall('current')) → controller.current → 200 { payload: { id, email, role } }
POST /logout   → controller.logout (no pasa por Passport)         → borra la cookie
```

### Estrategias

| Estrategia | Tipo | Qué hace | Fallos |
|---|---|---|---|
| `register` | `passport-local` (`usernameField: email`) | Valida campos obligatorios, formato de email y largo de contraseña; normaliza el email (trim + minúsculas); verifica unicidad; hashea con bcrypt; crea el usuario con rol por defecto `user` (el `role` del body se ignora). Devuelve el usuario **sin password**. | 400 `Faltan campos obligatorios` · 400 contraseña corta · 409 `El email ya está registrado` |
| `login` | `passport-local` (`usernameField: email`) | Busca el usuario por email normalizado y compara la contraseña con bcrypt. Devuelve `{ id, email, role }`. **No genera el JWT**: eso lo hace el controller. | 400 `Faltan campos obligatorios` · 401 `Credenciales inválidas` (siempre el mismo mensaje) |
| `current` | `passport-jwt` | Extrae el token de la cookie `currentUser`, verifica firma (`JWT_SECRET`, HS256) y expiración, y deja `{ id, email, role }` en `req.user`. | 401 `No autenticado` (sin cookie, token inválido, manipulado o expirado) |

### JWT y cookie

- El **controller de login** genera el JWT (`utils/jwt.js`) con payload `{ id, email, role }`, firmado con `JWT_SECRET` y con expiración `JWT_EXPIRES_IN`. **La contraseña nunca va en el token.**
- El token se guarda en la cookie **`currentUser`**: `httpOnly: true`, `sameSite: 'lax'`, `maxAge: 3600000` (1 h) y `secure: true` solo en producción.
- `POST /api/sessions/logout` elimina la cookie.

### Estrategias externas (preparado para Google / GitHub)

`passport.config.js` registra las estrategias desde un único objeto `strategies`. Para sumar un proveedor externo alcanza con instalar su paquete (por ejemplo `passport-github2`), crear la estrategia en ese archivo, agregarla al objeto y crear sus rutas en `sessions.router.js` usando `passportCall('github')`. **`app.js` no se modifica.**

```js
const strategies = {
  register: registerStrategy,
  login: loginStrategy,
  current: currentStrategy,
  // github: githubStrategy,
};
```

## Formato de respuesta

```json
{ "status": "success", "payload": { } }
{ "status": "success", "message": "..." }
{ "status": "error", "message": "..." }
```

## Rutas

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/api/health` | Estado del servidor | Pública |
| POST | `/api/sessions/register` | Registro de usuario (rol `user`) | Pública |
| POST | `/api/sessions/login` | Login: genera el JWT y setea la cookie `currentUser` | Pública |
| GET | `/api/sessions/current` | Datos del usuario autenticado (desde el JWT) | 🔒 Autenticado |
| POST | `/api/sessions/logout` | Cierra sesión (elimina la cookie) | Pública |
| GET | `/api/events` | Lista de eventos publicados | Pública |
| GET | `/api/events/:eid` | Detalle de un evento publicado | Pública |
| POST | `/api/events` | Crear evento | 🔒 `organizer`, `admin` |
| PUT | `/api/events/:eid` | Modificar evento | 🔒 `organizer` dueño, `admin` |
| PATCH | `/api/events/:eid/cancel` | Cancelar evento | 🔒 `organizer` dueño, `admin` |
| GET | `/api/users` | Listar usuarios | 🔒 `admin` |
| PATCH | `/api/users/:uid/role` | Cambiar el rol de un usuario | 🔒 `admin` |

> Los ejemplos usan `curl` de **Git Bash**. `-c cookies.txt` guarda la cookie recibida y `-b cookies.txt` la envía. En Postman la cookie se guarda y reenvía automáticamente.

### GET /api/health

```bash
curl http://localhost:8080/api/health
```

**200**

```json
{ "status": "ok", "message": "Servidor activo" }
```

### POST /api/sessions/register

**Body (JSON):**

| Campo | Tipo | Reglas |
|---|---|---|
| `first_name` | string | Obligatorio |
| `last_name` | string | Obligatorio |
| `email` | string | Obligatorio, formato válido. Se normaliza con trim + minúsculas |
| `password` | string | Obligatorio, mínimo 8 caracteres (máximo 72 bytes, límite de bcrypt) |

El campo `role` **no** se acepta desde el registro público: si se envía, se ignora y el usuario se crea con rol `user`.

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ana","last_name":"Gómez","email":"  ANA@Enjoy.com ","password":"supersecreta"}'
```

**201**

```json
{
  "status": "success",
  "payload": {
    "id": "6aaa8db17e684a75b105eda7",
    "first_name": "Ana",
    "last_name": "Gómez",
    "email": "ana@enjoy.com",
    "role": "user"
  }
}
```

| Código | Caso | Respuesta |
|---|---|---|
| 400 | Faltan campos o el email es inválido | `{ "status": "error", "message": "Faltan campos obligatorios" }` |
| 400 | Contraseña demasiado corta | `{ "status": "error", "message": "La contraseña debe tener al menos 8 caracteres" }` |
| 409 | El email ya existe | `{ "status": "error", "message": "El email ya está registrado" }` |

### POST /api/sessions/login

**Body (JSON):** `email` (string, obligatorio) y `password` (string, obligatorio).

```bash
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@enjoy.com","password":"supersecreta"}' \
  -c cookies.txt
```

**200** (y encabezado `Set-Cookie`)

```
Set-Cookie: currentUser=eyJhbGciOiJIUzI1NiIs...; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax
```

```json
{ "status": "success", "message": "Login correcto" }
```

| Código | Caso | Respuesta |
|---|---|---|
| 400 | Falta `email` o `password` | `{ "status": "error", "message": "Faltan campos obligatorios" }` |
| 401 | Email inexistente **o** contraseña incorrecta | `{ "status": "error", "message": "Credenciales inválidas" }` |

### GET /api/sessions/current 🔒

```bash
curl http://localhost:8080/api/sessions/current -b cookies.txt
```

**200**

```json
{
  "status": "success",
  "payload": {
    "id": "6aaa8db17e684a75b105eda7",
    "email": "ana@enjoy.com",
    "role": "user"
  }
}
```

| Código | Caso | Respuesta |
|---|---|---|
| 401 | Sin cookie, token inválido, manipulado o expirado | `{ "status": "error", "message": "No autenticado" }` |

### POST /api/sessions/logout

```bash
curl -X POST http://localhost:8080/api/sessions/logout -b cookies.txt -c cookies.txt
```

**200**

```json
{ "status": "success", "message": "Sesión cerrada" }
```

### GET /api/events

Lista los eventos con `status: "published"`, ordenados por fecha.

```bash
curl http://localhost:8080/api/events
```

**200**

```json
{
  "status": "success",
  "payload": [
    {
      "id": "6aaa9c427b5e7176f002420f",
      "title": "Spinning intensivo",
      "description": "Clase de 45 min",
      "category": "clase",
      "date": "2027-03-10T19:00:00.000Z",
      "location": "Sala 2",
      "capacity": 20,
      "organizer": "6aaa9c3b7b5e7176f002420c",
      "status": "published"
    }
  ]
}
```

### GET /api/events/:eid

```bash
curl http://localhost:8080/api/events/6aaa9c427b5e7176f002420f
```

**200** → `{ "status": "success", "payload": { ...evento } }` · **400** `ID de evento inválido` · **404** `Evento no encontrado` (también si está cancelado)

### POST /api/events 🔒 organizer / admin

**Body (JSON):**

| Campo | Tipo | Reglas |
|---|---|---|
| `title` | string | Obligatorio |
| `category` | string | Obligatorio: `clase`, `workshop`, `torneo` o `actividad` |
| `date` | string (ISO 8601) | Obligatorio, fecha futura |
| `capacity` | number | Obligatorio, entero > 0 |
| `description` | string | Opcional |
| `location` | string | Opcional |

El `organizer` se toma del usuario autenticado (no del body) y el `status` inicial es `published`.

```bash
curl -X POST http://localhost:8080/api/events -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"Spinning intensivo","description":"Clase de 45 min","category":"clase","date":"2027-03-10T19:00:00Z","location":"Sala 2","capacity":20}'
```

**201**

```json
{
  "status": "success",
  "payload": {
    "id": "6aaa9c427b5e7176f002420f",
    "title": "Spinning intensivo",
    "description": "Clase de 45 min",
    "category": "clase",
    "date": "2027-03-10T19:00:00.000Z",
    "location": "Sala 2",
    "capacity": 20,
    "organizer": "6aaa9c3b7b5e7176f002420c",
    "status": "published"
  }
}
```

| Código | Caso | Respuesta |
|---|---|---|
| 400 | Faltan campos / datos inválidos | `{ "status": "error", "message": "Faltan campos obligatorios" }` (o el detalle del campo inválido) |
| 401 | Sin sesión | `{ "status": "error", "message": "No autenticado" }` |
| 403 | Autenticado como `user` | `{ "status": "error", "message": "No tenés permisos para realizar esta acción" }` |

### PUT /api/events/:eid 🔒 organizer dueño / admin

Actualiza uno o más de: `title`, `category`, `date`, `capacity`, `description`, `location` (con las mismas reglas que al crear). `organizer` y `status` no se pueden modificar por esta ruta y se ignoran.

```bash
curl -X PUT http://localhost:8080/api/events/6aaa9c427b5e7176f002420f -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"capacity":25,"location":"Sala 3"}'
```

**200** → `{ "status": "success", "payload": { ...evento actualizado } }`

| Código | Caso | Respuesta |
|---|---|---|
| 400 | ID inválido, datos inválidos o sin campos válidos | `{ "status": "error", "message": "No hay campos válidos para actualizar" }` |
| 401 | Sin sesión | `{ "status": "error", "message": "No autenticado" }` |
| 403 | `user`, o `organizer` que no es dueño del evento | `{ "status": "error", "message": "No tenés permisos para realizar esta acción" }` |
| 404 | El evento no existe | `{ "status": "error", "message": "Evento no encontrado" }` |
| 409 | El evento está cancelado | `{ "status": "error", "message": "El evento está cancelado" }` |

### PATCH /api/events/:eid/cancel 🔒 organizer dueño / admin

Cambia el `status` del evento a `cancelled` (deja de aparecer en el listado público).

```bash
curl -X PATCH http://localhost:8080/api/events/6aaa9c427b5e7176f002420f/cancel -b cookies.txt
```

**200** → `{ "status": "success", "payload": { ..., "status": "cancelled" } }` · mismos errores que `PUT` (409 si ya estaba cancelado)

### GET /api/users 🔒 admin

```bash
curl http://localhost:8080/api/users -b cookies.txt
```

**200**

```json
{
  "status": "success",
  "payload": [
    { "id": "6aaa8db17e684a75b105eda7", "first_name": "Ana", "last_name": "Gómez", "email": "ana@enjoy.com", "role": "user" }
  ]
}
```

**401** sin sesión · **403** como `user` u `organizer`

### PATCH /api/users/:uid/role 🔒 admin

**Body (JSON):** `role` (`user` | `organizer` | `admin`).

```bash
curl -X PATCH http://localhost:8080/api/users/6aaa8db17e684a75b105eda7/role -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"role":"organizer"}'
```

**200** → `{ "status": "success", "payload": { ..., "role": "organizer" } }`

| Código | Caso | Respuesta |
|---|---|---|
| 400 | ID o rol inválido | `{ "status": "error", "message": "El rol debe ser uno de: user, organizer, admin" }` |
| 401 | Sin sesión | `{ "status": "error", "message": "No autenticado" }` |
| 403 | No es admin | `{ "status": "error", "message": "No tenés permisos para realizar esta acción" }` |
| 404 | El usuario no existe | `{ "status": "error", "message": "Usuario no encontrado" }` |
| 409 | El admin intenta cambiar su propio rol | `{ "status": "error", "message": "No podés modificar tu propio rol" }` |

### Ruta inexistente

**404**

```json
{ "status": "error", "message": "Ruta GET /api/xyz no encontrada" }
```

## Casos de prueba

| # | Caso | Resultado esperado |
|---|---|---|
| 1 | Registro válido | 201 con usuario sin `password` |
| 2 | Registro con campos faltantes / email inválido | 400 |
| 3 | Registro con email duplicado | 409 |
| 4 | En MongoDB, `password` es un hash `$2b$10$...` | ✔ |
| 5 | Login correcto | 200 + cookie `currentUser` HttpOnly |
| 6 | `current` con la cookie | 200 con `{ id, email, role }` |
| 7 | Logout y luego `current` | 200 → 401 |
| 8 | Login con email inexistente | 401 Credenciales inválidas |
| 9 | Login con contraseña incorrecta | 401 Credenciales inválidas |
| 10 | `current` sin cookie | 401 No autenticado |
| 11 | `current` con token manipulado o expirado | 401 No autenticado |
| 12 | `POST /api/events` sin cookie | 401 No autenticado |
| 13 | `POST /api/events` como `user` | 403 No tenés permisos |
| 14 | `POST /api/events` como `organizer` / `admin` | 201 |
| 15 | `GET /api/users` como `organizer` | 403 |
| 16 | `GET /api/users` como `admin` | 200 (sin `password`) |
| 17 | `PUT` / `PATCH cancel` de un evento ajeno como `organizer` | 403 |
| 18 | `PUT` de un evento ajeno como `admin` | 200 |
| 19 | `PATCH /api/users/:uid/role` como `organizer` | 403 |

## Avance

| Pre-entrega | Descripción | Estado |
|---|---|---|
| 1 | Refactor arquitectónico inicial (estructura por capas) | ✅ |
| 2 | Registro seguro de usuarios (validación, bcrypt, MongoDB) | ✅ |
| 3 | Autenticación con JWT y cookies (login, current, logout) | ✅ |
| 4 | Autenticación centralizada con Passport.js (estrategias register, login, current) | ✅ |
| 5 | Roles y autorización (matriz de permisos, 401 vs 403, propiedad de eventos) | ✅ |
| 6 – 8 | — | ⏳ Pendientes |
