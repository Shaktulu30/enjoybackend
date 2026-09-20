// Verificación de punta a punta de la entrega final.
// Levanta un MongoDB en memoria (replica set, necesario para las transacciones de inscripción),
// crea una cuenta SMTP de prueba en Ethereal y recorre los 10 casos del checklist contra la API real.
// No toca la base ni el .env del proyecto.
// Uso: npm run e2e
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const PORT = 8123;
const BASE_URL = `http://localhost:${PORT}/api`;

const results = [];
const sent = [];

const log = (n, title, detail) => {
  results.push({ n, title, detail });
  console.log(`✅ ${String(n).padStart(2)} · ${title}\n      ${detail}`);
};

// ---------- Cliente HTTP con manejo de cookie por usuario ----------

const makeClient = () => {
  let cookie = null;
  return {
    get cookie() {
      return cookie;
    },
    clear: () => {
      cookie = null;
    },
    async request(method, path, body) {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const [pair] = setCookie.split(';');
        cookie = pair.endsWith('=') ? null : pair;
      }
      return { status: res.status, body: await res.json().catch(() => null), setCookie };
    },
  };
};

const client = () => {
  const c = makeClient();
  return {
    raw: c,
    get: (path) => c.request('GET', path),
    post: (path, body) => c.request('POST', path, body),
    put: (path, body) => c.request('PUT', path, body),
    patch: (path, body) => c.request('PATCH', path, body),
  };
};

// ---------- Helpers ----------

const hasPassword = (value) => JSON.stringify(value ?? null).toLowerCase().includes('password');

const inDays = (days) => new Date(Date.now() + days * 86400000).toISOString();

const register = async (api, { first_name, last_name, email, password = 'Secreta123' }) => {
  const res = await api.post('/sessions/register', { first_name, last_name, email, password });
  assert.equal(res.status, 201, `registro de ${email}: ${JSON.stringify(res.body)}`);
  return res;
};

const login = async (api, email, password = 'Secreta123') => {
  const res = await api.post('/sessions/login', { email, password });
  assert.equal(res.status, 200, `login de ${email}: ${JSON.stringify(res.body)}`);
  return res;
};

// ---------- Escenario ----------

