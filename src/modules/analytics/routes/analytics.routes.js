const express = require("express");
const { AnalyticsController } = require("../controllers/analytics.controller");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { checkInput } = require("../../../shared/middleware/check-input");
const { trackEventSchema } = require("../validation/analytics.validation");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowActions } = require("../../../shared/middleware/access");
const { ACTIONS } = require("../../../shared/constants/actions");

const analyticsRoutes = express.Router();
const analyticsController = new AnalyticsController();

analyticsRoutes.get(
  "/",
  authenticate,
  allowActions(ACTIONS.ANALYTICS_VIEW),
  catchErrors(analyticsController.list),
);
analyticsRoutes.post(
  "/events",
  authenticate,
  allowActions(ACTIONS.ANALYTICS_VIEW),
  checkInput(trackEventSchema),
  catchErrors(analyticsController.track),
);

module.exports = { analyticsRoutes };
