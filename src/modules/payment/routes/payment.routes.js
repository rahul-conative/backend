const express = require("express");
const { PaymentController } = require("../controllers/payment.controller");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { checkInput } = require("../../../shared/middleware/check-input");
const { createPaymentSchema, verifyPaymentSchema } = require("../validation/payment.validation");

const paymentRoutes = express.Router();
const paymentController = new PaymentController();

paymentRoutes.post(
  "/webhooks/razorpay",
  catchErrors(paymentController.webhook),
);
paymentRoutes.get("/me", authenticate, catchErrors(paymentController.listMine));
paymentRoutes.post(
  "/initiate",
  authenticate,
  checkInput(createPaymentSchema),
  catchErrors(paymentController.initiate),
);
paymentRoutes.post(
  "/verify",
  authenticate,
  checkInput(verifyPaymentSchema),
  catchErrors(paymentController.verify),
);

module.exports = { paymentRoutes };
