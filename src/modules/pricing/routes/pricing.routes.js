const express = require("express");
const { PricingController } = require("../controllers/pricing.controller");
const { PlatformController } = require("../../platform/controllers/platform.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowActions } = require("../../../shared/middleware/access");
const { ACTIONS } = require("../../../shared/constants/actions");
const { checkInput } = require("../../../shared/middleware/check-input");
const { createCouponSchema, updateCouponSchema, couponParamSchema } = require("../validation/pricing.validation");
const {
  createContentPageSchema,
  updateContentPageSchema,
  listContentPagesSchema,
  contentPageSlugSchema,
} = require("../../platform/validation/platform.validation");
const { catchErrors } = require("../../../shared/middleware/catch-errors");

const pricingRoutes = express.Router();
const pricingController = new PricingController();
const platformController = new PlatformController();
const PROMOTION_BANNER_PAGE_TYPE = "promotion_banner";

function forcePromotionBannerPageType(req, res, next) {
  req.query.pageType = PROMOTION_BANNER_PAGE_TYPE;
  if (req.body && typeof req.body === "object") {
    req.body.pageType = PROMOTION_BANNER_PAGE_TYPE;
  }
  return next();
}

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

pricingRoutes.get(
  "/promotion-banners",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  forcePromotionBannerPageType,
  checkInput(listContentPagesSchema),
  catchErrors(platformController.listContentPages),
);
pricingRoutes.post(
  "/promotion-banners",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  forcePromotionBannerPageType,
  checkInput(createContentPageSchema),
  catchErrors(platformController.createContentPage),
);
pricingRoutes.patch(
  "/promotion-banners/:slug",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  forcePromotionBannerPageType,
  checkInput(updateContentPageSchema),
  catchErrors(platformController.updateContentPage),
);
pricingRoutes.delete(
  "/promotion-banners/:slug",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  checkInput(contentPageSlugSchema),
  catchErrors(platformController.deleteContentPage),
);

module.exports = { pricingRoutes };
