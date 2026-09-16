import * as eventsService from '../services/events.service.js';
import { sendSuccess } from '../utils/response.js';

export const getEvents = async (req, res, next) => {
  try {
    const result = await eventsService.listEvents(req.query);
    return sendSuccess(res, { payload: result });
  } catch (error) {
    return next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventsService.getPublicEventById(req.params.id);
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

export const changeEventStatus = async (req, res, next) => {
  try {
    const event = await eventsService.changeEventStatus(req.resource, req.body?.status);
    return sendSuccess(res, { payload: event });
  } catch (error) {
    return next(error);
  }
};
