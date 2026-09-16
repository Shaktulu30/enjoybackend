import * as eventsService from '../services/events.service.js';
import { sendSuccess } from '../utils/response.js';

export const getEvents = async (req, res, next) => {
  try {
    const events = await eventsService.getPublishedEvents();
    return sendSuccess(res, { payload: events });
  } catch (error) {
    return next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventsService.getPublishedEventById(req.params.eid);
    return sendSuccess(res, { payload: event });
  } catch (error) {
    return next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await eventsService.createEvent(req.body, req.user.id);
    return sendSuccess(res, { payload: event, statusCode: 201 });
  } catch (error) {
    return next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventsService.updateEvent(req.resource, req.body);
    return sendSuccess(res, { payload: event });
  } catch (error) {
    return next(error);
  }
};

export const cancelEvent = async (req, res, next) => {
  try {
    const event = await eventsService.cancelEvent(req.resource);
    return sendSuccess(res, { payload: event });
  } catch (error) {
    return next(error);
  }
};
