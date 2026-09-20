// Perfil público de un usuario (registro, listado de admin, cambio de rol). Nunca incluye password.
export const toPublicUser = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role,
});

// Identidad que viaja en el JWT y queda en req.user.
// Acepta un documento de la base (_id) o el payload del token (id).
export const toSessionUser = (user) => ({
  id: (user.id ?? user._id).toString(),
  email: user.email,
  role: user.role,
});

// Perfil del usuario autenticado que devuelve GET /api/sessions/current.
// Se arma con el documento fresco de la base, así el rol refleja cambios posteriores al login.
export const toCurrentUser = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role,
});
