"use strict";

const { okResponse } = require("../../../shared/http/reply");
const { getCurrentUser } = require("../../../shared/auth/current-user");
const { DeliveryService } = require("../services/delivery.service");

class DeliveryController {
  constructor({ deliveryService = new DeliveryService() } = {}) {
    this.deliveryService = deliveryService;
  }

  serviceability = async (req, res) => {
    const result = await this.deliveryService.getServiceability(req.query.pincode);
    res.json(okResponse(result));
  };

  createEWayBill = async (req, res) => {
    const actor = getCurrentUser(req);
    const result = await this.deliveryService.createEWayBill(req.params.orderId, req.body, actor);
    res.status(201).json(okResponse(result));
  };

  getEWayBill = async (req, res) => {
    const actor = getCurrentUser(req);
    const result = await this.deliveryService.getEWayBill(req.params.orderId, actor);
    res.json(okResponse(result));
  };

  updateEWayBillStatus = async (req, res) => {
    const actor = getCurrentUser(req);
    const result = await this.deliveryService.updateEWayBillStatus(req.params.ewayBillId, req.body, actor);
    res.json(okResponse(result));
  };
}

module.exports = { DeliveryController };
