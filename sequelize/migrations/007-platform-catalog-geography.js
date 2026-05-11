module.exports = {
  id: "007-platform-catalog-geography",
  async up({ queryInterface, Sequelize, transaction }) {
    const now = Sequelize.fn("NOW");

    await queryInterface.createTable(
      "countries",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        code: { type: Sequelize.STRING(16), allowNull: false, unique: true },
        name: { type: Sequelize.STRING(160), allowNull: false },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      },
      { transaction },
    );

    await queryInterface.createTable(
      "states",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        country_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "countries", key: "id" },
          onDelete: "CASCADE",
        },
        state_code: { type: Sequelize.STRING(16), allowNull: false },
        state_name: { type: Sequelize.STRING(160), allowNull: false },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      },
      { transaction },
    );

    await queryInterface.createTable(
      "cities",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        country_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "countries", key: "id" },
          onDelete: "CASCADE",
        },
        state_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "states", key: "id" },
          onDelete: "CASCADE",
        },
        city_name: { type: Sequelize.STRING(160), allowNull: false },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      },
      { transaction },
    );

    await queryInterface.createTable(
      "categories",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        category_key: { type: Sequelize.STRING(128), allowNull: false, unique: true },
        title: { type: Sequelize.STRING(180), allowNull: false },
        parent_key: { type: Sequelize.STRING(128), allowNull: true },
        level: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      },
      { transaction },
    );

    await queryInterface.createTable(
      "category_attributes",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        category_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "categories", key: "id" },
          onDelete: "CASCADE",
        },
        attribute_key: { type: Sequelize.STRING(120), allowNull: false },
        label: { type: Sequelize.STRING(180), allowNull: false },
        type: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "text" },
        required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        options: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        unit: { type: Sequelize.STRING(64), allowNull: true },
        is_variant_attribute: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        is_filterable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        is_searchable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      },
      { transaction },
    );

    await queryInterface.createTable(
      "hsn_codes",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        code: { type: Sequelize.STRING(32), allowNull: false, unique: true },
        description: { type: Sequelize.TEXT, allowNull: false },
        gst_rate: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 18 },
        cess_rate: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
        tax_type: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "gst" },
        exempt: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        category: { type: Sequelize.STRING(128), allowNull: true },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now },
      },
      { transaction },
    );

    await queryInterface.addIndex("states", ["country_id"], { transaction });
    await queryInterface.addIndex("cities", ["state_id", "country_id"], { transaction });
    await queryInterface.addIndex("category_attributes", ["category_id", "attribute_key"], {
      unique: true,
      transaction,
    });
    await queryInterface.addIndex("hsn_codes", ["category"], { transaction });
  },

  async down({ queryInterface, transaction }) {
    const tables = ["hsn_codes", "category_attributes", "categories", "cities", "states", "countries"];
    for (const table of tables) {
      await queryInterface.dropTable(table, { transaction });
    }
  },
};
