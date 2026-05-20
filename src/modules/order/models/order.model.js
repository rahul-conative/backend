const orderTable = {
  name: "orders",
  columns: [
    "id",
    "buyer_id",
    "status",
    "currency",
    "subtotal_amount",
    "discount_amount",
    "tax_amount",
    "total_amount",
    "shipping_address",
    "created_at",
  ],
};

const orderItemTable = {
  name: "order_items",
  columns: [
    "id",
    "order_id",
    "product_id",
    "variant_id",
    "variant_sku",
    "variant_title",
    "attributes",
    "seller_id",
    "quantity",
    "unit_price",
    "line_total",
  ],
};

module.exports = { orderTable, orderItemTable };
