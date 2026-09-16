import { UserDAO } from '../dao/user.dao.js';

class UserRepository {
  constructor(dao) {
    this.dao = dao;
  }

  create(data) {
    return this.dao.create(data);
  }

  getByEmail(email) {
    return this.dao.findByEmail(email);
  }

  getByEmailWithPassword(email) {
    return this.dao.findByEmailWithPassword(email);
  }

  getById(id) {
    return this.dao.findById(id);
  }
}

export const userRepository = new UserRepository(new UserDAO());
