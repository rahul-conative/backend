require("dotenv").config();
const { connectMongo, mongoose } = require("../../src/infrastructure/mongo/mongo-client");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");

const IMAGE = {
  fashion: "/image/png/Fashion.png",
  electronics: "/image/png/Electronics.png",
  home: "/image/png/Home.png",
  beauty: "/image/png/Beauty.png",
  mobiles: "/image/png/Mobiles.png",
};

const NODES = [
  { categoryKey: "fashion", title: "Fashion", parentKey: null, level: 0, sortOrder: 1, imageUrl: IMAGE.fashion },
  { categoryKey: "electronics", title: "Electronics", parentKey: null, level: 0, sortOrder: 2, imageUrl: IMAGE.electronics },
  { categoryKey: "home-kitchen", title: "Home & Kitchen", parentKey: null, level: 0, sortOrder: 3, imageUrl: IMAGE.home },
  { categoryKey: "beauty", title: "Beauty & Personal Care", parentKey: null, level: 0, sortOrder: 4, imageUrl: IMAGE.beauty },

  { categoryKey: "mens-clothing", title: "Men's Clothing", parentKey: "fashion", level: 1, sortOrder: 1 },
  { categoryKey: "womens-clothing", title: "Women's Clothing", parentKey: "fashion", level: 1, sortOrder: 2 },
  { categoryKey: "footwear", title: "Footwear", parentKey: "fashion", level: 1, sortOrder: 3 },
  { categoryKey: "mobiles", title: "Mobiles", parentKey: "electronics", level: 1, sortOrder: 1, imageUrl: IMAGE.mobiles },
  { categoryKey: "laptops", title: "Laptops", parentKey: "electronics", level: 1, sortOrder: 2 },
  { categoryKey: "audio", title: "Audio", parentKey: "electronics", level: 1, sortOrder: 3 },
  { categoryKey: "kitchen-appliances", title: "Kitchen Appliances", parentKey: "home-kitchen", level: 1, sortOrder: 1 },
  { categoryKey: "home-decor", title: "Home Decor", parentKey: "home-kitchen", level: 1, sortOrder: 2 },
  { categoryKey: "skincare", title: "Skincare", parentKey: "beauty", level: 1, sortOrder: 1 },
  { categoryKey: "haircare", title: "Hair Care", parentKey: "beauty", level: 1, sortOrder: 2 },

  { categoryKey: "mens-tshirts", title: "T-Shirts", parentKey: "mens-clothing", level: 2, sortOrder: 1 },
  { categoryKey: "mens-shirts", title: "Shirts", parentKey: "mens-clothing", level: 2, sortOrder: 2 },
  { categoryKey: "mens-jeans", title: "Jeans", parentKey: "mens-clothing", level: 2, sortOrder: 3 },
  { categoryKey: "womens-dresses", title: "Dresses", parentKey: "womens-clothing", level: 2, sortOrder: 1 },
  { categoryKey: "womens-tops", title: "Tops", parentKey: "womens-clothing", level: 2, sortOrder: 2 },
  { categoryKey: "womens-ethnic", title: "Ethnic Wear", parentKey: "womens-clothing", level: 2, sortOrder: 3 },
  { categoryKey: "mens-footwear", title: "Men's Footwear", parentKey: "footwear", level: 2, sortOrder: 1 },
  { categoryKey: "womens-footwear", title: "Women's Footwear", parentKey: "footwear", level: 2, sortOrder: 2 },
  { categoryKey: "sports-shoes", title: "Sports Shoes", parentKey: "footwear", level: 2, sortOrder: 3 },
  { categoryKey: "android-phones", title: "Android Phones", parentKey: "mobiles", level: 2, sortOrder: 1 },
  { categoryKey: "ios-phones", title: "iPhone", parentKey: "mobiles", level: 2, sortOrder: 2 },
  { categoryKey: "mobile-accessories", title: "Accessories", parentKey: "mobiles", level: 2, sortOrder: 3 },
  { categoryKey: "gaming-laptops", title: "Gaming Laptops", parentKey: "laptops", level: 2, sortOrder: 1 },
  { categoryKey: "business-laptops", title: "Business Laptops", parentKey: "laptops", level: 2, sortOrder: 2 },
  { categoryKey: "laptop-accessories", title: "Laptop Accessories", parentKey: "laptops", level: 2, sortOrder: 3 },
  { categoryKey: "headphones", title: "Headphones", parentKey: "audio", level: 2, sortOrder: 1 },
  { categoryKey: "earbuds", title: "Earbuds", parentKey: "audio", level: 2, sortOrder: 2 },
  { categoryKey: "bluetooth-speakers", title: "Speakers", parentKey: "audio", level: 2, sortOrder: 3 },
  { categoryKey: "mixers-grinders", title: "Mixers & Grinders", parentKey: "kitchen-appliances", level: 2, sortOrder: 1 },
  { categoryKey: "microwave-ovens", title: "Microwave Ovens", parentKey: "kitchen-appliances", level: 2, sortOrder: 2 },
  { categoryKey: "air-fryers", title: "Air Fryers", parentKey: "kitchen-appliances", level: 2, sortOrder: 3 },
  { categoryKey: "wall-decor", title: "Wall Decor", parentKey: "home-decor", level: 2, sortOrder: 1 },
  { categoryKey: "lighting", title: "Lighting", parentKey: "home-decor", level: 2, sortOrder: 2 },
  { categoryKey: "showpieces", title: "Showpieces", parentKey: "home-decor", level: 2, sortOrder: 3 },
  { categoryKey: "face-care", title: "Face Care", parentKey: "skincare", level: 2, sortOrder: 1 },
  { categoryKey: "body-care", title: "Body Care", parentKey: "skincare", level: 2, sortOrder: 2 },
  { categoryKey: "sunscreen", title: "Sunscreen", parentKey: "skincare", level: 2, sortOrder: 3 },
  { categoryKey: "shampoo", title: "Shampoo", parentKey: "haircare", level: 2, sortOrder: 1 },
  { categoryKey: "conditioner", title: "Conditioner", parentKey: "haircare", level: 2, sortOrder: 2 },
  { categoryKey: "hair-serum", title: "Hair Serum", parentKey: "haircare", level: 2, sortOrder: 3 },
];

async function run() {
  try {
    await connectMongo();
    console.log("Connected MongoDB");
    let upserts = 0;
    for (const node of NODES) {
      const parent = node.parentKey
        ? await CategoryTreeModel.findOne({ categoryKey: node.parentKey }).lean()
        : null;
      const imageUrl = node.imageUrl || parent?.imageUrl || "";
      await CategoryTreeModel.findOneAndUpdate(
        { categoryKey: node.categoryKey },
        {
          $set: {
            title: node.title,
            parentKey: node.parentKey,
            level: node.level,
            sortOrder: node.sortOrder,
            active: true,
            imageUrl,
            bannerUrl: imageUrl,
            iconUrl: imageUrl,
          },
          $setOnInsert: { categoryKey: node.categoryKey },
        },
        { upsert: true, new: true },
      );
      upserts += 1;
    }
    console.log(`Upserted ${upserts} category nodes`);
  } catch (e) {
    console.error("Failed seed-menu-categories:", e);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
