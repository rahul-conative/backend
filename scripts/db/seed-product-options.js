require("dotenv").config();

const { connectMongo, mongoose } = require("../../src/infrastructure/mongo/mongo-client");
const { PlatformProductOptionModel } = require("../../src/modules/platform/models/platform-product-option.model");
const { productOptionMasters } = require("./catalog-options-data");

async function seedProductOptions() {
  const optionMap = {};
  for (const option of productOptionMasters) {
    const doc = await PlatformProductOptionModel.findOneAndUpdate(
      { $or: [{ slug: option.slug }, { name: option.name }] },
      { $set: option },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    optionMap[option.name] = doc;
  }
  return optionMap;
}

async function main() {
  await connectMongo();
  const optionMap = await seedProductOptions();
  console.log(`Seeded ${Object.keys(optionMap).length} product option masters`);
  await mongoose.connection.close();
}

if (require.main === module) {
  main().catch(async (error) => {
    console.error(error);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  });
}

module.exports = { seedProductOptions };
