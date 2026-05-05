const { failResponse } = require("../http/reply");

function notFoundHandler(req, res) {
  res.status(404).json(failResponse("Route not found"));
}

module.exports = { notFoundHandler };
