import { UserDAO } from '../dao/user.dao.js';

class UserRepository {
  constructor(dao) {
    this.dao = dao;
  }

  create(data) {
    return this.dao.create(data);
  }

  getAll() {
    return this.dao.findAll();
  }

  getById(id) {
    return this.dao.findById(id);
  }

  getByEmail(email) {
    return this.dao.findByEmail(email);
  }

  getByEmailWithPassword(email) {
    return this.dao.findByEmailWithPassword(email);
  }

  updateRole(id, role) {
    return this.dao.updateRoleById(id, role);
  }
}

export const userRepository = new UserRepository(new UserDAO());
