const express = require("express");
const { PlatformController } = require("../controllers/platform.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowActions } = require("../../../shared/middleware/access");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { checkInput } = require("../../../shared/middleware/check-input");
const { ACTIONS } = require("../../../shared/constants/actions");
const {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesSchema,
  categoryKeySchema,
  createProductFamilySchema,
  updateProductFamilySchema,
  listProductFamiliesSchema,
  productFamilyCodeSchema,
  createProductVariantSchema,
  updateProductVariantSchema,
  listProductVariantsSchema,
  productVariantIdSchema,
  createHsnCodeSchema,
  updateHsnCodeSchema,
  listHsnCodesSchema,
  hsnCodeParamSchema,
  createGeographySchema,
  updateGeographySchema,
  listGeographiesSchema,
  geographyParamSchema,
  createContentPageSchema,
  updateContentPageSchema,
  listContentPagesSchema,
  contentPageSlugSchema,
} = require("../validation/platform.validation");

const platformRoutes = express.Router();
const platformController = new PlatformController();

platformRoutes.get("/categories", checkInput(listCategoriesSchema), catchErrors(platformController.listCategories));
platformRoutes.get("/categories/:categoryKey", checkInput(categoryKeySchema), catchErrors(platformController.getCategory));
platformRoutes.get(
  "/categories/:categoryKey/attributes",
  checkInput(categoryKeySchema),
  catchErrors(platformController.getCategoryAttributes),
);
platformRoutes.post(
  "/categories",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(createCategorySchema),
  catchErrors(platformController.createCategory),
);
platformRoutes.patch(
  "/categories/:categoryKey",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(updateCategorySchema),
  catchErrors(platformController.updateCategory),
);
platformRoutes.delete(
  "/categories/:categoryKey",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(categoryKeySchema),
  catchErrors(platformController.deleteCategory),
);

platformRoutes.get("/families", checkInput(listProductFamiliesSchema), catchErrors(platformController.listProductFamilies));
platformRoutes.get("/families/:familyCode", checkInput(productFamilyCodeSchema), catchErrors(platformController.getProductFamily));
platformRoutes.post(
  "/families",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(createProductFamilySchema),
  catchErrors(platformController.createProductFamily),
);
platformRoutes.patch(
  "/families/:familyCode",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(updateProductFamilySchema),
  catchErrors(platformController.updateProductFamily),
);
platformRoutes.delete(
  "/families/:familyCode",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(productFamilyCodeSchema),
  catchErrors(platformController.deleteProductFamily),
);

platformRoutes.get("/variants", checkInput(listProductVariantsSchema), catchErrors(platformController.listProductVariants));
platformRoutes.get("/variants/:variantId", checkInput(productVariantIdSchema), catchErrors(platformController.getProductVariant));
platformRoutes.post(
  "/variants",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(createProductVariantSchema),
  catchErrors(platformController.createProductVariant),
);
platformRoutes.patch(
  "/variants/:variantId",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(updateProductVariantSchema),
  catchErrors(platformController.updateProductVariant),
);
platformRoutes.delete(
  "/variants/:variantId",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(productVariantIdSchema),
  catchErrors(platformController.deleteProductVariant),
);

platformRoutes.get("/hsn-codes", checkInput(listHsnCodesSchema), catchErrors(platformController.listHsnCodes));
platformRoutes.get("/hsn-codes/:hsnCode", checkInput(hsnCodeParamSchema), catchErrors(platformController.getHsnCode));
platformRoutes.post(
  "/hsn-codes",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(createHsnCodeSchema),
  catchErrors(platformController.createHsnCode),
);
platformRoutes.patch(
  "/hsn-codes/:hsnCode",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(updateHsnCodeSchema),
  catchErrors(platformController.updateHsnCode),
);
platformRoutes.delete(
  "/hsn-codes/:hsnCode",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(hsnCodeParamSchema),
  catchErrors(platformController.deleteHsnCode),
);

platformRoutes.get("/geographies", checkInput(listGeographiesSchema), catchErrors(platformController.listGeographies));
platformRoutes.get("/geographies/:countryCode", checkInput(geographyParamSchema), catchErrors(platformController.getGeography));
platformRoutes.post(
  "/geographies",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(createGeographySchema),
  catchErrors(platformController.createGeography),
);
platformRoutes.patch(
  "/geographies/:countryCode",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(updateGeographySchema),
  catchErrors(platformController.updateGeography),
);
platformRoutes.delete(
  "/geographies/:countryCode",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(geographyParamSchema),
  catchErrors(platformController.deleteGeography),
);

platformRoutes.get("/cms", checkInput(listContentPagesSchema), catchErrors(platformController.listContentPages));
platformRoutes.get("/cms/:slug", checkInput(contentPageSlugSchema), catchErrors(platformController.getContentPage));
platformRoutes.post(
  "/cms",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(createContentPageSchema),
  catchErrors(platformController.createContentPage),
);
platformRoutes.patch(
  "/cms/:slug",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(updateContentPageSchema),
  catchErrors(platformController.updateContentPage),
);
platformRoutes.delete(
  "/cms/:slug",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(contentPageSlugSchema),
  catchErrors(platformController.deleteContentPage),
);

module.exports = { platformRoutes };
