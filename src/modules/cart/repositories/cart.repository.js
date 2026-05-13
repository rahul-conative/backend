const { mongoose } = require("../../../infrastructure/mongo/mongo-client");
const { CartModel } = require("../models/cart.model");
const { ProductModel } = require("../../product/models/product.model");

class CartRepository {
  async _populateItemsProduct(cartDoc) {
    if (!cartDoc || !Array.isArray(cartDoc.items) || cartDoc.items.length === 0) {
      return cartDoc;
    }

    const objectIdProductIds = [
      ...new Set(
        cartDoc.items
          .map((item) => item.productId)
          .filter((id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id)),
      ),
    ];

    if (objectIdProductIds.length === 0) {
      return cartDoc;
    }

    const products = await ProductModel.find({ _id: { $in: objectIdProductIds } }).lean();
    const productById = new Map(products.map((product) => [String(product._id), product]));

    const cart = cartDoc.toObject ? cartDoc.toObject() : { ...cartDoc };
    cart.items = cart.items.map((item) => ({
      ...item,
      productId: productById.get(String(item.productId)) || item.productId,
    }));

    return cart;
  }

  async getByUserId(userId) {
    const cart = await CartModel.findOne({ userId }).exec();
    return this._populateItemsProduct(cart);
  }

  async upsertCart(userId, payload) {
    const cart = await CartModel.findOneAndUpdate({ userId }, payload, { upsert: true, new: true }).exec();
    return this._populateItemsProduct(cart);
  }
}

module.exports = { CartRepository };
