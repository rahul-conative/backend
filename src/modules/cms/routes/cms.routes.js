const express = require("express");
const { CmsController } = require("../controllers/cms.controller");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { checkInput } = require("../../../shared/middleware/check-input");
const {
  slugParam,
  listPagesSchema,
} = require("../validation/cms.validation");

const cmsRoutes = express.Router();
const cmsController = new CmsController();

// Public routes — published pages only (customer storefront)
cmsRoutes.get("/", checkInput(listPagesSchema), catchErrors(cmsController.listPublishedPages));
cmsRoutes.get("/:slug", checkInput(slugParam), catchErrors(cmsController.getPublishedPage));

module.exports = { cmsRoutes };
