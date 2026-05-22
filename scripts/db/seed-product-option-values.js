require("dotenv").config();

const { connectMongo, mongoose } = require("../../src/infrastructure/mongo/mongo-client");
const { PlatformProductOptionValueModel } = require("../../src/modules/platform/models/platform-product-option-value.model");
const { slugify, productOptionValues } = require("./catalog-options-data");
const { seedProductOptions } = require("./seed-product-options");

async function seedProductOptionValues(existingOptionMap = null) {
  const optionMap = existingOptionMap || await seedProductOptions();
  let count = 0;

  for (const [optionName, values] of Object.entries(productOptionValues)) {
    const option = optionMap[optionName];
    if (!option) continue;
    for (const [index, rawValue] of values.entries()) {
      const value = typeof rawValue === "string" ? { name: rawValue } : rawValue;
      const payload = {
        optionId: String(option._id),
        option_id: String(option._id),
        optionName: option.name,
        name: value.name,
        valueCode: value.valueCode || slugify(value.name).replace(/-/g, "_"),
        colorHex: value.colorHex || "",
        imageUrl: value.imageUrl || "",
        sortOrder: index,
        active: true,
      };
      await PlatformProductOptionValueModel.findOneAndUpdate(
        { $or: [{ optionId: payload.optionId, name: payload.name }, { option_id: payload.optionId, name: payload.name }] },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      count += 1;
    }
  }

  return { optionMap, count };
}

async function main() {
  await connectMongo();
  const result = await seedProductOptionValues();
  console.log(`Seeded ${result.count} product option values`);
  await mongoose.connection.close();
}

if (require.main === module) {
  main().catch(async (error) => {
    console.error(error);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  });
}

module.exports = { seedProductOptionValues };
