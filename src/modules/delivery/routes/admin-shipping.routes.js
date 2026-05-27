const express = require("express");
const { ShippingAdminController } = require("../controllers/shipping-admin.controller");
const { catchErrors } = require("../../../shared/middleware/catch-errors");
const { checkInput } = require("../../../shared/middleware/check-input");
const {
  listSchema,
  statusSchema,
  deleteSchema,
  createShippingPackageSchema,
  updateShippingPackageSchema,
  shippingPackageParamSchema,
  createPickupAddressSchema,
  updatePickupAddressSchema,
  pickupAddressParamSchema,
} = require("../validation/shipping-admin.validation");

const adminShippingRoutes = express.Router();
const shippingAdminController = new ShippingAdminController();

adminShippingRoutes.get(
  "/packages",
  checkInput(listSchema),
  catchErrors(shippingAdminController.listPackages),
);
adminShippingRoutes.post(
  "/packages",
  checkInput(createShippingPackageSchema),
  catchErrors(shippingAdminController.createPackage),
);
adminShippingRoutes.patch(
  "/packages/status",
  checkInput(statusSchema),
  catchErrors(shippingAdminController.setPackageStatus),
);
adminShippingRoutes.patch(
  "/packages/:packageId",
  checkInput(updateShippingPackageSchema),
  catchErrors(shippingAdminController.updatePackage),
);
adminShippingRoutes.delete(
  "/packages",
  checkInput(deleteSchema),
  catchErrors(shippingAdminController.deletePackages),
);
adminShippingRoutes.delete(
  "/packages/:packageId",
  checkInput(shippingPackageParamSchema),
  catchErrors(shippingAdminController.deletePackages),
);

adminShippingRoutes.get(
  "/pickup-addresses",
  checkInput(listSchema),
  catchErrors(shippingAdminController.listPickupAddresses),
);
adminShippingRoutes.post(
  "/pickup-addresses",
  checkInput(createPickupAddressSchema),
  catchErrors(shippingAdminController.createPickupAddress),
);
adminShippingRoutes.patch(
  "/pickup-addresses/status",
  checkInput(statusSchema),
  catchErrors(shippingAdminController.setPickupAddressStatus),
);
adminShippingRoutes.patch(
  "/pickup-addresses/:pickupAddressId",
  checkInput(updatePickupAddressSchema),
  catchErrors(shippingAdminController.updatePickupAddress),
);
adminShippingRoutes.delete(
  "/pickup-addresses",
  checkInput(deleteSchema),
  catchErrors(shippingAdminController.deletePickupAddresses),
);
adminShippingRoutes.delete(
  "/pickup-addresses/:pickupAddressId",
  checkInput(pickupAddressParamSchema),
  catchErrors(shippingAdminController.deletePickupAddresses),
);

module.exports = { adminShippingRoutes };
