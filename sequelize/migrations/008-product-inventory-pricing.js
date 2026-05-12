"use strict";

/**
 * Migration 008: Product Inventory Ledger & Pricing Engine
 *
 * Adds PostgreSQL tables for:
 *  - product_inventory        — per-product/variant/warehouse stock tracking
 *  - inventory_transactions   — full audit log of every stock movement
 *  - product_price_history    — audit trail for price changes
 *  - product_price_rules      — time-bound / customer-group pricing
 */

module.exports = {
  id: "008-product-inventory-pricing",
  async up({ queryInterface, Sequelize, transaction }) {
    // ─── product_inventory ────────────────────────────────────────────────────
    await queryInterface.createTable(
      "product_inventory",
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        product_id: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        variant_sku: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: "NULL = root product, non-null = specific variant",
        },
        seller_id: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        warehouse_id: {
          type: Sequelize.STRING(64),
          allowNull: true,
          comment: "NULL = default/unassigned warehouse",
        },
        available_qty: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        reserved_qty: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        damaged_qty: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        returned_qty: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        incoming_qty: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        reorder_level: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 5,
        },
        reorder_qty: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 10,
        },
        low_stock_alert_sent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {},
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("NOW()"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("NOW()"),
        },
      },
      { transaction },
    );

    await queryInterface.addIndex("product_inventory", ["product_id", "variant_sku", "seller_id", "warehouse_id"], {
      unique: true,
      name: "idx_product_inventory_unique",
      transaction,
    });
    await queryInterface.addIndex("product_inventory", ["seller_id"], { name: "idx_product_inventory_seller", transaction });
    await queryInterface.addIndex("product_inventory", ["product_id"], { name: "idx_product_inventory_product", transaction });
    await queryInterface.addIndex("product_inventory", ["available_qty"], { name: "idx_product_inventory_qty", transaction });

    // ─── inventory_transactions ───────────────────────────────────────────────
    await queryInterface.createTable("inventory_transactions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      variant_sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      seller_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      warehouse_id: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      transaction_type: {
        type: Sequelize.ENUM(
          "purchase",
          "sale",
          "return",
          "adjustment",
          "reservation",
          "release",
          "damage",
          "transfer",
          "restock",
        ),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "Positive = stock in, Negative = stock out",
      },
      balance_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "Available stock after this transaction",
      },
      unit_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.STRING(128),
        allowNull: true,
        comment: "Order ID, PO number, return ID, etc.",
      },
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "order, purchase_order, return, manual",
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      performed_by: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    }, { transaction });

    await queryInterface.addIndex("inventory_transactions", ["product_id", "variant_sku"], { name: "idx_inv_tx_product", transaction });
    await queryInterface.addIndex("inventory_transactions", ["seller_id"], { name: "idx_inv_tx_seller", transaction });
    await queryInterface.addIndex("inventory_transactions", ["reference_id", "reference_type"], { name: "idx_inv_tx_reference", transaction });
    await queryInterface.addIndex("inventory_transactions", ["transaction_type"], { name: "idx_inv_tx_type", transaction });
    await queryInterface.addIndex("inventory_transactions", ["created_at"], { name: "idx_inv_tx_created", transaction });

    // ─── product_price_history ────────────────────────────────────────────────
    await queryInterface.createTable("product_price_history", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      variant_sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      seller_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      price_before: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      price_after: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      mrp_before: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      mrp_after: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: "INR",
      },
      changed_by: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    }, { transaction });

    await queryInterface.addIndex("product_price_history", ["product_id"], { name: "idx_price_hist_product", transaction });
    await queryInterface.addIndex("product_price_history", ["seller_id"], { name: "idx_price_hist_seller", transaction });
    await queryInterface.addIndex("product_price_history", ["created_at"], { name: "idx_price_hist_created", transaction });

    // ─── product_price_rules ──────────────────────────────────────────────────
    await queryInterface.createTable("product_price_rules", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      variant_sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      seller_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      rule_type: {
        type: Sequelize.ENUM("sale", "bulk", "customer_group", "flash_sale", "regional"),
        allowNull: false,
        defaultValue: "sale",
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      min_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      customer_group: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      region: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      valid_to: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    }, { transaction });

    await queryInterface.addIndex("product_price_rules", ["product_id", "variant_sku", "active"], { name: "idx_price_rules_product", transaction });
    await queryInterface.addIndex("product_price_rules", ["valid_from", "valid_to", "active"], { name: "idx_price_rules_validity", transaction });
    await queryInterface.addIndex("product_price_rules", ["rule_type", "active"], { name: "idx_price_rules_type", transaction });
  },

  async down({ queryInterface, transaction }) {
    await queryInterface.dropTable("product_price_rules", { transaction });
    await queryInterface.dropTable("product_price_history", { transaction });
    await queryInterface.dropTable("inventory_transactions", { transaction });
    await queryInterface.dropTable("product_inventory", { transaction });
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_inventory_transactions_transaction_type;", { transaction });
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_product_price_rules_rule_type;", { transaction });
  },
};
