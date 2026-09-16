import { UserModel } from '../models/user.model.js';

export class UserDAO {
  create(data) {
    return UserModel.create(data);
  }

  findAll() {
    return UserModel.find().sort({ createdAt: 1 }).lean();
  }

  findById(id) {
    return UserModel.findById(id).lean();
  }

  findByEmail(email) {
    return UserModel.findOne({ email }).lean();
  }

  findByEmailWithPassword(email) {
    return UserModel.findOne({ email }).select('+password').lean();
  }

  updateRoleById(id, role) {
    return UserModel.findByIdAndUpdate(id, { role }, { returnDocument: 'after', runValidators: true }).lean();
  }
}
