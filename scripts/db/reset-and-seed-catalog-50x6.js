#!/usr/bin/env node
"use strict";

const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { UserModel } = require("../../src/modules/user/models/user.model");
const { ProductModel } = require("../../src/modules/product/models/product.model");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORY_TITLES = [
  "Men's T-Shirts", "Men's Shirts", "Men's Jeans", "Men's Trousers", "Men's Jackets",
  "Women's Dresses", "Women's Tops", "Women's Jeans", "Women's Ethnic Wear", "Women's Footwear",
  "Kids Boys Wear", "Kids Girls Wear", "Baby Clothing", "School Supplies", "Toys & Games",
  "Smartphones", "Feature Phones", "Laptops", "Tablets", "Smartwatches",
  "Headphones", "Speakers", "Cameras", "Power Banks", "Computer Accessories",
  "Televisions", "Refrigerators", "Washing Machines", "Air Conditioners", "Kitchen Appliances",
  "Furniture", "Home Decor", "Lighting", "Bedding", "Storage & Organization",
  "Beauty & Makeup", "Skincare", "Hair Care", "Fragrances", "Personal Care",
  "Grocery Staples", "Snacks & Beverages", "Health Supplements", "Pet Supplies", "Sports Equipment",
  "Fitness Gear", "Books", "Stationery", "Automotive Accessories", "Garden & Outdoor"
];

const BRAND_POOL = [
  "NovaMart", "UrbanNest", "TechPulse", "StyleCraft", "PrimeEdge",
  "Aster", "Velora", "Zenith", "BluePeak", "OmniTrend"
];

function imageSet(seedBase) {
  return [
    `https://picsum.photos/seed/${seedBase}-1/1200/1200`,
    `https://picsum.photos/seed/${seedBase}-2/1200/1200`,
    `https://picsum.photos/seed/${seedBase}-3/1200/1200`,
    `https://picsum.photos/seed/${seedBase}-4/1200/1200`,
  ];
}

async function main() {
  console.log("⏳ Resetting previous catalog and seeding 50 categories x 6 products...");
  await connectMongo();

  const seller = await UserModel.findOne({ role: "seller" }).select("_id");
  if (!seller?._id) {
    throw new Error("No seller user found. Create at least one seller before seeding products.");
  }
  const sellerId = String(seller._id);

  // Hard reset previous catalog entities requested by user
  await ProductModel.deleteMany({});
  await CategoryTreeModel.deleteMany({});

  const categoryDocs = CATEGORY_TITLES.map((title, idx) => {
    const key = slugify(title);
    const cover = `https://picsum.photos/seed/category-${key}/1600/900`;
    return {
      categoryKey: key,
      title,
      parentKey: null,
      level: 0,
      active: true,
      sortOrder: idx + 1,
      imageUrl: cover,
      bannerUrl: cover,
      iconUrl: `https://picsum.photos/seed/icon-${key}/512/512`,
      attributeSchema: [],
      attributesSchema: {},
    };
  });
  await CategoryTreeModel.insertMany(categoryDocs, { ordered: true });

  const products = [];
  for (let c = 0; c < categoryDocs.length; c += 1) {
    const category = categoryDocs[c];
    for (let p = 1; p <= 6; p += 1) {
      const brand = BRAND_POOL[(c + p) % BRAND_POOL.length];
      const baseSlug = `${category.categoryKey}-${p}`;
      const title = `${category.title} Product ${p}`;
      const price = 399 + c * 25 + p * 40;
      const mrp = price + 250;
      products.push({
        sellerId,
        title,
        slug: slugify(baseSlug),
        description: `${title} in ${category.title} with quality build and daily-use comfort.`,
        productType: "simple",
        visibility: "public",
        categoryId: category.categoryKey,
        category: category.categoryKey,
        brand,
        tags: [slugify(category.title), slugify(brand), "trending"],
        price,
        mrp,
        salePrice: price,
        currency: "INR",
        gstRate: 18,
        hsnCode: "0000",
        sku: `SKU-${category.categoryKey.toUpperCase()}-${p}`,
        color: ["Black", "Blue", "Red", "Green", "White", "Grey"][p - 1],
        attributes: { edition: `v${p}` },
        hasVariants: false,
        variants: [],
        options: [],
        specifications: {},
        images: imageSet(baseSlug),
        videos: [],
        documents: [],
        origin: {
          country: "India",
          state: "Maharashtra",
          city: "Mumbai",
        },
        stock: 25 + p * 3,
        reservedStock: 0,
        minPurchaseQuantity: 1,
        maxPurchaseQuantity: 10,
        status: "active",
        metadata: { featured: p === 1, codAvailable: true },
      });
    }
  }

  await ProductModel.insertMany(products, { ordered: false });

  console.log(`✅ Categories created: ${categoryDocs.length}`);
  console.log(`✅ Products created: ${products.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to reset/seed catalog:", error?.message || error);
    process.exit(1);
  });

