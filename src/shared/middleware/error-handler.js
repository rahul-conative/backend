const { failResponse } = require("../http/reply");

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  req.log?.error({ err: error }, "Unhandled request error");

  res.status(statusCode).json(failResponse(error.message || "Internal server error", error.details));
}

module.exports = { errorHandler };
