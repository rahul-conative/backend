const { okResponse } = require("../../../shared/http/reply");
const { ShippingAdminService } = require("../services/shipping-admin.service");

class ShippingAdminController {
  constructor({ shippingAdminService = new ShippingAdminService() } = {}) {
    this.shippingAdminService = shippingAdminService;
  }

  sendList(res, result) {
    res.json(okResponse(result.items, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    }));
  }

  listPackages = async (req, res) => this.sendList(res, await this.shippingAdminService.listPackages(req.query));
  createPackage = async (req, res) => res.status(201).json(okResponse(await this.shippingAdminService.createPackage(req.body)));
  updatePackage = async (req, res) => res.json(okResponse(await this.shippingAdminService.updatePackage(req.params.packageId, req.body)));
  setPackageStatus = async (req, res) => res.json(okResponse(await this.shippingAdminService.setPackageStatus(req.body.ids || req.body._id, req.body.isDisable)));
  deletePackages = async (req, res) => res.json(okResponse(await this.shippingAdminService.deletePackages(req.body.ids || req.body._id || req.params.packageId)));

  listPickupAddresses = async (req, res) => this.sendList(res, await this.shippingAdminService.listPickupAddresses(req.query));
  createPickupAddress = async (req, res) => res.status(201).json(okResponse(await this.shippingAdminService.createPickupAddress(req.body)));
  updatePickupAddress = async (req, res) => res.json(okResponse(await this.shippingAdminService.updatePickupAddress(req.params.pickupAddressId, req.body)));
  setPickupAddressStatus = async (req, res) => res.json(okResponse(await this.shippingAdminService.setPickupAddressStatus(req.body.ids || req.body._id, req.body.isDisable)));
  deletePickupAddresses = async (req, res) => res.json(okResponse(await this.shippingAdminService.deletePickupAddresses(req.body.ids || req.body._id || req.params.pickupAddressId)));
}

module.exports = { ShippingAdminController };
