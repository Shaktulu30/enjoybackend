import { UserModel } from '../models/user.model.js';
import { BaseDAO } from './base.dao.js';

export class UserDAO extends BaseDAO {
  constructor() {
    super(UserModel);
  }
}
