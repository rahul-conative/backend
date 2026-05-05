const { okResponse } = require("../../../shared/http/reply");
const { CartService } = require("../services/cart.service");
const { getCurrentUser } = require("../../../shared/auth/current-user");

class CartController {
  constructor({ cartService = new CartService() } = {}) {
    this.cartService = cartService;
  }

  getMyCart = async (req, res) => {
    const actor = getCurrentUser(req);
    const cart = await this.cartService.getCart(actor.userId);
    res.json(okResponse(cart));
  };

  upsertMyCart = async (req, res) => {
    const actor = getCurrentUser(req);
    const cart = await this.cartService.upsertCart(actor.userId, req.body);
    res.json(okResponse(cart));
  };
}

module.exports = { CartController };
