const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    items: [
      {
        productId: { type: String, required: true },
        variantId: { type: String, default: "" },
        variantSku: { type: String, default: "" },
        variantTitle: { type: String, default: "" },
        attributes: { type: Object, default: {} },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
      },
    ],
    wishlist: [{ type: String }],
  },
  { timestamps: true },
);

const CartModel = mongoose.model("Cart", cartSchema);

module.exports = { CartModel };
