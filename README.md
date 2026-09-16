# Enjoy · Plataforma de Eventos e Inscripciones

Proyecto integrador de la materia **Programación Backend II** (CoderHouse).

API REST para gestionar las **clases y eventos del gimnasio Enjoy**: los organizadores (profes) crean eventos — clases, workshops, torneos o actividades — y los usuarios se inscriben ocupando un cupo.

> 🚧 **Estado:** Pre-entrega 4 — autenticación centralizada con Passport.js (JWT en cookie HTTP Only). Las funcionalidades se agregan en cada pre-entrega (ver [Avance](#avance)).

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

## Estructura de carpetas

```
src/
├── app.js                     # Configura Express (json, cookies, Passport, router /api, 404 y errores)
├── server.js                  # Punto de entrada: valida env, conecta a MongoDB y levanta el servidor
├── config/
│   ├── env.js                 # Carga dotenv, expone la configuración y valida variables obligatorias
│   ├── db.js                  # Conexión a MongoDB Atlas con Mongoose
│   ├── cookie.js              # Nombre y opciones de la cookie de autenticación
│   └── passport.config.js     # Estrategias de Passport: register, login y current
├── routes/
│   ├── index.js               # Router principal montado en /api
│   ├── health.router.js
│   ├── events.router.js
│   └── sessions.router.js
├── controllers/               # Manejo de request/response
│   ├── health.controller.js
│   ├── events.controller.js
│   └── sessions.controller.js # Genera el JWT y maneja la cookie tras la autenticación
├── services/                  # Lógica de negocio
│   └── events.service.js
├── repositories/              # Acceso a datos desacoplado de la persistencia
│   └── user.repository.js
├── dao/                       # Operaciones concretas contra MongoDB
│   └── user.dao.js
├── dto/                       # Objetos de salida (qué datos se exponen)
│   └── user.dto.js
├── models/                    # Esquemas de Mongoose
│   ├── user.model.js
│   └── event.model.js
├── middlewares/
│   ├── auth.middleware.js     # passportCall: ejecuta una estrategia y traduce sus fallos al formato de la API
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

**Event**: `title`, `description`, `category` (`clase` | `workshop` | `torneo` | `actividad`), `date`, `location`, `capacity`, `organizer` (ref. User), timestamps.

## Autenticación con Passport.js

Toda la autenticación pasa por estrategias de Passport definidas en **`src/config/passport.config.js`**. `app.js` solo registra las estrategias (`initializePassport()`) y ejecuta `passport.initialize()`. No se usan sesiones de servidor (`session: false`): el estado viaja en el JWT.

Las rutas delegan en la estrategia correspondiente mediante `passportCall(nombre)` (`middlewares/auth.middleware.js`), un envoltorio de `passport.authenticate(nombre, { session: false }, callback)` que deja el usuario autenticado en `req.user` y convierte los fallos al formato `{ status: "error", message }`.

```
POST /register → passportCall('register') → controller.register  → 201 { payload: usuario }
POST /login    → passportCall('login')    → controller.login     → genera JWT + cookie currentUser
GET  /current  → passportCall('current')  → controller.current   → 200 { payload: { id, email, role } }
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

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/health` | Estado del servidor | — |
| GET | `/api/events` | Lista de eventos (vacía por ahora) | — |
| POST | `/api/sessions/register` | Registro de usuario | — |
| POST | `/api/sessions/login` | Login: genera el JWT y setea la cookie `currentUser` | — |
| GET | `/api/sessions/current` | Datos del usuario autenticado (desde el JWT) | 🔒 Cookie |
| POST | `/api/sessions/logout` | Cierra sesión (elimina la cookie) | — |

> Los ejemplos usan `curl` de **Git Bash**. `-c cookies.txt` guarda la cookie recibida y `-b cookies.txt` la envía. En Postman la cookie se guarda y reenvía automáticamente.

### GET /api/health

```bash
curl http://localhost:8080/api/health
```

**200**

```json
{ "status": "ok", "message": "Servidor activo" }
```

### GET /api/events

```bash
curl http://localhost:8080/api/events
```

**200**

```json
{ "status": "success", "payload": [] }
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

## Avance

| Pre-entrega | Descripción | Estado |
|---|---|---|
| 1 | Refactor arquitectónico inicial (estructura por capas) | ✅ |
| 2 | Registro seguro de usuarios (validación, bcrypt, MongoDB) | ✅ |
| 3 | Autenticación con JWT y cookies (login, current, logout) | ✅ |
| 4 | Autenticación centralizada con Passport.js (estrategias register, login, current) | ✅ |
| 5 – 8 | — | ⏳ Pendientes |
