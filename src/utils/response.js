export const sendSuccess = (res, { payload, message, statusCode = 200 } = {}) => {
  const body = { status: 'success' };
  if (payload !== undefined) body.payload = payload;
  if (message !== undefined) body.message = message;
  return res.status(statusCode).json(body);
};

export const sendError = (res, message, statusCode = 500) =>
  res.status(statusCode).json({ status: 'error', message });
