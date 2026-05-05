const express = require("express");
const { WarrantyController } = require("../controllers/warranty.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowRoles } = require("../../../shared/middleware/access");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { checkInput } = require("../../../shared/middleware/check-input");
const { ROLES } = require("../../../shared/constants/roles");
const {
  registerWarrantySchema,
  warrantyIdSchema,
  orderIdSchema,
  customerIdSchema,
  claimWarrantySchema,
  updateClaimStatusSchema,
  productIdSchema,
} = require("../validation/warranty.validation");

const warrantyRoutes = express.Router();
const warrantyController = new WarrantyController();

// Public routes
warrantyRoutes.get(
  "/products/:productId/warranty",
  checkInput(productIdSchema),
  catchErrors(warrantyController.getProductWarranty),
);

// Authenticated routes
warrantyRoutes.use(authenticate);

warrantyRoutes.post(
  "/register",
  checkInput(registerWarrantySchema),
  catchErrors(warrantyController.registerWarranty),
);

warrantyRoutes.get(
  "/:warrantyId",
  checkInput(warrantyIdSchema),
  catchErrors(warrantyController.getWarranty),
);

warrantyRoutes.get(
  "/orders/:orderId",
  checkInput(orderIdSchema),
  catchErrors(warrantyController.getWarrantiesByOrder),
);

warrantyRoutes.get(
  "/customers/:customerId",
  checkInput(customerIdSchema),
  catchErrors(warrantyController.getWarrantiesByCustomer),
);

warrantyRoutes.post(
  "/:warrantyId/claims",
  checkInput(claimWarrantySchema),
  catchErrors(warrantyController.claimWarranty),
);

// Admin routes
warrantyRoutes.patch(
  "/:warrantyId/claims/:claimId/status",
  allowRoles(ROLES.ADMIN),
  checkInput(updateClaimStatusSchema),
  catchErrors(warrantyController.updateClaimStatus),
);

module.exports = { warrantyRoutes };