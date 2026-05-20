"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const table = await queryInterface.describeTable("order_items", { transaction });
      if (!table.variant_id) {
        await queryInterface.addColumn("order_items", "variant_id", {
          type: Sequelize.STRING(64),
          allowNull: true,
        }, { transaction });
      }
      if (!table.variant_sku) {
        await queryInterface.addColumn("order_items", "variant_sku", {
          type: Sequelize.STRING(128),
          allowNull: true,
        }, { transaction });
      }
      if (!table.variant_title) {
        await queryInterface.addColumn("order_items", "variant_title", {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction });
      }
      if (!table.attributes) {
        await queryInterface.addColumn("order_items", "attributes", {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {},
        }, { transaction });
      }
      await queryInterface.addIndex("order_items", ["product_id", "variant_sku"], {
        name: "idx_order_items_product_variant",
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex("order_items", "idx_order_items_product_variant", { transaction }).catch(() => {});
      await queryInterface.removeColumn("order_items", "attributes", { transaction });
      await queryInterface.removeColumn("order_items", "variant_title", { transaction });
      await queryInterface.removeColumn("order_items", "variant_sku", { transaction });
      await queryInterface.removeColumn("order_items", "variant_id", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
