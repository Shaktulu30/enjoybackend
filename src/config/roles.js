export const ROLES = Object.freeze({
  USER: 'user',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

// Matriz de permisos: cada acción lista los roles que pueden ejecutarla.
// Las rutas usan estas claves, nunca los nombres de rol directamente.
export const PERMISSIONS = Object.freeze({
  EVENTS_CREATE: [ROLES.ORGANIZER, ROLES.ADMIN],
  EVENTS_UPDATE_OWN: [ROLES.ORGANIZER, ROLES.ADMIN],
  EVENTS_CANCEL_OWN: [ROLES.ORGANIZER, ROLES.ADMIN],
  EVENTS_MANAGE_ANY: [ROLES.ADMIN],
  USERS_READ_ALL: [ROLES.ADMIN],
  USERS_UPDATE_ROLE: [ROLES.ADMIN],
});
