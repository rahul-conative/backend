#!/usr/bin/env node
"use strict";

const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { ProductModel } = require("../../src/modules/product/models/product.model");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");

function normalize(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const CATEGORY_QUERY_MAP = {
  fashion: "fashion clothing",
  "mens-clothing": "mens shirt jeans",
  "womens-clothing": "women dress fashion",
  footwear: "shoes sneakers",
  handbags: "handbag purse",
  jewellery: "jewelry accessories",
  mobiles: "smartphone",
  laptops: "laptop computer",
  tablets: "tablet device",
  accessories: "computer accessories",
  audio: "headphones speaker",
  cameras: "camera photography",
  televisions: "television living room",
  furniture: "furniture interior",
  "home-decor": "home decor",
  lighting: "home lighting",
  bedding: "bed bedding",
  beauty: "beauty cosmetics",
  skincare: "skincare products",
  haircare: "hair care products",
  grocery: "grocery supermarket",
  "packaged-foods": "packaged food",
  beverages: "beverages drinks",
  "sports-fitness": "fitness sports equipment",
  "exercise-equipment": "gym equipment",
  books: "books stack",
  "tech-books": "technology books",
  "digital-courses": "online learning workspace",
};

function queryForCategory(categoryKey = "", title = "") {
  const key = String(categoryKey || "").toLowerCase();
  if (CATEGORY_QUERY_MAP[key]) return CATEGORY_QUERY_MAP[key];
  const titleNorm = normalize(title);
  for (const [k, v] of Object.entries(CATEGORY_QUERY_MAP)) {
    if (titleNorm.includes(normalize(k))) return v;
  }
  return title || categoryKey || "ecommerce product";
}

function categoryVisuals(query, key) {
  return {
    imageUrl: `https://loremflickr.com/1200/900/${encodeURIComponent(query)}?lock=${encodeURIComponent(`cat-${key}`)}`,
    bannerUrl: `https://loremflickr.com/1600/900/${encodeURIComponent(query)}?lock=${encodeURIComponent(`banner-${key}`)}`,
    iconUrl: `https://loremflickr.com/600/600/${encodeURIComponent(query)}?lock=${encodeURIComponent(`icon-${key}`)}`,
  };
}

function productVisuals(query, slug) {
  return [
    `https://loremflickr.com/1200/1200/${encodeURIComponent(query)}?lock=${encodeURIComponent(`${slug}-1`)}`,
    `https://loremflickr.com/1200/1200/${encodeURIComponent(query)}?lock=${encodeURIComponent(`${slug}-2`)}`,
    `https://loremflickr.com/1200/1200/${encodeURIComponent(query)}?lock=${encodeURIComponent(`${slug}-3`)}`,
    `https://loremflickr.com/1200/1200/${encodeURIComponent(query)}?lock=${encodeURIComponent(`${slug}-4`)}`,
  ];
}

async function main() {
  console.log("⏳ Updating category + product images to ecommerce-appropriate themes...");
  await connectMongo();

  const categories = await CategoryTreeModel.find({});
  const categoryKeywordMap = new Map();

  for (const category of categories) {
    const query = queryForCategory(category.categoryKey, category.title);
    categoryKeywordMap.set(String(category.categoryKey), query);
    const visuals = categoryVisuals(query, category.categoryKey || category.title);
    category.imageUrl = visuals.imageUrl;
    category.bannerUrl = visuals.bannerUrl;
    category.iconUrl = visuals.iconUrl;
    await category.save();
  }

  const products = await ProductModel.find({});
  for (const product of products) {
    const query = categoryKeywordMap.get(String(product.category)) || queryForCategory(product.category, product.title);
    product.images = productVisuals(query, product.slug || product._id);
    await product.save();
  }

  console.log(`✅ Categories updated: ${categories.length}`);
  console.log(`✅ Products updated: ${products.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to update ecommerce images:", error?.message || error);
    process.exit(1);
  });
