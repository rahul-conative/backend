const { okResponse } = require("../../../shared/http/reply");
const { OrderService } = require("../services/order.service");
const { getCurrentUser } = require("../../../shared/auth/current-user");

class OrderController {
  constructor({ orderService = new OrderService() } = {}) {
    this.orderService = orderService;
  }

  create = async (req, res) => {
    const actor = getCurrentUser(req);
    const order = await this.orderService.createOrder(req.body, actor);
    res.status(201).json(okResponse(order));
  };

  listMine = async (req, res) => {
    const actor = getCurrentUser(req);
    const orders = await this.orderService.listMyOrders(actor);
    res.json(okResponse(orders));
  };

  listSellerOrders = async (req, res) => {
    const actor = getCurrentUser(req);
    const orders = await this.orderService.listSellerOrders(actor);
    res.json(okResponse(orders));
  };

  getOne = async (req, res) => {
    const actor = getCurrentUser(req);
    const order = await this.orderService.getOrder(req.params.orderId, actor);
    res.json(okResponse(order));
  };

  cancel = async (req, res) => {
    const actor = getCurrentUser(req);
    const order = await this.orderService.cancelOrder(req.params.orderId, req.body, actor);
    res.json(okResponse(order));
  };

  updateStatus = async (req, res) => {
    const actor = getCurrentUser(req);
    const order = await this.orderService.updateOrderStatus(req.params.orderId, req.body.status, actor);
    res.json(okResponse(order));
  };
}

module.exports = { OrderController };
