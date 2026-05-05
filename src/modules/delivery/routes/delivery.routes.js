"use strict";

const express = require("express");
const { DeliveryController } = require("../controllers/delivery.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowActions } = require("../../../shared/middleware/access");
const { ACTIONS } = require("../../../shared/constants/actions");
const { checkInput } = require("../../../shared/middleware/check-input");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const {
  serviceabilitySchema,
  orderDeliveryParamSchema,
  createEWayBillSchema,
  updateEWayBillStatusSchema,
} = require("../validation/delivery.validation");

const deliveryRoutes = express.Router();
const deliveryController = new DeliveryController();

deliveryRoutes.get(
  "/serviceability",
  checkInput(serviceabilitySchema),
  catchErrors(deliveryController.serviceability),
);

deliveryRoutes.get(
  "/orders/:orderId/eway-bill",
  authenticate,
  checkInput(orderDeliveryParamSchema),
  catchErrors(deliveryController.getEWayBill),
);

deliveryRoutes.post(
  "/orders/:orderId/eway-bill",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  checkInput(createEWayBillSchema),
  catchErrors(deliveryController.createEWayBill),
);

deliveryRoutes.patch(
  "/eway-bills/:ewayBillId/status",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  checkInput(updateEWayBillStatusSchema),
  catchErrors(deliveryController.updateEWayBillStatus),
);

module.exports = { deliveryRoutes };
