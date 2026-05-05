const express = require("express");
const { PricingController } = require("../controllers/pricing.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowActions } = require("../../../shared/middleware/access");
const { ACTIONS } = require("../../../shared/constants/actions");
const { checkInput } = require("../../../shared/middleware/check-input");
const { createCouponSchema, updateCouponSchema, couponParamSchema } = require("../validation/pricing.validation");
const { catchErrors } = require("../../../shared/middleware/catch-errors");

const pricingRoutes = express.Router();
const pricingController = new PricingController();

pricingRoutes.get(
  "/coupons",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  catchErrors(pricingController.listCoupons),
);
pricingRoutes.post(
  "/coupons",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  checkInput(createCouponSchema),
  catchErrors(pricingController.createCoupon),
);
pricingRoutes.get(
  "/coupons/:couponId",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  checkInput(couponParamSchema),
  catchErrors(pricingController.getCoupon),
);
pricingRoutes.patch(
  "/coupons/:couponId",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  checkInput(updateCouponSchema),
  catchErrors(pricingController.updateCoupon),
);
pricingRoutes.delete(
  "/coupons/:couponId",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  checkInput(couponParamSchema),
  catchErrors(pricingController.deleteCoupon),
);

module.exports = { pricingRoutes };
