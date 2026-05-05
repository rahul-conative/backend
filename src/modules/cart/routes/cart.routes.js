const express = require("express");
const { CartController } = require("../controllers/cart.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { checkInput } = require("../../../shared/middleware/check-input");
const { upsertCartSchema } = require("../validation/cart.validation");

const cartRoutes = express.Router();
const cartController = new CartController();

cartRoutes.get("/me", authenticate, catchErrors(cartController.getMyCart));
cartRoutes.put(
  "/me",
  authenticate,
  checkInput(upsertCartSchema),
  catchErrors(cartController.upsertMyCart),
);

module.exports = { cartRoutes };
