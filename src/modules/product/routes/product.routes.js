const express = require("express");
const { ProductController } = require("../controllers/product.controller");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowActions } = require("../../../shared/middleware/access");
const { checkInput } = require("../../../shared/middleware/check-input");
const {
  createProductSchema,
  updateProductSchema,
  listProductSchema,
  searchProductSchema,
  reviewProductSchema,
  productParamSchema,
} = require("../validation/product.validation");
const { ACTIONS } = require("../../../shared/constants/actions");

const productRoutes = express.Router();
const productController = new ProductController();

productRoutes.get("/", checkInput(listProductSchema), catchErrors(productController.list));
productRoutes.get("/search", checkInput(searchProductSchema), catchErrors(productController.search));
productRoutes.get(
  "/seller/me",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(listProductSchema),
  catchErrors(productController.listMine),
);
productRoutes.patch(
  "/:productId/review",
  authenticate,
  allowActions(ACTIONS.CATALOG_REVIEW),
  checkInput(reviewProductSchema),
  catchErrors(productController.review),
);
productRoutes.get("/:productId", catchErrors(productController.getOne));
productRoutes.post(
  "/",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(createProductSchema),
  catchErrors(productController.create),
);
productRoutes.patch(
  "/:productId",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(updateProductSchema),
  catchErrors(productController.update),
);
productRoutes.delete(
  "/:productId",
  authenticate,
  allowActions(ACTIONS.CATALOG_MANAGE),
  checkInput(productParamSchema),
  catchErrors(productController.delete),
);

module.exports = { productRoutes };
