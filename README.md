# Enjoy · Plataforma de Eventos e Inscripciones

Proyecto integrador de la materia **Programación Backend II** (CoderHouse).

API REST para gestionar las **clases y eventos del gimnasio Enjoy**: los organizadores (profes) crean eventos — clases, workshops, torneos o actividades — y los usuarios se inscriben ocupando un cupo.

> 🚧 **Estado:** Pre-entrega 1 — estructura base de la API organizada por capas. Las funcionalidades se agregan en cada pre-entrega (ver [Avance](#avance)).

## Tecnologías

- Node.js + Express 5 (módulos ESM)
- MongoDB Atlas + Mongoose
- dotenv
- nodemon (desarrollo)
- Próximas entregas: JWT (jsonwebtoken) en cookie HTTP Only (cookie-parser), bcrypt, Passport.js, Nodemailer

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
| `MONGO_URL` | Connection string de MongoDB Atlas. Si no está definida, el servidor inicia igual (sin conexión a la base) |
| `JWT_SECRET` | Secreto para firmar los JWT |
| `JWT_EXPIRES_IN` | Expiración del token (ej. `1h`) |
| `COOKIE_NAME` | Nombre de la cookie donde viaja el token |
| `BCRYPT_SALT_ROUNDS` | Rondas de salt para bcrypt |
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
├── services/                  # Lógica de negocio
│   └── events.service.js
├── repositories/              # Acceso a datos desacoplado de la persistencia (próximas entregas)
├── dao/                       # Operaciones concretas contra MongoDB (próximas entregas)
├── models/                    # Esquemas de Mongoose
│   ├── user.model.js
│   └── event.model.js
├── middlewares/
│   ├── notFound.middleware.js
│   └── errorHandler.middleware.js
└── utils/
    └── response.js            # Helpers de respuesta con formato uniforme
```

## Modelos

**User**: `first_name`, `last_name`, `email` (único), `age`, `password` (nunca se devuelve), `role` (`user` | `organizer` | `admin`), timestamps.

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
| POST | `/api/sessions/register` | Registro de usuario | 🚧 501 |
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

### Rutas de sessions (estructura inicial)

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
| 2 – 8 | — | ⏳ Pendientes |
