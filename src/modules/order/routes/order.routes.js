const express = require("express");
const { OrderController } = require("../controllers/order.controller");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowActions } = require("../../../shared/middleware/access");
const { ACTIONS } = require("../../../shared/constants/actions");
const { checkInput } = require("../../../shared/middleware/check-input");
const {
  createOrderSchema,
  updateOrderStatusSchema,
  orderParamSchema,
  cancelOrderSchema,
} = require("../validation/order.validation");

const orderRoutes = express.Router();
const orderController = new OrderController();

orderRoutes.get("/me", authenticate, catchErrors(orderController.listMine));
orderRoutes.get(
  "/seller/me",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  catchErrors(orderController.listSellerOrders),
);
orderRoutes.post("/", authenticate, checkInput(createOrderSchema), catchErrors(orderController.create));
orderRoutes.get(
  "/:orderId",
  authenticate,
  checkInput(orderParamSchema),
  catchErrors(orderController.getOne),
);
orderRoutes.post(
  "/:orderId/cancel",
  authenticate,
  checkInput(cancelOrderSchema),
  catchErrors(orderController.cancel),
);
orderRoutes.patch(
  "/:orderId/status",
  authenticate,
  checkInput(updateOrderStatusSchema),
  catchErrors(orderController.updateStatus),
);

module.exports = { orderRoutes };
