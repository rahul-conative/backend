#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { UserModel } = require("../../src/modules/user/models/user.model");
const { ProductModel } = require("../../src/modules/product/models/product.model");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");

const INPUT_FILE = path.resolve(__dirname, "./data/product-category-image-overrides.json");

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toCategoryKey(label = "") {
  return slugify(String(label || "").replace(/&/g, " and "));
}

function getBasePrice(category = "") {
  const key = String(category).toLowerCase();
  if (key.includes("shoe")) return 3999;
  if (key.includes("shirt")) return 1499;
  if (key.includes("smartphone")) return 24999;
  if (key.includes("furniture")) return 12999;
  return 1999;
}

async function ensureCategory(categoryLabel) {
  const categoryKey = toCategoryKey(categoryLabel);
  const existing = await CategoryTreeModel.findOne({ categoryKey });
  if (existing) return existing;

  const cover = `https://cdn.dummyjson.com/product-images/${categoryKey}/default.webp`;
  return CategoryTreeModel.create({
    categoryKey,
    title: categoryLabel,
    parentKey: null,
    level: 0,
    active: true,
    sortOrder: 0,
    imageUrl: cover,
    bannerUrl: cover,
    iconUrl: cover,
    attributeSchema: [],
    attributesSchema: {},
  });
}

async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`Input file missing: ${INPUT_FILE}`);
  }
  const payload = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  if (!Array.isArray(payload) || !payload.length) {
    throw new Error("Input payload is empty.");
  }

  console.log("⏳ Creating/updating products from provided image list...");
  await connectMongo();

  const seller = await UserModel.findOne({ role: "seller" }).select("_id");
  if (!seller?._id) throw new Error("No seller found.");
  const sellerId = String(seller._id);

  const touchedCategories = new Set();
  let created = 0;
  let updated = 0;

  for (const item of payload) {
    const title = String(item?.title || "").trim();
    const categoryLabel = String(item?.category || "").trim();
    const brand = String(item?.brand || "").trim();
    const images = Array.isArray(item?.images) ? item.images.filter(Boolean) : [];
    if (!title || !categoryLabel || !brand || !images.length) continue;

    const categoryDoc = await ensureCategory(categoryLabel);
    touchedCategories.add(categoryDoc.categoryKey);

    const categoryKey = categoryDoc.categoryKey;
    const basePrice = getBasePrice(categoryLabel);
    const slug = slugify(title);

    const existing = await ProductModel.findOne({ title: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    const updateDoc = {
      sellerId,
      title,
      slug: existing?.slug || slug,
      description: `${title} - ${brand} ${categoryLabel}.`,
      productType: "simple",
      visibility: "public",
      categoryId: categoryKey,
      category: categoryKey,
      brand,
      price: basePrice,
      mrp: basePrice + 1000,
      salePrice: basePrice,
      currency: "INR",
      gstRate: 18,
      hsnCode: "0000",
      sku: `SKU-${slug.slice(0, 18).toUpperCase()}`,
      color: "Default",
      attributes: {},
      images,
      stock: 50,
      reservedStock: 0,
      minPurchaseQuantity: 1,
      maxPurchaseQuantity: 10,
      status: "active",
      metadata: { featured: false, codAvailable: true },
    };

    if (existing) {
      await ProductModel.updateOne({ _id: existing._id }, { $set: updateDoc });
      updated += 1;
    } else {
      await ProductModel.create(updateDoc);
      created += 1;
    }
  }

  // Update category images from first product image in each category.
  for (const categoryKey of touchedCategories) {
    const first = await ProductModel.findOne({ category: categoryKey }).select("images");
    const firstImage = first?.images?.[0];
    if (!firstImage) continue;
    await CategoryTreeModel.updateOne(
      { categoryKey },
      { $set: { imageUrl: firstImage, bannerUrl: firstImage, iconUrl: firstImage } },
    );
  }

  console.log(`✅ Products created: ${created}`);
  console.log(`✅ Products updated: ${updated}`);
  console.log(`✅ Categories synced: ${touchedCategories.size}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed:", error?.message || error);
    process.exit(1);
  });

