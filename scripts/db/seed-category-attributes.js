require("dotenv").config();

const { connectMongo, mongoose } = require("../../src/infrastructure/mongo/mongo-client");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");
const { productOptionValues, basicCategories } = require("./catalog-options-data");
const { seedProductOptionValues } = require("./seed-product-option-values");

function makeAttribute(option, values) {
  const name = option.name;
  const key = String(option.slug || name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return {
    platformOptionId: String(option._id),
    allowCustomOptions: false,
    key,
    label: name,
    type: name === "Color" || name === "Size" || name === "Storage" || name === "RAM" ? "select" : "multi_select",
    required: name === "Size" || name === "Color",
    options: values.map((value) => (typeof value === "string" ? value : value.name)),
    unit: null,
    isVariantAttribute: ["Size", "Color", "Storage", "RAM"].includes(name),
    isFilterable: true,
    isSearchable: true,
  };
}

async function seedCategoryAttributes(existingOptionMap = null) {
  const { optionMap } = existingOptionMap ? { optionMap: existingOptionMap } : await seedProductOptionValues();
  let count = 0;

  for (const [rootIndex, root] of basicCategories.entries()) {
    await CategoryTreeModel.findOneAndUpdate(
      { categoryKey: root.categoryKey },
      {
        $set: {
          categoryKey: root.categoryKey,
          title: root.title,
          parentKey: null,
          level: 0,
          active: true,
          sortOrder: rootIndex,
          attributeSchema: [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    for (const [childIndex, child] of root.children.entries()) {
      const attributeSchema = child.attributes
        .map((optionName) => {
          const option = optionMap[optionName];
          const values = productOptionValues[optionName] || [];
          return option ? makeAttribute(option, values) : null;
        })
        .filter(Boolean);

      await CategoryTreeModel.findOneAndUpdate(
        { categoryKey: child.categoryKey },
        {
          $set: {
            categoryKey: child.categoryKey,
            title: child.title,
            parentKey: root.categoryKey,
            level: 1,
            active: true,
            sortOrder: childIndex,
            attributeSchema,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      count += 1;
    }
  }

  return count;
}

async function main() {
  await connectMongo();
  const count = await seedCategoryAttributes();
  console.log(`Seeded attributes for ${count} categories`);
  await mongoose.connection.close();
}

if (require.main === module) {
  main().catch(async (error) => {
    console.error(error);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  });
}

module.exports = { seedCategoryAttributes };
