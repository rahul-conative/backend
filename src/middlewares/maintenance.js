// Assuming you have set MAINTENANCE as an environment variable
const { MAINTENANCE } = process.env;
const { apiHTTPResponse } = require('../utils/globalFunction');
const { DATA_NULL, HTTP_SERVICE_UNAVAILABLE, SERVICE_UNAVAILABLE, ERROR_TRUE } = require('../utils/constants');

// Middleware to check maintenance mode
function maintenance(req, res, next) {
    // Check if maintenance mode is enabled
    if (MAINTENANCE && MAINTENANCE.toLowerCase() === 'true') {
        return apiHTTPResponse(req, res, HTTP_SERVICE_UNAVAILABLE, 'Service temporarily unavailable due to maintenance.', DATA_NULL, SERVICE_UNAVAILABLE,ERROR_TRUE);
    }
    // Continue to the next middleware or route handler
    next();
}

module.exports = maintenance;
