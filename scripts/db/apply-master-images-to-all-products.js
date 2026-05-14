#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { ProductModel } = require("../../src/modules/product/models/product.model");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");

const SOURCE_FILE = path.resolve(__dirname, "./data/product-category-image-overrides.json");

function normalize(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function pickCategoryGroup(categoryLike = "") {
  const text = normalize(categoryLike);
  if (text.includes("shoe") || text.includes("footwear") || text.includes("sneaker")) return "mens shoes";
  if (text.includes("shirt") || text.includes("clothing") || text.includes("fashion") || text.includes("apparel")) return "mens shirts";
  if (text.includes("phone") || text.includes("mobile") || text.includes("smart")) return "smartphones";
  if (text.includes("furniture") || text.includes("decor") || text.includes("bed") || text.includes("sofa") || text.includes("home")) return "furniture";
  if (text.includes("laptop") || text.includes("tablet") || text.includes("electronics") || text.includes("camera") || text.includes("audio")) return "smartphones";
  if (text.includes("beauty") || text.includes("skin") || text.includes("hair") || text.includes("perfume")) return "mens shirts";
  if (text.includes("sports") || text.includes("fitness") || text.includes("exercise")) return "mens shoes";
  return "smartphones";
}

function buildPools(records = []) {
  const pools = new Map();
  for (const item of records) {
    const key = normalize(item?.category || "");
    const images = Array.isArray(item?.images) ? item.images.filter(Boolean) : [];
    if (!key || !images.length) continue;
    if (!pools.has(key)) pools.set(key, []);
    pools.get(key).push(images);
  }
  return pools;
}

async function main() {
  if (!fs.existsSync(SOURCE_FILE)) {
    throw new Error(`Source file missing: ${SOURCE_FILE}`);
  }
  const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8"));
  if (!Array.isArray(source) || !source.length) {
    throw new Error("Source image file is empty.");
  }

  const pools = buildPools(source);
  const requiredGroups = ["mens shoes", "mens shirts", "smartphones", "furniture"];
  requiredGroups.forEach((group) => {
    if (!pools.has(group)) throw new Error(`Missing pool for group: ${group}`);
  });

  console.log("⏳ Applying master image pools to ALL products and categories...");
  await connectMongo();

  const products = await ProductModel.find({}).select("_id title category slug images");
  const categories = await CategoryTreeModel.find({}).select("_id title categoryKey imageUrl bannerUrl iconUrl");

  const productCursorByGroup = new Map();
  const categoryFirstImage = new Map();

  for (const product of products) {
    const group = pickCategoryGroup(product.category || product.title || "");
    const pool = pools.get(group) || pools.get("smartphones");
    const cursor = productCursorByGroup.get(group) || 0;
    const images = pool[cursor % pool.length];
    productCursorByGroup.set(group, cursor + 1);

    await ProductModel.updateOne({ _id: product._id }, { $set: { images } });

    const categoryKey = String(product.category || "");
    if (!categoryFirstImage.has(categoryKey) && images?.[0]) {
      categoryFirstImage.set(categoryKey, images[0]);
    }
  }

  let categoryUpdated = 0;
  for (const category of categories) {
    const key = String(category.categoryKey || "");
    let firstImage = categoryFirstImage.get(key);
    if (!firstImage) {
      const group = pickCategoryGroup(category.title || category.categoryKey || "");
      const pool = pools.get(group) || pools.get("smartphones");
      firstImage = pool[0][0];
    }
    await CategoryTreeModel.updateOne(
      { _id: category._id },
      { $set: { imageUrl: firstImage, bannerUrl: firstImage, iconUrl: firstImage } },
    );
    categoryUpdated += 1;
  }

  console.log(`✅ Products updated: ${products.length}`);
  console.log(`✅ Categories updated: ${categoryUpdated}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:", error?.message || error);
    process.exit(1);
  });

