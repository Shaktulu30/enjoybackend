import { TicketModel } from '../models/ticket.model.js';
import { BaseDAO } from './base.dao.js';

export class TicketDAO extends BaseDAO {
  constructor() {
    super(TicketModel);
  }
}
