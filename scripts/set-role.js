// Asigna un rol a un usuario existente directamente en la base.
// Sirve para crear el primer admin, ya que el registro público siempre crea usuarios con rol "user".
// Uso: npm run set-role -- <email> <user|organizer|admin>
import { validateEnv } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ROLE_VALUES } from '../src/config/roles.js';
import { userRepository } from '../src/repositories/user.repository.js';
import { normalizeEmail } from '../src/utils/validators.js';

const [email, role] = process.argv.slice(2);

const run = async () => {
  if (!email || !ROLE_VALUES.includes(role)) {
    throw new Error(`Uso: npm run set-role -- <email> <${ROLE_VALUES.join('|')}>`);
  }
  validateEnv();
  await connectDB();

  const user = await userRepository.findByEmail(normalizeEmail(email));
  if (!user) throw new Error(`No existe un usuario con email ${email}`);

  await userRepository.updateRole(user._id, role);
  console.log(`Rol de ${user.email} actualizado a "${role}". Debe volver a iniciar sesión para que el token refleje el cambio.`);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