const run = async () => {
  // --- Infraestructura de prueba ---
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  const mail = await nodemailer.createTestAccount();

  process.env.MONGO_URL = replSet.getUri('enjoy-e2e');
  process.env.JWT_SECRET = 'e2e-secret-no-usar-en-produccion';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV = 'test';
  process.env.PORT = String(PORT);
  process.env.MAIL_HOST = mail.smtp.host;
  process.env.MAIL_PORT = String(mail.smtp.port);
  process.env.MAIL_USER = mail.user;
  process.env.MAIL_PASS = mail.pass;
  process.env.MAIL_FROM = 'Enjoy Gym <no-reply@enjoy.com>';

  const { connectDB, disconnectDB } = await import('../src/config/db.js');
  const { default: app } = await import('../src/app.js');
  const { userRepository } = await import('../src/repositories/user.repository.js');
  const { ROLES } = await import('../src/config/roles.js');

  // Interceptamos el envío real para poder afirmar que salió el correo.
  const { transporter } = await import('../src/config/mailer.js');
  const realSendMail = transporter.sendMail.bind(transporter);
  transporter.sendMail = async (message) => {
    const info = await realSendMail(message);
    sent.push({ to: message.to, subject: message.subject, preview: nodemailer.getTestMessageUrl(info) });
    return info;
  };

  await connectDB();
  const server = app.listen(PORT);
  await new Promise((resolve) => server.once('listening', resolve));
  console.log(`\nAPI de prueba en http://localhost:${PORT} · Mongo en memoria · SMTP Ethereal (${mail.user})\n`);

  try {
    const user = client();
    const organizer = client();
    const otherOrganizer = client();
    const admin = client();

    // ===== 1. Registro → login → /current → logout → /current 401 =====
    const registered = await register(user, {
      first_name: 'Lucia',
      last_name: 'Pereyra',
      email: 'lucia@enjoy.com',
    });
    const loginRes = await login(user, 'lucia@enjoy.com');
    assert.match(loginRes.setCookie, /currentUser=/);
    assert.match(loginRes.setCookie, /HttpOnly/i);

    const currentOk = await user.get('/sessions/current');
    assert.equal(currentOk.status, 200);
    assert.equal(currentOk.body.payload.email, 'lucia@enjoy.com');
    assert.equal(currentOk.body.payload.role, ROLES.USER);
    assert.equal(currentOk.body.payload.first_name, 'Lucia');

    const logoutRes = await user.post('/sessions/logout');
    assert.equal(logoutRes.status, 200);
    const currentAfterLogout = await user.get('/sessions/current');
    assert.equal(currentAfterLogout.status, 401);
    assert.equal(currentAfterLogout.body.message, 'No autenticado');

    log(
      1,
      'Registro → login → /current → logout → /current',
      `201 → 200 (cookie HttpOnly) → 200 ${JSON.stringify(currentOk.body.payload)} → 200 → 401 "No autenticado"`,
    );

    await login(user, 'lucia@enjoy.com'); // volvemos a entrar para el resto del flujo

    // ===== 2. user intenta crear evento → 403 =====
    const forbiddenCreate = await user.post('/events', {
      title: 'Clase pirata',
      description: 'No debería poder',
      category: 'clase',
      date: inDays(10),
      location: 'Sede Centro',
      capacity: 10,
    });
    assert.equal(forbiddenCreate.status, 403);
    log(2, 'user intenta crear evento', `403 "${forbiddenCreate.body.message}"`);

    // ===== Preparamos organizer, otro organizer y admin =====
    for (const [api, data, role] of [
      [organizer, { first_name: 'Martin', last_name: 'Diaz', email: 'martin@enjoy.com' }, ROLES.ORGANIZER],
      [otherOrganizer, { first_name: 'Sofia', last_name: 'Luna', email: 'sofia@enjoy.com' }, ROLES.ORGANIZER],
      [admin, { first_name: 'Ana', last_name: 'Gomez', email: 'ana@enjoy.com' }, ROLES.ADMIN],
    ]) {
      await register(api, data);
      const doc = await userRepository.findByEmail(data.email);
      await userRepository.updateRole(doc._id, role);
      await login(api, data.email);
    }

    // ===== 3. organizer crea evento → user se inscribe → email → cupo descontado =====
    const created = await organizer.post('/events', {
      title: 'Funcional al aire libre',
      description: 'Entrenamiento funcional en el parque',
      category: 'clase',
      date: inDays(15),
      location: 'Parque Sarmiento',
      capacity: 2,
      price: 4500,
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const eventId = created.body.payload.id;
    assert.equal(created.body.payload.status, 'published');

    const enrolled = await user.post(`/events/${eventId}/tickets`);
    assert.equal(enrolled.status, 201, JSON.stringify(enrolled.body));
    const ticketId = enrolled.body.payload.id;
    assert.equal(enrolled.body.payload.status, 'confirmed');
    assert.equal(enrolled.body.payload.quantity, 1);

    // Esperamos el email, que se envía fuera de la transacción.
    for (let i = 0; i < 50 && sent.length === 0; i += 1) await new Promise((r) => setTimeout(r, 100));
    assert.equal(sent.length, 1, 'no se envió el email de confirmación');
    assert.equal(sent[0].to, 'lucia@enjoy.com');

    const seatsAfter = await organizer.get(`/events/${eventId}/tickets`);
    assert.equal(seatsAfter.status, 200);
    assert.equal(seatsAfter.body.payload.event.occupied, 1);
    assert.equal(seatsAfter.body.payload.event.available, 1);

    log(
      3,
      'organizer crea evento → user se inscribe → email → cupo',
      `201 evento (capacity 2) → 201 ticket ${enrolled.body.payload.reservationCode} → email "${sent[0].subject}" a ${sent[0].to} → ocupados 1 / disponibles 1\n      Vista previa: ${sent[0].preview}`,
    );

    // ===== 4. Inscripción duplicada → 409 =====
    const duplicated = await user.post(`/events/${eventId}/tickets`);
    assert.equal(duplicated.status, 409);
    log(4, 'user se inscribe de nuevo al mismo evento', `409 "${duplicated.body.message}"`);

    // ===== 5. Evento sin cupo → error claro =====
    const second = client();
    await register(second, { first_name: 'Diego', last_name: 'Rossi', email: 'diego@enjoy.com' });
    await login(second, 'diego@enjoy.com');
    const secondEnroll = await second.post(`/events/${eventId}/tickets`, { quantity: 1 });
    assert.equal(secondEnroll.status, 201); // ocupa el último lugar

    const third = client();
    await register(third, { first_name: 'Carla', last_name: 'Ruiz', email: 'carla@enjoy.com' });
    await login(third, 'carla@enjoy.com');
    const noSeats = await third.post(`/events/${eventId}/tickets`);
    assert.equal(noSeats.status, 409);

    const tooMany = client();
    await register(tooMany, { first_name: 'Pablo', last_name: 'Vera', email: 'pablo@enjoy.com' });
    await login(tooMany, 'pablo@enjoy.com');
    const bigEvent = await organizer.post('/events', {
      title: 'Torneo de crossfit',
      description: 'Torneo interno por equipos',
      category: 'torneo',
      date: inDays(20),
      location: 'Sede Norte',
      capacity: 3,
    });
    const partial = await tooMany.post(`/events/${bigEvent.body.payload.id}/tickets`, { quantity: 5 });
    assert.equal(partial.status, 409);

    log(
      5,
      'Inscripción a evento sin cupo',
      `409 "${noSeats.body.message}" · pidiendo más lugares de los que quedan: 409 "${partial.body.message}"`,
    );

    // ===== 6. Cancelar ticket → cupo liberado → nueva inscripción funciona =====
    const cancelled = await user.patch(`/tickets/${ticketId}/cancel`);
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.payload.status, 'cancelled');
    assert.ok(cancelled.body.payload.cancelledAt);

    const afterCancel = await organizer.get(`/events/${eventId}/tickets`);
    assert.equal(afterCancel.body.payload.event.occupied, 1, 'el ticket cancelado sigue ocupando cupo');

    const reEnroll = await third.post(`/events/${eventId}/tickets`);
    assert.equal(reEnroll.status, 201, JSON.stringify(reEnroll.body));

    const myTickets = await user.get('/tickets/my-tickets');
    assert.equal(myTickets.status, 200);
    assert.equal(myTickets.body.payload[0].status, 'cancelled');
    assert.equal(myTickets.body.payload[0].event.title, 'Funcional al aire libre');

    log(
      6,
      'Cancelar ticket → cupo liberado → nueva inscripción',
      `200 status "cancelled" (no se borra) → ocupados 2→1 → nueva inscripción 201 ${reEnroll.body.payload.reservationCode} · my-tickets 200 con populate del evento`,
    );

    // ===== 7. organizer modifica evento ajeno → 403 =====
    const foreignUpdate = await otherOrganizer.put(`/events/${eventId}`, { title: 'Secuestrado' });
    assert.equal(foreignUpdate.status, 403);
    const foreignStatus = await otherOrganizer.patch(`/events/${eventId}/status`, { status: 'cancelled' });
    assert.equal(foreignStatus.status, 403);
    log(
      7,
      'organizer intenta modificar evento ajeno',
      `PUT 403 "${foreignUpdate.body.message}" · PATCH /status 403`,
    );

    // ===== 8. admin modifica evento de otro organizador → éxito =====
    const adminUpdate = await admin.put(`/events/${eventId}`, { title: 'Funcional al aire libre (edición admin)' });
    assert.equal(adminUpdate.status, 200, JSON.stringify(adminUpdate.body));
    assert.equal(adminUpdate.body.payload.title, 'Funcional al aire libre (edición admin)');
    log(8, 'admin modifica evento de otro organizador', `200 title → "${adminUpdate.body.payload.title}"`);

    // ===== 9. Ninguna respuesta expone password =====
    const adminUsers = await admin.get('/users');
    const attendees = await organizer.get(`/events/${eventId}/tickets`);
    const checked = {
      'register': registered.body,
      'sessions/current': currentOk.body,
      'events/:id': (await user.get(`/events/${eventId}`)).body,
      'tickets (alta)': enrolled.body,
      'my-tickets (populate event)': myTickets.body,
      'events/:eid/tickets (populate user)': attendees.body,
      'users (admin)': adminUsers.body,
    };
    for (const [name, body] of Object.entries(checked)) {
      assert.ok(!hasPassword(body), `la respuesta de ${name} contiene password`);
    }
    assert.ok(attendees.body.payload.tickets[0].user.email, 'el populate de user debería traer datos básicos');
    log(
      9,
      'Ninguna respuesta contiene password',
      `Verificadas ${Object.keys(checked).length} respuestas (incluidos los dos populate): ${Object.keys(checked).join(', ')}`,
    );

    // ===== 10. Paginación =====
    for (let i = 0; i < 12; i += 1) {
      const res = await organizer.post('/events', {
        title: `Workshop de movilidad ${i + 1}`,
        description: 'Serie para probar la paginación',
        category: 'workshop',
        date: inDays(30 + i),
        location: 'Sede Centro',
        capacity: 20,
        price: 0,
      });
      assert.equal(res.status, 201, JSON.stringify(res.body));
    }
    const page2 = await user.get('/events?status=published&page=2&limit=5');
    assert.equal(page2.status, 200);
    const { data, page, limit, total, totalPages } = page2.body.payload;
    assert.deepEqual(Object.keys(page2.body.payload), ['data', 'page', 'limit', 'total', 'totalPages']);
    assert.equal(page, 2);
    assert.equal(limit, 5);
    assert.equal(data.length, 5);
    assert.equal(totalPages, Math.ceil(total / limit));
    log(
      10,
      'GET /api/events?status=published&page=2&limit=5',
      `200 { data: ${data.length} eventos, page: ${page}, limit: ${limit}, total: ${total}, totalPages: ${totalPages} }`,
    );

    // ===== Extras: códigos de error del checklist =====
    const anon = client();
    const noSession = await anon.post(`/events/${eventId}/tickets`);
    assert.equal(noSession.status, 401);
    const badId = await user.get('/events/no-es-un-id');
    assert.equal(badId.status, 400);
    const notFoundEvent = await user.get('/events/000000000000000000000000');
    assert.equal(notFoundEvent.status, 404);
    const pastDate = await organizer.post('/events', {
      title: 'Clase de ayer',
      description: 'Fecha pasada',
      category: 'clase',
      date: inDays(-1),
      location: 'Sede Centro',
      capacity: 5,
    });
    assert.equal(pastDate.status, 400);
    const foreignCancel = await second.patch(`/tickets/${reEnroll.body.payload.id}/cancel`);
    assert.equal(foreignCancel.status, 403);
    const duplicateEmail = await anon.post('/sessions/register', {
      first_name: 'Otra',
      last_name: 'Lucia',
      email: 'lucia@enjoy.com',
      password: 'Secreta123',
    });
    assert.equal(duplicateEmail.status, 409);
    const notFoundRoute = await anon.get('/no-existe');
    assert.equal(notFoundRoute.status, 404);
    log(
      11,
      'Extra · códigos de error diferenciados',
      'sin sesión 401 · id inválido 400 · fecha pasada 400 · ticket ajeno 403 · evento inexistente 404 · ruta inexistente 404 · email duplicado 409 (ningún 500)',
    );

    console.log(`\n🎉 ${results.length}/${results.length} casos OK\n`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
    await replSet.stop();
  }
};

run().catch((error) => {
  console.error(`\n❌ Falló la verificación: ${error.message}\n`);
  process.exitCode = 1;
});
