import { UserDAO } from '../dao/user.dao.js';

class UserRepository {
  constructor(dao) {
    this.dao = dao;
  }

  create(data) {
    return this.dao.create(data);
  }

  findById(id) {
    return this.dao.findById(id);
  }

  findByEmail(email) {
    return this.dao.findOne({ email });
  }

  // Única consulta que trae el hash de la contraseña (select: false en el modelo): solo para validar el login.
  findByEmailWithPassword(email) {
    return this.dao.findOne({ email }, { select: '+password' });
  }

  findAll() {
    return this.dao.find({}, { sort: { createdAt: 1 } });
  }

  updateRole(id, role) {
    return this.dao.updateById(id, { role });
  }
}

export const userRepository = new UserRepository(new UserDAO());
