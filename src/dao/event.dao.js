import { EventModel } from '../models/event.model.js';
import { BaseDAO } from './base.dao.js';

export class EventDAO extends BaseDAO {
  constructor() {
    super(EventModel);
  }
}
