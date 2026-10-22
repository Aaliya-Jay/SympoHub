export function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;
  const status = error.statusCode || error.status || (error.name === 'ValidationError' ? 400 : 500);
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again.'
    : error.message || 'Unexpected server error.';
  if (status >= 500) console.error(error);
  res.status(status).json({ message });
}
