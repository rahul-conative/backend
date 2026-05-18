require("dotenv").config();
const { connectMongo, mongoose } = require("../../src/infrastructure/mongo/mongo-client");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");

const LEVEL_2_SEEDS = [
  { parentKey: "mobiles", categoryKey: "android-phones", title: "Android Phones", sortOrder: 1 },
  { parentKey: "mobiles", categoryKey: "ios-phones", title: "iOS Phones", sortOrder: 2 },
  { parentKey: "mobiles", categoryKey: "mobile-accessories", title: "Mobile Accessories", sortOrder: 3 },
  { parentKey: "laptops", categoryKey: "gaming-laptops", title: "Gaming Laptops", sortOrder: 1 },
  { parentKey: "laptops", categoryKey: "business-laptops", title: "Business Laptops", sortOrder: 2 },
  { parentKey: "laptops", categoryKey: "laptop-accessories", title: "Laptop Accessories", sortOrder: 3 },
  { parentKey: "mens-clothing", categoryKey: "mens-tshirts", title: "T-Shirts", sortOrder: 1 },
  { parentKey: "mens-clothing", categoryKey: "mens-shirts", title: "Shirts", sortOrder: 2 },
  { parentKey: "mens-clothing", categoryKey: "mens-jeans", title: "Jeans", sortOrder: 3 },
  { parentKey: "womens-clothing", categoryKey: "womens-dresses", title: "Dresses", sortOrder: 1 },
  { parentKey: "womens-clothing", categoryKey: "womens-tops", title: "Tops", sortOrder: 2 },
  { parentKey: "womens-clothing", categoryKey: "womens-ethnic", title: "Ethnic Wear", sortOrder: 3 },
  { parentKey: "footwear", categoryKey: "mens-footwear", title: "Men's Footwear", sortOrder: 1 },
  { parentKey: "footwear", categoryKey: "womens-footwear", title: "Women's Footwear", sortOrder: 2 },
  { parentKey: "kitchen-appliances", categoryKey: "mixers-grinders", title: "Mixers & Grinders", sortOrder: 1 },
  { parentKey: "kitchen-appliances", categoryKey: "microwave-ovens", title: "Microwave Ovens", sortOrder: 2 },
  { parentKey: "home-decor", categoryKey: "wall-decor", title: "Wall Decor", sortOrder: 1 },
  { parentKey: "home-decor", categoryKey: "lighting", title: "Lighting", sortOrder: 2 },
  { parentKey: "sportswear", categoryKey: "active-tops", title: "Active Tops", sortOrder: 1 },
  { parentKey: "sportswear", categoryKey: "active-bottoms", title: "Active Bottoms", sortOrder: 2 },
  { parentKey: "skincare", categoryKey: "face-care", title: "Face Care", sortOrder: 1 },
  { parentKey: "skincare", categoryKey: "body-care", title: "Body Care", sortOrder: 2 },
];

async function run() {
  try {
    await connectMongo();
    console.log("Connected to MongoDB");

    let upserted = 0;
    for (const seed of LEVEL_2_SEEDS) {
      const parent = await CategoryTreeModel.findOne({ categoryKey: seed.parentKey }).lean();
      if (!parent) continue;

      await CategoryTreeModel.findOneAndUpdate(
        { categoryKey: seed.categoryKey },
        {
          $set: {
            title: seed.title,
            parentKey: seed.parentKey,
            level: 2,
            sortOrder: seed.sortOrder,
            active: true,
            imageUrl: parent.imageUrl || "",
            bannerUrl: parent.bannerUrl || "",
            iconUrl: parent.iconUrl || "",
          },
          $setOnInsert: { categoryKey: seed.categoryKey },
        },
        { upsert: true, new: true },
      );
      upserted += 1;
    }

    console.log(`Upserted ${upserted} level-2 categories`);
  } catch (error) {
    console.error("Failed to seed level-2 categories:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
