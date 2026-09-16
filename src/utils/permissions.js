// true si el usuario es dueño del recurso (ownerId) o si su rol está entre los que pueden actuar sobre cualquiera.
export const isOwnerOrPrivileged = (ownerId, user, privilegedRoles) =>
  ownerId?.toString() === user.id || privilegedRoles.includes(user.role);
