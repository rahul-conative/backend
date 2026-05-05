const express = require("express");
const { TaxController } = require("../controllers/tax.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowRoles } = require("../../../shared/middleware/access");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { checkInput } = require("../../../shared/middleware/check-input");
const { ROLES } = require("../../../shared/constants/roles");
const { createOrderInvoiceSchema, taxReportSchema } = require("../validation/tax.validation");

const taxRoutes = express.Router();
const taxController = new TaxController();

taxRoutes.post(
  "/orders/:orderId/invoice",
  authenticate,
  allowRoles(ROLES.ADMIN),
  checkInput(createOrderInvoiceSchema),
  catchErrors(taxController.createOrderInvoice),
);

taxRoutes.get(
  "/reports",
  authenticate,
  allowRoles(ROLES.ADMIN),
  checkInput(taxReportSchema),
  catchErrors(taxController.getReport),
);

module.exports = { taxRoutes };

