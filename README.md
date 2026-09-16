# Enjoy · Plataforma de Eventos e Inscripciones

Proyecto integrador de la materia **Programación Backend II** (CoderHouse).

API REST para gestionar las **clases y eventos del gimnasio Enjoy**: los organizadores (profes) crean eventos — clases, workshops, torneos o actividades — y los usuarios se inscriben ocupando un cupo.

> 🚧 **Estado:** Pre-entrega 8 — arquitectura formal en capas con DAO, Repository y DTO. Las funcionalidades se agregan en cada pre-entrega (ver [Avance](#avance)).

## Tecnologías

- Node.js + Express 5 (módulos ESM)
- MongoDB Atlas + Mongoose
- bcrypt (hash de contraseñas)
- jsonwebtoken (JWT) + cookie-parser (cookie HTTP Only)
- Passport.js (passport-local, passport-jwt)
- Nodemailer (emails de confirmación por SMTP)
- dotenv
- nodemon (desarrollo)

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
| `MAIL_HOST` | Servidor SMTP (ej. `smtp.ethereal.email`, `sandbox.smtp.mailtrap.io`) |
| `MAIL_PORT` | Puerto SMTP (`587` por defecto; con `465` se usa conexión segura) |
| `MAIL_USER` | Usuario SMTP |
| `MAIL_PASS` | Contraseña SMTP |
| `MAIL_FROM` | Remitente, ej. `"Enjoy Gym <no-reply@enjoy.com>"` |

Si falta `MONGO_URL` o `JWT_SECRET`, el servidor no inicia e informa qué variable falta. Las variables `MAIL_*` son opcionales: sin ellas la API funciona pero no envía emails (ver [Email de confirmación](#email-de-confirmación-nodemailer)).

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
│   ├── mailer.js              # Transporter SMTP de Nodemailer (desde variables MAIL_*)
│   ├── passport.config.js     # Estrategias de Passport (adaptadores a sessions.service)
│   └── roles.js               # Roles y matriz de permisos (PERMISSIONS)
├── constants/
│   ├── event.constants.js     # Categorías y estados de eventos
│   ├── ticket.constants.js    # Estados de tickets y estados que ocupan cupo
│   └── messages.js            # Mensajes de error compartidos
├── routes/                    # Método + path → middlewares → controller
│   ├── index.js               # Router principal montado en /api
│   ├── health.router.js
│   ├── events.router.js
│   ├── sessions.router.js
│   ├── tickets.router.js
│   └── users.router.js
├── middlewares/
│   ├── auth.middleware.js     # authenticate (401) y passportCall
│   ├── authorize.middleware.js # authorize(roles permitidos) (403)
│   ├── ownership.middleware.js # Carga recursos propios vía services (404 / 403)
│   ├── notFound.middleware.js
│   └── errorHandler.middleware.js # Manejo centralizado de errores
├── controllers/               # Solo request/response
│   ├── health.controller.js
│   ├── events.controller.js
│   ├── sessions.controller.js # Genera el JWT y maneja la cookie tras la autenticación
│   ├── tickets.controller.js
│   └── users.controller.js
├── services/                  # Lógica de negocio
│   ├── sessions.service.js    # Registro y validación de credenciales
│   ├── events.service.js      # CRUD, estados, filtros y permisos sobre eventos propios
│   ├── tickets.service.js     # Inscripción, cupos, duplicados, cancelación y permisos sobre tickets propios
│   ├── users.service.js       # Listado de usuarios y cambio de rol
│   └── mail.service.js        # Email de confirmación de inscripción
├── repositories/              # Métodos de dominio sobre los DAO
│   ├── user.repository.js
│   ├── event.repository.js
│   ├── ticket.repository.js
│   └── transaction.repository.js
├── dao/                       # Únicos que importan modelos de Mongoose
│   ├── base.dao.js            # BaseDAO: create, findById, findOne, find, count, sum, updateById, updateOne
│   ├── user.dao.js            # UserDAO
│   ├── event.dao.js           # EventDAO
│   ├── ticket.dao.js          # TicketDAO
│   └── transaction.dao.js     # Transacciones de MongoDB
├── dto/                       # Qué datos expone cada respuesta
│   ├── user.dto.js
│   ├── event.dto.js
│   └── ticket.dto.js
├── models/                    # Esquemas de Mongoose
│   ├── user.model.js
│   ├── event.model.js
│   └── ticket.model.js
└── utils/
    ├── AppError.js            # Error con código HTTP
    ├── response.js            # sendSuccess / sendError con formato uniforme
    ├── hash.js                # createHash / isValidPassword (bcrypt)
    ├── jwt.js                 # generateToken (lo usa el controller de login)
    ├── permissions.js         # isOwnerOrPrivileged (dueño o rol con permiso global)
    ├── reservationCode.js     # Código de reserva de los tickets
    └── validators.js          # Validación y normalización de datos
```

## Arquitectura en capas

Cada request atraviesa capas con una única responsabilidad. Cada capa solo conoce a la de abajo:

```
HTTP request
   │
   ▼
routes/          Define método + path y encadena middlewares y controller
   │
middlewares/     authenticate (401) · authorize (403) · ownership (404/403) · errorHandler
   │
controllers/     Extrae body/params/query, llama al service, responde con sendSuccess
   │
services/        Lógica de negocio: validaciones, cupos, estados, duplicados, permisos sobre recursos propios, email
   │
repositories/    Métodos de dominio (findByEmail, findEvents, countOccupiedSeats, cancelTicket…)
   │
dao/             Acceso genérico a MongoDB (findById, findOne, find, create, updateById, count, sum)
   │
models/          Esquemas de Mongoose
   │
   ▼
MongoDB Atlas
```

Las respuestas salen de los services ya convertidas por un **DTO** (`dto/`), así nunca se expone un documento crudo.

### Responsabilidad de cada capa

| Capa | Archivos | Responsabilidad | Puede importar | No puede |
|---|---|---|---|---|
| **Routes** | `routes/*.router.js` | Asociar método + path con middlewares y controller | controllers, middlewares, `config/roles.js` | Tener lógica, hablar con la base |
| **Middlewares** | `middlewares/*.js` | Autenticación (401), autorización por rol (403), carga de recursos propios, 404 de rutas y manejo centralizado de errores | services, `AppError` | Importar modelos, DAOs o repositories |
| **Controllers** | `controllers/*.controller.js` | Coordinar request/response: extraer datos, llamar al service, devolver `{ status, payload/message }` | services, DTOs, utils de respuesta | Importar modelos, DAOs o repositories; validar reglas de negocio |
| **Services** | `services/*.service.js` | Toda la lógica de negocio: validaciones, cupos, transiciones de estado, duplicados, permisos sobre recursos propios, envío de email, armado de DTOs | repositories, DTOs, constants, utils | Importar modelos, DAOs o Mongoose |
| **Repositories** | `repositories/*.repository.js` | Traducir necesidades del dominio a consultas: filtros, orden, paginación, `populate` con campos seleccionados, suma de cupos, cancelación lógica | su DAO, constants | Importar modelos; conocer reglas de negocio o HTTP |
| **DAO** | `dao/*.dao.js` | Operaciones genéricas sobre un modelo (`BaseDAO`): `create`, `findById`, `findOne`, `find`, `count`, `sum`, `updateById`, `updateOne`; transacciones | modelos, Mongoose | Conocer reglas de negocio |
| **Models** | `models/*.model.js` | Esquema, validaciones de persistencia e índices | Mongoose, constants | — |
| **DTO** | `dto/*.dto.js` | Definir qué datos se exponen en cada respuesta | — | Incluir `password` o datos no pedidos |

**Regla clave:** los **DAO son los únicos que importan modelos de Mongoose**. Services y controllers nunca los ven.

### DAO

`BaseDAO` (`dao/base.dao.js`) implementa las operaciones genéricas y devuelve objetos planos (`lean`). Hay un DAO por entidad, que solo le indica el modelo:

| DAO | Modelo |
|---|---|
| `UserDAO` | `User` |
| `EventDAO` | `Event` |
| `TicketDAO` | `Ticket` |

`dao/transaction.dao.js` envuelve las transacciones de MongoDB (usadas en la inscripción).

### Repositories

| Repository | Métodos de dominio |
|---|---|
| `UserRepository` | `create`, `findById`, `findByEmail`, `findByEmailWithPassword` (único que trae el hash, solo para login), `findAll`, `updateRole` |
| `EventRepository` | `create`, `findById`, `findEvents` (filtros + paginación + orden), `update`, `lockForEnrollment` |
| `TicketRepository` | `create`, `findById`, `findActiveByUserAndEvent`, `countOccupiedSeats`, `findByUserWithEvent`, `findByEventWithAttendees`, `cancelTicket` |
| `TransactionRepository` | `run(work)` |

### DTO

| DTO | Archivo | Se usa en | Campos |
|---|---|---|---|
| `toSessionUser` | `user.dto.js` | Login (payload del JWT) y `GET /api/sessions/current` | `id`, `email`, `role` |
| `toPublicUser` | `user.dto.js` | Registro, `GET /api/users`, cambio de rol | `id`, `first_name`, `last_name`, `email`, `role` |
| `toPublicEvent` | `event.dto.js` | Todas las respuestas de eventos | `id`, `title`, `description`, `category`, `date`, `location`, `capacity`, `price`, `status`, `organizer` (solo el id) |
| `toTicket` | `ticket.dto.js` | Inscripción y cancelación | datos del ticket + ids de `event` y `user` |
| `toMyTicket` | `ticket.dto.js` | `GET /api/tickets/my-tickets` | datos del ticket + evento populado filtrado a `id`, `title`, `date`, `location`, `status` |
| `toEventAttendeeTicket` | `ticket.dto.js` | `GET /api/events/:eid/tickets` | datos del ticket + usuario populado filtrado a `id`, `first_name`, `last_name`, `email` |

Ninguna respuesta incluye `password`. Además, el campo tiene `select: false` en el modelo y los `populate` piden solo los campos necesarios: el filtro se aplica tanto en la consulta como en el DTO.

### Manejo de errores

- Los services lanzan `AppError(message, statusCode)`; los middlewares también generan `AppError` para 401, 403 y 404.
- Todos los errores llegan a **un único middleware** (`middlewares/errorHandler.middleware.js`), que responde siempre `{ "status": "error", "message": "..." }`:

| Código | Origen |
|---|---|
| 400 | Datos inválidos (`AppError`), JSON mal formado, errores de validación o cast de Mongoose |
| 401 | Sin sesión o token inválido (`authenticate`), credenciales inválidas (login) |
| 403 | Rol sin permiso (`authorize`) o recurso ajeno (services de eventos y tickets) |
| 404 | Recurso inexistente (services) o ruta inexistente (`notFound`) |
| 409 | Conflictos de negocio: email duplicado, inscripción duplicada, sin cupo, evento cancelado, transición de estado inválida; clave duplicada en MongoDB |
| 500 | Solo errores no previstos: se registran en consola y el cliente recibe `Error interno del servidor` |

## Modelos

**User**: `first_name`, `last_name`, `email` (único, guardado en minúsculas), `password` (hash bcrypt, nunca se devuelve), `role` (`user` | `organizer` | `admin`, default `user`), timestamps.

**Ticket**: `user` (ref. User), `event` (ref. Event), `status` (`confirmed` | `pending` | `cancelled`), `quantity`, `reservationCode`, `cancelledAt`, timestamps. Detalle en [Tickets: inscripciones y cupos](#tickets-inscripciones-y-cupos).

**Event**: `title`, `description`, `category`, `date`, `location`, `capacity`, `price`, `status` (`draft` | `published` | `cancelled` | `finished`), `organizer` (referencia ObjectId a User), timestamps. Detalle y reglas en [Eventos: reglas de negocio](#eventos-reglas-de-negocio).

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
| Cambiar estado de eventos propios (publicar, cancelar, finalizar) | ❌ 401 | ❌ 403 | ✅ | ✅ | `EVENTS_CHANGE_STATUS_OWN` |
| Modificar / cambiar estado de **cualquier** evento | ❌ 401 | ❌ 403 | ❌ 403 | ✅ | `EVENTS_MANAGE_ANY` |
| Ver todos los usuarios | ❌ 401 | ❌ 403 | ❌ 403 | ✅ | `USERS_READ_ALL` |
| Cambiar el rol de un usuario | ❌ 401 | ❌ 403 | ❌ 403 | ✅ | `USERS_UPDATE_ROLE` |
| Inscribirse a un evento | ❌ 401 | ✅ | ✅ | ✅ | `TICKETS_CREATE` |
| Ver mis tickets | ❌ 401 | ✅ | ✅ | ✅ | autenticado |
| Cancelar mis tickets | ❌ 401 | ✅ | ✅ | ✅ | dueño del ticket |
| Ver inscriptos de mis eventos | ❌ 401 | ❌ 403 | ✅ | ✅ | `TICKETS_READ_EVENT_OWN` |
| Ver inscriptos / cancelar tickets de **cualquier** evento o usuario | ❌ 401 | ❌ 403 | ❌ 403 | ✅ | `EVENTS_MANAGE_ANY` / `TICKETS_CANCEL_ANY` |
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
| `authorizeEventOwner(param)` | `ownership.middleware.js` | Pide el evento a `events.service` (`getManageableEvent`), que verifica que `req.user` sea su `organizer` o tenga un rol de `EVENTS_MANAGE_ANY` (admin) | **404** si no existe · **403** si es ajeno |
| `authorizeTicketOwner` | `ownership.middleware.js` | Pide el ticket a `tickets.service` (`getCancellableTicket`), que verifica que `req.user` sea su dueño o tenga un rol de `TICKETS_CANCEL_ANY` (admin) | **404** si no existe · **403** si es ajeno |

```js
// src/routes/events.router.js
router.post('/', authenticate, authorize(PERMISSIONS.EVENTS_CREATE), createEvent);
router.put('/:id', authenticate, authorize(PERMISSIONS.EVENTS_UPDATE_OWN), authorizeEventOwner('id'), updateEvent);
```

### 401 vs 403

| Código | Significado | Cuándo |
|---|---|---|
| **401 Unauthorized** | **No sé quién sos.** No hay sesión válida. | Sin cookie, token inválido, manipulado o expirado |
| **403 Forbidden** | **Sé quién sos, pero no podés hacer esto.** | Sesión válida pero el rol no está permitido, o el evento pertenece a otro organizer |

El rol se toma del JWT: si un admin cambia el rol de un usuario, este debe volver a iniciar sesión para que el cambio aplique.

## Eventos: reglas de negocio

Todas estas validaciones viven en `src/services/events.service.js` (no en rutas ni controllers). El control por rol lo hace `authorize`; la verificación de dueño la decide el servicio (`getManageableEvent`) y la invoca `ownership.middleware` antes del controller.

### Modelo

| Campo | Tipo | Reglas |
|---|---|---|
| `title` | String | Obligatorio |
| `description` | String | Obligatorio |
| `category` | String | Obligatorio: `clase` · `workshop` · `torneo` · `actividad` |
| `date` | Date | Obligatorio; no puede ser pasada |
| `location` | String | Obligatorio |
| `capacity` | Number | Obligatorio, entero > 0 |
| `price` | Number | ≥ 0 (default `0`) |
| `status` | String | `draft` · `published` · `cancelled` · `finished` |
| `organizer` | ObjectId → `User` | **Referencia** al usuario que lo creó (no se embebe el usuario) |

### Reglas

1. **Organizer automático:** al crear, `organizer` = `req.user.id`. Nunca se toma del body.
2. **Propiedad:** un `organizer` solo modifica o cambia el estado de **sus** eventos; `admin` puede sobre cualquiera (403 si no).
3. **Fecha:** no se permite crear (ni reprogramar) un evento con fecha pasada.
4. **Cupo y precio:** se rechaza `capacity` ≤ 0 (o no entero) y `price` < 0.
5. **Cancelados:** un evento `cancelled` no se modifica ni cambia de estado (409).
6. **Publicación:** no se puede publicar un evento `finished` o `cancelled` (409).
7. **Sin borrado físico:** no existe `DELETE`; cancelar es `PATCH /status` con `cancelled` y el evento queda guardado.
8. **Borradores:** los eventos `draft` no aparecen en el listado ni en el detalle públicos.

### Transiciones de estado

| Desde \ Hacia | `draft` | `published` | `cancelled` | `finished` |
|---|:-:|:-:|:-:|:-:|
| `draft` | — | ✅ | ✅ | ❌ |
| `published` | ✅ | — | ✅ | ✅ |
| `cancelled` | ❌ | ❌ | — | ❌ |
| `finished` | ❌ | ❌ | ❌ | — |

## Tickets: inscripciones y cupos

Un **ticket** es la inscripción de un usuario a un evento. Toda la lógica (validaciones, cupos, duplicados, cancelación) vive en `src/services/tickets.service.js`; rutas y controllers solo reciben la request y devuelven la respuesta.

### Modelo Ticket

| Campo | Tipo | Descripción |
|---|---|---|
| `user` | ObjectId → `User` | Quién se inscribe (**referencia**, no se embebe) |
| `event` | ObjectId → `Event` | A qué evento (**referencia**) |
| `status` | String | `confirmed` · `pending` · `cancelled` |
| `quantity` | Number | Lugares reservados (entero > 0) |
| `reservationCode` | String | Código único, ej. `ENJ-8633QCGR` |
| `createdAt` | Date | Fecha de inscripción |
| `cancelledAt` | Date \| null | Fecha de cancelación (`null` si está activo) |

### Estados

| Estado | Ocupa cupo | Descripción |
|---|:-:|---|
| `confirmed` | ✅ | Inscripción confirmada. Es el estado con el que se crean los tickets y dispara el email. |
| `pending` | ✅ | Reservado para flujos futuros (ej. pago pendiente). Ocupa cupo igual que `confirmed`. |
| `cancelled` | ❌ | Inscripción cancelada. El documento **no se borra**; se registra `cancelledAt`. |

### Regla de cupos

```
cupos ocupados   = suma de quantity de los tickets del evento con status confirmed o pending
cupos disponibles = event.capacity − cupos ocupados
```

- Los tickets `cancelled` **no se cuentan**: al cancelar, el cupo se libera automáticamente.
- Una inscripción solo se acepta si `quantity ≤ cupos disponibles`.
- **Sin sobreventa ante pedidos simultáneos:** la inscripción corre en una transacción de MongoDB que primero "toma" el evento (incrementa un contador interno), así dos inscripciones concurrentes al mismo evento no pueden superar el cupo. Probado con 12 pedidos simultáneos a un evento de cupo 5 → 5 aceptados, 7 rechazados.
- **Una inscripción activa por usuario y evento:** se valida en el servicio y además hay un índice único parcial en MongoDB (`user + event` para tickets activos) como respaldo. Después de cancelar, el usuario puede volver a inscribirse.

### Flujo de inscripción (`POST /api/events/:eid/tickets`)

1. `authenticate` → sin sesión válida: **401**.
2. `quantity` válida (entero > 0; si no se envía vale `1`) → si no: **400**.
3. Dentro de una transacción:
   1. El evento existe y no es borrador → si no: **404** `Evento no encontrado`.
   2. No está `cancelled` → **409** `No se puede inscribir a un evento cancelado`.
   3. No está `finished` ni su fecha ya pasó → **409** `No se puede inscribir a un evento finalizado`.
   4. El usuario no tiene un ticket activo para el evento → **409** `Ya tenés una inscripción activa para este evento`.
   5. Hay cupos suficientes → **409** `El evento no tiene cupos disponibles` / `No hay cupos suficientes: quedan X y solicitaste Y`.
   6. Se crea el ticket `confirmed` con su `reservationCode`.
4. Se responde **201** con el ticket.
5. Se envía el **email de confirmación** con Nodemailer (en segundo plano: si el envío falla se registra en el log, pero la inscripción queda hecha).

### Cancelación (`PATCH /api/tickets/:tid/cancel`)

1. `authenticate` → **401**.
2. El ticket existe → **404** `Ticket no encontrado`.
3. Pertenece al usuario autenticado o es `admin` → **403** (ni siquiera el organizer del evento puede cancelar tickets ajenos).
4. No está cancelado → **409** `El ticket ya está cancelado`.
5. Se actualiza a `status: cancelled` con `cancelledAt`; el documento se conserva y el cupo queda libre.

### Email de confirmación (Nodemailer)

- Configuración SMTP en `src/config/mailer.js`, armado del mensaje en `src/services/mail.service.js`.
- Credenciales **solo por variables de entorno**: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`.
- Si falta alguna, el servidor arranca igual, avisa en consola (`Email deshabilitado: faltan ...`) y las inscripciones funcionan sin enviar correo.
- El email incluye evento, fecha, lugar, cantidad de lugares y código de reserva.

**Probar con Ethereal** (bandeja de prueba, no entrega correos reales):

1. Generá una cuenta: `node -e "require('nodemailer').createTestAccount().then(a => console.log(a))"`.
2. Copiá en `.env`: `MAIL_HOST=smtp.ethereal.email`, `MAIL_PORT=587`, `MAIL_USER` y `MAIL_PASS` con los valores generados, y `MAIL_FROM`.
3. Al inscribirte, la consola muestra `Email de confirmación enviado a ... (vista previa: https://ethereal.email/message/...)`; ese link abre el correo.

**Probar con Mailtrap:** en *Email Testing → Inboxes → SMTP Settings* copiá host (`sandbox.smtp.mailtrap.io`), puerto (`587` o `2525`), usuario y contraseña a las variables `MAIL_*`. Los correos aparecen en la bandeja de Mailtrap.

## Autenticación con Passport.js

Toda la autenticación pasa por estrategias de Passport definidas en **`src/config/passport.config.js`**. `app.js` solo registra las estrategias (`initializePassport()`) y ejecuta `passport.initialize()`. No se usan sesiones de servidor (`session: false`): el estado viaja en el JWT.

Las estrategias son adaptadores delgados: `register` y `login` delegan en `services/sessions.service.js` (`registerUser`, `validateCredentials`), que concentra la validación, bcrypt y la unicidad del email usando `UserRepository`. Si el servicio lanza un error, Passport lo pasa al middleware centralizado de errores.

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
| `register` | `passport-local` (`usernameField: email`) → `registerUser` | Valida campos obligatorios, formato de email y largo de contraseña; normaliza el email (trim + minúsculas); verifica unicidad; hashea con bcrypt; crea el usuario con rol por defecto `user` (el `role` del body se ignora). Devuelve el usuario **sin password**. | 400 `Faltan campos obligatorios` · 400 contraseña corta · 409 `El email ya está registrado` |
| `login` | `passport-local` (`usernameField: email`) → `validateCredentials` | Busca el usuario por email normalizado y compara la contraseña con bcrypt. Devuelve `{ id, email, role }`. **No genera el JWT**: eso lo hace el controller. | 400 `Faltan campos obligatorios` · 401 `Credenciales inválidas` (siempre el mismo mensaje) |
| `current` | `passport-jwt` | Extrae el token de la cookie `currentUser`, verifica firma (`JWT_SECRET`, HS256) y expiración, y deja `{ id, email, role }` (DTO `toSessionUser`) en `req.user`. | 401 `No autenticado` (sin cookie, token inválido, manipulado o expirado) |

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
| GET | `/api/events` | Listado con filtros (`status`, `category`, `location`, `dateFrom`, `dateTo`), paginación (`page`, `limit`) y orden (`sort`) | Pública |
| GET | `/api/events/:id` | Detalle de un evento (no borrador) | Pública |
| POST | `/api/events` | Crear evento | 🔒 `organizer`, `admin` |
| PUT | `/api/events/:id` | Modificar evento | 🔒 `organizer` dueño, `admin` |
| PATCH | `/api/events/:id/status` | Cambiar estado (publicar, cancelar, finalizar, borrador) | 🔒 `organizer` dueño, `admin` |
| POST | `/api/events/:eid/tickets` | Inscribirse a un evento | 🔒 Autenticado |
| GET | `/api/events/:eid/tickets` | Inscriptos del evento + resumen de cupos | 🔒 `organizer` dueño, `admin` |
| GET | `/api/tickets/my-tickets` | Mis tickets (con datos del evento) | 🔒 Autenticado |
| PATCH | `/api/tickets/:tid/cancel` | Cancelar ticket (libera cupo) | 🔒 Dueño del ticket, `admin` |
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

### GET /api/events — listado con filtros, paginación y orden

Pública. Por defecto devuelve eventos `published`, página 1, 10 por página, ordenados por fecha ascendente.

**Query params:**

| Parámetro | Valores | Default | Ejemplo |
|---|---|---|---|
| `status` | `published` · `cancelled` · `finished` (los `draft` no son públicos) | `published` | `status=published` |
| `category` | `clase` · `workshop` · `torneo` · `actividad` | — | `category=workshop` |
| `location` | Texto; coincidencia parcial sin distinguir mayúsculas | — | `location=palermo` |
| `dateFrom` | Fecha ISO 8601 (desde, inclusive) | — | `dateFrom=2027-06-01` |
| `dateTo` | Fecha ISO 8601 (hasta, inclusive; si es solo fecha incluye todo el día) | — | `dateTo=2027-06-30` |
| `page` | Entero ≥ 1 | `1` | `page=2` |
| `limit` | Entero entre 1 y 50 | `10` | `limit=5` |
| `sort` | `date` · `price` · `capacity` · `title` · `createdAt`; prefijo `-` = descendente | `date` | `sort=-price` |

```bash
curl "http://localhost:8080/api/events?status=published&category=workshop&page=2&limit=5"
```

**200**

```json
{
  "status": "success",
  "payload": {
    "data": [
      {
        "id": "6aaa9e0100611bd738f07ec1",
        "title": "Workshop de técnica de sentadilla",
        "description": "Trabajo de técnica y movilidad",
        "category": "workshop",
        "date": "2027-06-06T10:00:00.000Z",
        "location": "Sede Palermo",
        "capacity": 16,
        "price": 600,
        "status": "published",
        "organizer": "6aaa9c3b7b5e7176f002420c"
      }
    ],
    "page": 2,
    "limit": 5,
    "total": 7,
    "totalPages": 2
  }
}
```

**400** si algún parámetro es inválido, con un mensaje que indica cuál (ej. `limit debe ser un entero entre 1 y 50`, `dateFrom no puede ser posterior a dateTo`).

### GET /api/events/:id

Pública. Devuelve cualquier evento que no sea borrador (incluye cancelados y finalizados).

```bash
curl http://localhost:8080/api/events/6aaa9dcc00611bd738f07eb4
```

**200** → `{ "status": "success", "payload": { ...evento } }` · **400** `ID de evento inválido` · **404** `Evento no encontrado` (no existe o es `draft`)

### POST /api/events 🔒 organizer / admin

**Body (JSON):**

| Campo | Tipo | Reglas |
|---|---|---|
| `title` | string | Obligatorio |
| `description` | string | Obligatorio |
| `category` | string | Obligatorio: `clase`, `workshop`, `torneo` o `actividad` |
| `date` | string (ISO 8601) | Obligatorio, **no puede ser pasada** |
| `location` | string | Obligatorio |
| `capacity` | number | Obligatorio, entero **> 0** |
| `price` | number | Opcional, **≥ 0** (default `0`) |
| `status` | string | Opcional: `draft` o `published` (default `published`) |

`organizer` se asigna automáticamente con el usuario autenticado; si viene en el body se ignora.

```bash
curl -X POST http://localhost:8080/api/events -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"Workshop de movilidad","description":"Técnicas de movilidad articular","category":"workshop","date":"2027-04-15T18:00:00Z","location":"Sala Enjoy Centro","capacity":15,"price":2500}'
```

**201**

```json
{
  "status": "success",
  "payload": {
    "id": "6aaa9dcc00611bd738f07eb4",
    "title": "Workshop de movilidad",
    "description": "Técnicas de movilidad articular",
    "category": "workshop",
    "date": "2027-04-15T18:00:00.000Z",
    "location": "Sala Enjoy Centro",
    "capacity": 15,
    "price": 2500,
    "status": "published",
    "organizer": "6aaa9c3b7b5e7176f002420c"
  }
}
```

| Código | Caso | Mensaje |
|---|---|---|
| 400 | Falta un campo obligatorio | `Faltan campos obligatorios` |
| 400 | Fecha pasada | `La fecha del evento no puede ser pasada` |
| 400 | `capacity` ≤ 0 o no entero | `El cupo (capacity) debe ser un número entero mayor a 0` |
| 400 | `price` < 0 | `El precio (price) debe ser un número mayor o igual a 0` |
| 400 | `status` inicial distinto de `draft`/`published` | `Al crear, status debe ser uno de: draft, published` |
| 401 | Sin sesión | `No autenticado` |
| 403 | Rol `user` | `No tenés permisos para realizar esta acción` |

### PUT /api/events/:id 🔒 dueño del evento / admin

Actualiza uno o más de: `title`, `description`, `category`, `date`, `location`, `capacity`, `price` (con las mismas reglas que al crear). `status` y `organizer` **no** se modifican por esta ruta y se ignoran.

```bash
curl -X PUT http://localhost:8080/api/events/6aaa9dcc00611bd738f07eb4 -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"capacity":20,"price":3000}'
```

**200** → `{ "status": "success", "payload": { ...evento actualizado } }`

| Código | Caso | Mensaje |
|---|---|---|
| 400 | ID inválido, dato inválido o ningún campo editable | ej. `El cupo (capacity) debe ser un número entero mayor a 0` |
| 401 | Sin sesión | `No autenticado` |
| 403 | `user`, u `organizer` que no es dueño | `No tenés permisos para realizar esta acción` |
| 404 | No existe | `Evento no encontrado` |
| 409 | Evento cancelado | `Un evento cancelado no puede modificarse` |

### PATCH /api/events/:id/status 🔒 dueño del evento / admin

**Body (JSON):** `status` (`draft` · `published` · `cancelled` · `finished`).

```bash
curl -X PATCH http://localhost:8080/api/events/6aaa9dcc00611bd738f07eb4/status -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"status":"cancelled"}'
```

**200** → `{ "status": "success", "payload": { ..., "status": "cancelled" } }`

| Código | Caso | Mensaje |
|---|---|---|
| 400 | Estado inexistente | `status debe ser uno de: draft, published, cancelled, finished` |
| 401 / 403 / 404 | Igual que `PUT` | — |
| 409 | El evento está cancelado | `Un evento cancelado no puede modificarse` |
| 409 | Publicar un evento finalizado | `No se puede publicar un evento finalizado o cancelado` |
| 409 | Transición no permitida (ej. `draft` → `finished`) o mismo estado | `No se puede cambiar un evento de "draft" a "finished"` |

### POST /api/events/:eid/tickets 🔒 autenticado

Inscribe al usuario autenticado. **Body (JSON, opcional):** `quantity` (entero > 0, default `1`). `user`, `status` y cualquier otro campo del body se ignoran.

```bash
curl -X POST http://localhost:8080/api/events/6aaaae2208cead9304bd8c7f/tickets -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"quantity":2}'
```

**201**

```json
{
  "status": "success",
  "payload": {
    "id": "6aaaae2308cead9304bd8c84",
    "reservationCode": "ENJ-8633QCGR",
    "status": "confirmed",
    "quantity": 2,
    "createdAt": "2026-09-16T14:56:35.675Z",
    "cancelledAt": null,
    "event": "6aaaae2208cead9304bd8c7f",
    "user": "6aaaae2108cead9304bd8c7d"
  }
}
```

| Código | Caso | Mensaje |
|---|---|---|
| 400 | ID de evento inválido | `ID de evento inválido` |
| 400 | `quantity` no es un entero > 0 | `quantity debe ser un número entero mayor a 0` |
| 401 | Sin sesión | `No autenticado` |
| 404 | Evento inexistente o borrador | `Evento no encontrado` |
| 409 | Evento cancelado | `No se puede inscribir a un evento cancelado` |
| 409 | Evento finalizado o con fecha pasada | `No se puede inscribir a un evento finalizado` |
| 409 | Ya tiene un ticket activo | `Ya tenés una inscripción activa para este evento` |
| 409 | Sin cupo | `El evento no tiene cupos disponibles` |
| 409 | Cupo insuficiente | `No hay cupos suficientes: quedan 1 y solicitaste 2` |

### GET /api/tickets/my-tickets 🔒 autenticado

Tickets del usuario autenticado (activos y cancelados, más recientes primero), con datos del evento vía `populate`. No incluye información de otros usuarios.

```bash
curl http://localhost:8080/api/tickets/my-tickets -b cookies.txt
```

**200**

```json
{
  "status": "success",
  "payload": [
    {
      "id": "6aaaae2308cead9304bd8c84",
      "reservationCode": "ENJ-8633QCGR",
      "status": "confirmed",
      "quantity": 2,
      "createdAt": "2026-09-16T14:56:35.675Z",
      "cancelledAt": null,
      "event": {
        "id": "6aaaae2208cead9304bd8c7f",
        "title": "Funcional al aire libre",
        "date": "2027-08-10T19:00:00.000Z",
        "location": "Sede Palermo",
        "status": "published"
      }
    }
  ]
}
```

**401** sin sesión.

### GET /api/events/:eid/tickets 🔒 organizer del evento / admin

Inscriptos de un evento con el resumen de cupos.

```bash
curl http://localhost:8080/api/events/6aaaae2208cead9304bd8c7f/tickets -b cookies.txt
```

**200**

```json
{
  "status": "success",
  "payload": {
    "event": {
      "id": "6aaaae2208cead9304bd8c7f",
      "title": "Funcional al aire libre",
      "status": "published",
      "capacity": 3,
      "occupied": 3,
      "available": 0
    },
    "tickets": [
      {
        "id": "6aaaae2308cead9304bd8c84",
        "reservationCode": "ENJ-8633QCGR",
        "status": "confirmed",
        "quantity": 2,
        "createdAt": "2026-09-16T14:56:35.675Z",
        "cancelledAt": null,
        "user": { "id": "6aaaae2108cead9304bd8c7d", "first_name": "Ana", "last_name": "Gómez", "email": "ana@enjoy.com" }
      }
    ]
  }
}
```

| Código | Caso | Mensaje |
|---|---|---|
| 401 | Sin sesión | `No autenticado` |
| 403 | Rol `user`, u `organizer` de otro evento | `No tenés permisos para realizar esta acción` |
| 404 | Evento inexistente | `Evento no encontrado` |

### PATCH /api/tickets/:tid/cancel 🔒 dueño del ticket / admin

```bash
curl -X PATCH http://localhost:8080/api/tickets/6aaaae2308cead9304bd8c84/cancel -b cookies.txt
```

**200**

```json
{
  "status": "success",
  "payload": {
    "id": "6aaaae2308cead9304bd8c84",
    "reservationCode": "ENJ-8633QCGR",
    "status": "cancelled",
    "quantity": 2,
    "createdAt": "2026-09-16T14:56:35.675Z",
    "cancelledAt": "2026-09-16T14:56:38.849Z",
    "event": "6aaaae2208cead9304bd8c7f",
    "user": "6aaaae2108cead9304bd8c7d"
  }
}
```

| Código | Caso | Mensaje |
|---|---|---|
| 400 | ID inválido | `ID de ticket inválido` |
| 401 | Sin sesión | `No autenticado` |
| 403 | El ticket es de otro usuario (y no es admin) | `No tenés permisos para realizar esta acción` |
| 404 | No existe | `Ticket no encontrado` |
| 409 | Ya estaba cancelado | `El ticket ya está cancelado` |

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
| 17 | `PUT` / `PATCH status` de un evento ajeno como `organizer` | 403 |
| 18 | `PUT` de un evento ajeno como `admin` | 200 |
| 19 | `PATCH /api/users/:uid/role` como `organizer` | 403 |
| 20 | Crear evento con fecha pasada | 400 |
| 21 | Crear evento con `capacity: 0` o `price` negativo | 400 |
| 22 | `PUT` de evento propio como `organizer` | 200 |
| 23 | Cambiar estado o modificar un evento cancelado | 409 |
| 24 | Publicar un evento finalizado | 409 |
| 25 | `GET /api/events?status=published&category=workshop&page=2&limit=5` | 200 con `data`, `page`, `limit`, `total`, `totalPages` |
| 26 | `GET` / `PUT` de un evento inexistente | 404 |
| 27 | Inscripción exitosa | 201 + email de confirmación (vista previa en consola con Ethereal) |
| 28 | Inscripción sin sesión | 401 |
| 29 | Inscripción a evento inexistente | 404 |
| 30 | Inscripción a evento cancelado / finalizado | 409 |
| 31 | Inscripción sin cupo suficiente | 409 `No hay cupos suficientes: quedan X y solicitaste Y` |
| 32 | Inscripción duplicada con ticket activo | 409 |
| 33 | Cancelar ticket propio y volver a inscribirse (cupo liberado) | 200 → 201 |
| 34 | Cancelar ticket ajeno como `user` | 403 |
| 35 | `GET /api/events/:eid/tickets` como `user` / como organizer de otro evento | 403 / 403 |
| 36 | 12 inscripciones simultáneas a un evento con cupo 5 | 5 × 201 y 7 × 409 |
| 37 | Flujo completo: registro → login → crear evento → inscribirse → mis tickets → cancelar | 201 → 200 → 201 → 201 → 200 → 200 |
| 38 | `/current`, `my-tickets` y `events/:eid/tickets` (con populate) | Sin `password` en ninguna respuesta |
| 39 | Error de negocio (ej. sin cupo, evento cancelado) | 409, nunca 500 |
| 40 | Refactor de la Pre-entrega 8 | Las mismas 84 llamadas a la API devuelven respuestas idénticas antes y después |

## Avance

| Pre-entrega | Descripción | Estado |
|---|---|---|
| 1 | Refactor arquitectónico inicial (estructura por capas) | ✅ |
| 2 | Registro seguro de usuarios (validación, bcrypt, MongoDB) | ✅ |
| 3 | Autenticación con JWT y cookies (login, current, logout) | ✅ |
| 4 | Autenticación centralizada con Passport.js (estrategias register, login, current) | ✅ |
| 5 | Roles y autorización (matriz de permisos, 401 vs 403, propiedad de eventos) | ✅ |
| 6 | Entidad events: CRUD, reglas de negocio, filtros, paginación y ordenamiento | ✅ |
| 7 | Tickets: inscripciones, control de cupos, cancelaciones y email con Nodemailer | ✅ |
| 8 | Arquitectura en capas: DAO, Repository y DTO, manejo centralizado de errores | ✅ |
