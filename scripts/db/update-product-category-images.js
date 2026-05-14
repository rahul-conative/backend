#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { ProductModel } = require("../../src/modules/product/models/product.model");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseArgs(argv = []) {
  const options = {
    file: path.resolve(__dirname, "./data/product-category-image-overrides.json"),
  };
  for (const arg of argv) {
    if (arg.startsWith("--file=")) {
      options.file = path.resolve(process.cwd(), arg.split("=")[1]);
    }
  }
  return options;
}

const CATEGORY_ALIASES = {
  "mens shoes": "footwear",
  "mens shirts": "mens-clothing",
  smartphones: "mobiles",
  furniture: "furniture",
};

function mappedCategoryKey(category = "") {
  const normalized = normalize(category);
  return CATEGORY_ALIASES[normalized] || normalized.replace(/\s+/g, "-");
}

function loadPayload(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input JSON not found: ${filePath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error("Input JSON must be an array");
  }
  return parsed;
}

async function updateProducts(records) {
  let updated = 0;
  let missing = 0;

  const allProducts = await ProductModel.find({}).select("_id title brand category");
  const categoryCursor = new Map();

  for (const item of records) {
    const title = String(item?.title || "").trim();
    const category = String(item?.category || "").trim();
    const brand = String(item?.brand || "").trim();
    const images = Array.isArray(item?.images) ? item.images.filter(Boolean) : [];
    if (!title || !images.length) continue;

    const titleRegex = new RegExp(`^${escapeRegex(title)}$`, "i");
    const candidates = await ProductModel.find({ title: titleRegex }).select("_id title brand category");
    let product = null;
    if (candidates.length === 1) {
      product = candidates[0];
    } else if (candidates.length > 1) {
      product =
        candidates.find(
          (p) =>
            normalize(p?.brand || "") === normalize(brand) &&
            normalize(p?.category || "") === normalize(category),
        ) ||
        candidates.find((p) => normalize(p?.brand || "") === normalize(brand)) ||
        candidates[0];
    }

    if (!product) {
      const categoryKey = mappedCategoryKey(category);
      const sameCategory = allProducts.filter((p) => normalize(p.category || "") === normalize(categoryKey));
      const preferred = sameCategory.filter((p) => normalize(p.brand || "") === normalize(brand));
      const pool = preferred.length ? preferred : sameCategory;
      if (pool.length) {
        const cursorKey = `${categoryKey}::${normalize(brand)}`;
        const cursor = categoryCursor.get(cursorKey) || 0;
        product = pool[cursor % pool.length];
        categoryCursor.set(cursorKey, cursor + 1);
      }
    }

    if (!product) {
      missing += 1;
      console.log(`⚠ Product not found: ${title}`);
      continue;
    }

    await ProductModel.updateOne(
      { _id: product._id },
      {
        $set: {
          images,
          ...(brand ? { brand } : {}),
        },
      },
    );
    updated += 1;
  }

  return { updated, missing };
}

async function updateCategories(records) {
  const grouped = new Map();
  records.forEach((item) => {
    const category = String(item?.category || "").trim();
    const firstImage = Array.isArray(item?.images) && item.images.length ? item.images[0] : null;
    if (!category || !firstImage) return;
    if (!grouped.has(normalize(category))) {
      grouped.set(normalize(category), { rawCategory: category, image: firstImage });
    }
  });

  const allCategories = await CategoryTreeModel.find({}).select("_id categoryKey title");
  let updated = 0;
  let missing = 0;

  for (const [, value] of grouped) {
    const mappedKey = mappedCategoryKey(value.rawCategory);
    const matched =
      allCategories.find((cat) => normalize(cat?.title || "") === normalize(value.rawCategory)) ||
      allCategories.find((cat) => normalize(cat?.categoryKey || "") === normalize(value.rawCategory)) ||
      allCategories.find((cat) => normalize(cat?.categoryKey || "") === normalize(mappedKey));

    if (!matched) {
      missing += 1;
      console.log(`⚠ Category not found: ${value.rawCategory}`);
      continue;
    }

    await CategoryTreeModel.updateOne(
      { _id: matched._id },
      {
        $set: {
          imageUrl: value.image,
          bannerUrl: value.image,
          iconUrl: value.image,
        },
      },
    );
    updated += 1;
  }

  return { updated, missing };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const records = loadPayload(options.file);
  console.log(`⏳ Updating product/category media from ${options.file} ...`);

  await connectMongo();

  const productResult = await updateProducts(records);
  const categoryResult = await updateCategories(records);

  console.log(`✅ Products updated: ${productResult.updated}`);
  console.log(`⚠ Products not found: ${productResult.missing}`);
  console.log(`✅ Categories updated: ${categoryResult.updated}`);
  console.log(`⚠ Categories not found: ${categoryResult.missing}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to update product/category images:", error?.message || error);
    process.exit(1);
  });
