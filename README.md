# Enjoy · Plataforma de Eventos e Inscripciones

Proyecto integrador de la materia **Programación Backend II** (CoderHouse).

API REST para gestionar las **clases y eventos del gimnasio Enjoy**: los organizadores (profes) crean eventos — clases, workshops, torneos o actividades — y los usuarios se inscriben ocupando un cupo.

> 🚧 **Estado:** Pre-entrega 2 — registro seguro de usuarios. Las funcionalidades se agregan en cada pre-entrega (ver [Avance](#avance)).

## Tecnologías

- Node.js + Express 5 (módulos ESM)
- MongoDB Atlas + Mongoose
- bcrypt (hash de contraseñas)
- dotenv
- nodemon (desarrollo)
- Próximas entregas: JWT (jsonwebtoken) en cookie HTTP Only (cookie-parser), Passport.js, Nodemailer

## Instalación

```bash
git clone <url-del-repo>
cd <carpeta-del-repo>
npm install
cp .env.example .env   # completar con valores reales
```

## Variables de entorno

Definidas en `.env.example` (el archivo `.env` real **no** se sube al repo).

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto `8080`) |
| `NODE_ENV` | `development` / `production` |
| `MONGO_URL` | **Obligatoria.** Connection string de MongoDB Atlas (el servidor no inicia sin ella) |
| `JWT_SECRET` | Secreto para firmar los JWT |
| `JWT_EXPIRES_IN` | Expiración del token (ej. `1h`) |
| `COOKIE_NAME` | Nombre de la cookie donde viaja el token |
| `BCRYPT_SALT_ROUNDS` | Rondas de salt para bcrypt (por defecto `10`) |
| `MAIL_SERVICE` | Servicio de correo para Nodemailer (ej. `gmail`) |
| `MAIL_USER` | Usuario/cuenta de correo |
| `MAIL_PASS` | Contraseña de aplicación del correo |

## Cómo ejecutar

```bash
npm run dev   # desarrollo (nodemon)
npm start     # producción (node)
```

El servidor queda disponible en `http://localhost:<PORT>` (por defecto `http://localhost:8080`).

## Estructura de carpetas

```
src/
├── app.js                     # Configura Express (middlewares, router /api, 404 y errores)
├── server.js                  # Punto de entrada: conecta a MongoDB y levanta el servidor
├── config/
│   ├── env.js                 # Carga dotenv y expone la configuración
│   └── db.js                  # Conexión a MongoDB con Mongoose
├── routes/
│   ├── index.js               # Router principal montado en /api
│   ├── health.router.js
│   ├── events.router.js
│   └── sessions.router.js
├── controllers/               # Manejo de request/response
│   ├── health.controller.js
│   ├── events.controller.js
│   └── sessions.controller.js
├── services/                  # Lógica de negocio (validaciones, reglas)
│   ├── events.service.js
│   └── sessions.service.js
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
│   ├── notFound.middleware.js
│   └── errorHandler.middleware.js
└── utils/
    ├── response.js            # Helpers de respuesta con formato uniforme
    ├── hash.js                # createHash / isValidPassword (bcrypt)
    ├── validators.js          # Validación y normalización de datos
    └── AppError.js            # Error con código HTTP
```

## Modelos

**User**: `first_name`, `last_name`, `email` (único, guardado en minúsculas), `password` (hash bcrypt, nunca se devuelve), `role` (`user` | `organizer` | `admin`, default `user`), timestamps.

**Event**: `title`, `description`, `category` (`clase` | `workshop` | `torneo` | `actividad`), `date`, `location`, `capacity`, `organizer` (ref. User), timestamps.

## Formato de respuesta

```json
{ "status": "success", "payload": { } }
{ "status": "success", "message": "..." }
{ "status": "error", "message": "..." }
```

## Rutas

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/api/health` | Chequeo de estado del servidor | ✅ |
| GET | `/api/events` | Lista de eventos | ✅ (lista vacía por ahora) |
| POST | `/api/sessions/register` | Registro de usuario | ✅ |
| POST | `/api/sessions/login` | Login | 🚧 501 |
| GET | `/api/sessions/current` | Usuario autenticado | 🚧 501 |
| POST | `/api/sessions/logout` | Logout | 🚧 501 |

### GET /api/health

```bash
curl http://localhost:8080/api/health
```

```json
{ "status": "ok", "message": "Servidor activo" }
```

### GET /api/events

```bash
curl http://localhost:8080/api/events
```

```json
{ "status": "success", "payload": [] }
```

### POST /api/sessions/register

Registra un usuario nuevo. Flujo: `sessions.router` → `sessions.controller` → `sessions.service` (valida, normaliza, hashea) → `user.repository` → `user.dao` → `UserModel`.

**Body (JSON):**

| Campo | Tipo | Reglas |
|---|---|---|
| `first_name` | string | Obligatorio |
| `last_name` | string | Obligatorio |
| `email` | string | Obligatorio, formato válido. Se normaliza con trim + minúsculas |
| `password` | string | Obligatorio, mínimo 8 caracteres (máximo 72 bytes, límite de bcrypt) |

El campo `role` **no** se acepta desde el registro público: si se envía, se ignora y el usuario se crea con rol `user`.

```bash
curl -X POST http://localhost:8080/api/sessions/register   -H "Content-Type: application/json"   -d '{"first_name":"Ana","last_name":"Gómez","email":"  ANA@Enjoy.com ","password":"supersecreta"}'
```

**201 Created**

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

**Errores**

| Código | Caso | Respuesta |
|---|---|---|
| 400 | Faltan campos o el email es inválido | `{ "status": "error", "message": "Faltan campos obligatorios" }` |
| 400 | Contraseña demasiado corta | `{ "status": "error", "message": "La contraseña debe tener al menos 8 caracteres" }` |
| 409 | El email ya existe | `{ "status": "error", "message": "El email ya está registrado" }` |

**Casos a probar:** registro exitoso (201) · campos faltantes (400) · email inválido (400) · email duplicado, incluso con otras mayúsculas/espacios (409) · la respuesta no contiene `password` · en MongoDB el campo `password` es un hash (`$2b$10$...`), no el texto plano.

### Rutas de sessions pendientes

```bash
curl -X POST http://localhost:8080/api/sessions/login
```

```json
{ "status": "error", "message": "Funcionalidad pendiente de implementación" }
```

### Ruta inexistente (404)

```json
{ "status": "error", "message": "Ruta GET /api/xyz no encontrada" }
```

## Avance

| Pre-entrega | Descripción | Estado |
|---|---|---|
| 1 | Refactor arquitectónico inicial (estructura por capas) | ✅ |
| 2 | Registro seguro de usuarios (validación, bcrypt, MongoDB) | ✅ |
| 3 – 8 | — | ⏳ Pendientes |
