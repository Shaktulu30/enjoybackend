import * as ticketsService from '../services/tickets.service.js';
import { sendSuccess } from '../utils/response.js';

export const createTicket = async (req, res, next) => {
  try {
    const ticket = await ticketsService.enroll(req.params.eid, req.user.id, req.body);
    return sendSuccess(res, { payload: ticket, statusCode: 201 });
  } catch (error) {
    return next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await ticketsService.getMyTickets(req.user.id);
    return sendSuccess(res, { payload: tickets });
  } catch (error) {
    return next(error);
  }
};

export const getEventTickets = async (req, res, next) => {
  try {
    const result = await ticketsService.getEventTickets(req.resource);
    return sendSuccess(res, { payload: result });
  } catch (error) {
    return next(error);
  }
};

export const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketsService.cancelTicket(req.resource);
    return sendSuccess(res, { payload: ticket });
  } catch (error) {
    return next(error);
  }
};
