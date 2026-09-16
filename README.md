# Enjoy · Plataforma de Eventos e Inscripciones

Proyecto integrador de la materia **Programación Backend II** (CoderHouse).

API REST para gestionar las **clases y eventos del gimnasio Enjoy**: los organizadores (profes) crean eventos — clases, workshops, torneos o actividades — y los usuarios se inscriben ocupando un cupo.

> 🚧 **Estado:** base del repositorio inicializada. Las funcionalidades se agregan en cada pre-entrega (ver [Avance](#avance)).

## Tecnologías

- Node.js + Express (módulos ESM)
- MongoDB Atlas + Mongoose
- JWT (jsonwebtoken) en cookie HTTP Only (cookie-parser)
- bcrypt · Passport.js
- Nodemailer
- dotenv
- nodemon (desarrollo)

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
| `PORT` | Puerto del servidor (ej. `8080`) |
| `NODE_ENV` | `development` / `production` |
| `MONGO_URL` | Connection string de MongoDB Atlas |
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

## Estructura de carpetas (prevista)

```
src/
├── app.js            # Configuración de Express (sin levantar el server)
├── server.js         # Punto de entrada: levanta el servidor
├── config/           # Configuración (env, DB, passport, mail)
├── routes/           # Definición de rutas
├── controllers/      # Manejo de request/response
├── services/         # Lógica de negocio
├── repositories/     # Acceso a datos desacoplado de la persistencia
├── dao/              # Operaciones concretas contra MongoDB
├── models/           # Esquemas de Mongoose
├── middlewares/      # Auth, roles, manejo de errores, validaciones
└── utils/            # Helpers (respuestas, hash, jwt, etc.)
```

## Formato de respuesta

```json
{ "status": "success", "payload": { } }
{ "status": "success", "message": "..." }
{ "status": "error", "message": "..." }
```

## Rutas

_Se completa a partir de la Pre-entrega 1._

| Método | Ruta | Descripción |
|---|---|---|

## Avance

| Pre-entrega | Estado |
|---|---|
| Base del repo | ✅ |
| 1 – 8 | ⏳ Pendientes |
