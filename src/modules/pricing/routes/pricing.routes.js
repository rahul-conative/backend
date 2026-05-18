const express = require("express");
const { PricingController } = require("../controllers/pricing.controller");
const { CmsController } = require("../../cms/controllers/cms.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowActions } = require("../../../shared/middleware/access");
const { ACTIONS } = require("../../../shared/constants/actions");
const { checkInput } = require("../../../shared/middleware/check-input");
const { createCouponSchema, updateCouponSchema, couponParamSchema } = require("../validation/pricing.validation");
const {
  createPageSchema,
  updatePageSchema,
  listPagesSchema,
  slugParam,
} = require("../../cms/validation/cms.validation");
const { catchErrors } = require("../../../shared/middleware/catch-errors");

const pricingRoutes = express.Router();
const pricingController = new PricingController();
const cmsController = new CmsController();
const PROMOTION_BANNER_PAGE_TYPE = "promotion-banner";

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
  checkInput(listPagesSchema),
  catchErrors(cmsController.listPages),
);
pricingRoutes.post(
  "/promotion-banners",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  forcePromotionBannerPageType,
  checkInput(createPageSchema),
  catchErrors(cmsController.createPage),
);
pricingRoutes.patch(
  "/promotion-banners/:slug",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  forcePromotionBannerPageType,
  checkInput(updatePageSchema),
  catchErrors(cmsController.updatePage),
);
pricingRoutes.delete(
  "/promotion-banners/:slug",
  authenticate,
  allowActions(ACTIONS.ORDER_MANAGE),
  checkInput(slugParam),
  catchErrors(cmsController.deletePage),
);

module.exports = { pricingRoutes };
