const { okResponse } = require("../../../shared/http/reply");
const { AnalyticsService } = require("../services/analytics.service");

class AnalyticsController {
  constructor({ analyticsService = new AnalyticsService() } = {}) {
    this.analyticsService = analyticsService;
  }

  track = async (req, res) => {
    const event = await this.analyticsService.track(req.body);
    res.status(201).json(okResponse(event));
  };

  list = async (req, res) => {
    const events = await this.analyticsService.listEvents();
    res.json(okResponse(events));
  };
}

module.exports = { AnalyticsController };
