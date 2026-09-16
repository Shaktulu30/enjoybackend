import { UserModel } from '../models/user.model.js';

export class UserDAO {
  create(data) {
    return UserModel.create(data);
  }

  findByEmail(email) {
    return UserModel.findOne({ email }).lean();
  }

  findByEmailWithPassword(email) {
    return UserModel.findOne({ email }).select('+password').lean();
  }
}
