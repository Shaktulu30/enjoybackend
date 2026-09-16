import * as eventsService from '../services/events.service.js';
import { sendSuccess } from '../utils/response.js';

export const getEvents = async (req, res, next) => {
  try {
    const events = await eventsService.getAllEvents();
    return sendSuccess(res, { payload: events });
  } catch (error) {
    return next(error);
  }
};
