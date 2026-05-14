#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { ProductModel } = require("../../src/modules/product/models/product.model");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");
const { ContentPageModel } = require("../../src/modules/platform/models/content-page.model");
const { storageService } = require("../../src/shared/storage/storage-service");
const { env } = require("../../src/config/env");

const CUSTOMER_PUBLIC_IMAGE_DIR = path.resolve(__dirname, "../../../customer/public/image");
const CACHE_FILE = path.resolve(__dirname, "./.catalog-media-cache.json");
const VALID_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const DEFAULT_PURGE_FOLDERS = ["ecommerce/categories", "ecommerce/products", "ecommerce/cms"];

function parseArgs(argv = []) {
  const parsed = {
    sourceDir: CUSTOMER_PUBLIC_IMAGE_DIR,
    purgeCloudinary: false,
    clearCache: false,
  };
  for (const arg of argv) {
    if (arg === "--purge-cloudinary") parsed.purgeCloudinary = true;
    else if (arg === "--clear-cache") parsed.clearCache = true;
    else if (arg.startsWith("--source=")) {
      const source = arg.split("=")[1];
      if (source) parsed.sourceDir = path.resolve(process.cwd(), source);
    }
  }
  return parsed;
}

function listImageFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const stack = [dir];

  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (VALID_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        const size = fs.statSync(fullPath).size;
        if (size <= MAX_UPLOAD_BYTES) {
          results.push(fullPath);
        }
      }
    }
  }

  return results.sort();
}

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function hasCloudinaryConfig() {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

async function purgeCloudinaryFolders(folders = DEFAULT_PURGE_FOLDERS) {
  if (!hasCloudinaryConfig()) {
    throw new Error("Cloudinary credentials missing in environment");
  }

  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });

  for (const folder of folders) {
    console.log(`🧹 Purging Cloudinary folder: ${folder}`);
    let nextCursor = undefined;
    do {
      const search = await cloudinary.search
        .expression(`folder:${folder}`)
        .max_results(500)
        .next_cursor(nextCursor)
        .execute();
      const resources = Array.isArray(search?.resources) ? search.resources : [];
      const publicIds = resources.map((item) => item.public_id).filter(Boolean);
      if (publicIds.length) {
        await cloudinary.api.delete_resources(publicIds, { resource_type: "image" });
        console.log(`  ✓ Deleted ${publicIds.length} assets from ${folder}`);
      } else {
        console.log(`  ✓ No assets found in ${folder}`);
      }
      nextCursor = search?.next_cursor || null;
    } while (nextCursor);
  }
}

async function uploadWithCache(absPath, cache, folder) {
  const key = path.resolve(absPath);
  if (cache[key]) return cache[key];

  let attempts = 0;
  while (attempts < 3) {
    attempts += 1;
    try {
      const upload = await storageService.upload(absPath, {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      });
      const url = upload.secure_url || upload.url;
      cache[key] = url;
      return url;
    } catch (error) {
      const message = String(error?.message || error || "");
      if (message.toLowerCase().includes("file size too large")) {
        console.warn(`⚠ Skipping oversized image: ${absPath}`);
        cache[key] = null;
        return null;
      }
      if (attempts >= 3) {
        console.warn(`⚠ Skipping image after retries: ${absPath} (${message})`);
        cache[key] = null;
        return null;
      }
    }
  }
  return null;
}

function pickByKeyword(files, keywordList) {
  const lowered = files.map((file) => ({ file, name: path.basename(file).toLowerCase() }));
  const matched = lowered
    .filter((item) => keywordList.some((key) => item.name.includes(key)))
    .map((item) => item.file);
  return matched;
}

function getKeywordsForCategory(categoryKey = "") {
  const key = String(categoryKey).toLowerCase();
  const map = {
    mobiles: ["mobile", "phone", "electronics"],
    laptops: ["productimg", "electronics"],
    fashion: ["fashion", "stylish", "model"],
    "mens-clothing": ["mens", "pants", "blazer"],
    "womens-clothing": ["stylish-girls", "fashion", "maxi"],
    footwear: ["pair", "shoe"],
    jewellery: ["ring", "jew"],
    beauty: ["perfume", "spray"],
    furniture: ["furniture", "home"],
    "home-decor": ["home-decor", "smart-home"],
    "sports-fitness": ["sports"],
    grocery: ["food"],
    electronics: ["electronics", "productimg"],
  };
  return map[key] || [];
}

function getKeywordsForCms(slug = "", pageType = "") {
  const key = `${String(slug).toLowerCase()} ${String(pageType).toLowerCase()}`;
  if (key.includes("about") || key.includes("company")) return ["ourstory", "aboutbanner", "model", "stylish"];
  if (key.includes("faq") || key.includes("help")) return ["GeneralInquiries".toLowerCase(), "help", "customer"];
  if (key.includes("privacy") || key.includes("terms") || key.includes("policy")) return ["logo", "line", "about"];
  if (key.includes("banner") || key.includes("promotion")) return ["model", "off", "fashion", "home-decor"];
  return ["model", "fashion", "home-decor", "smart-home"];
}

async function seedCategoryImages(imageFiles, cache) {
  const categories = await CategoryTreeModel.find({}).sort({ level: 1, sortOrder: 1, title: 1 });
  const byKey = new Map(categories.map((c) => [c.categoryKey, c]));

  for (const category of categories) {
    const keywords = getKeywordsForCategory(category.categoryKey);
    let candidates = keywords.length ? pickByKeyword(imageFiles, keywords) : [];
    if (!candidates.length && category.parentKey && byKey.has(category.parentKey)) {
      const parent = byKey.get(category.parentKey);
      if (parent?.imageUrl) {
        category.imageUrl = parent.imageUrl;
        category.bannerUrl = parent.bannerUrl || parent.imageUrl;
        category.iconUrl = parent.iconUrl || parent.imageUrl;
        await category.save();
        continue;
      }
    }
    if (!candidates.length) candidates = imageFiles;
    const primary = candidates[0];
    if (!primary) continue;

    const url = await uploadWithCache(primary, cache, "ecommerce/categories");
    if (!url) continue;
    category.imageUrl = url;
    category.bannerUrl = url;
    category.iconUrl = url;
    await category.save();
  }
}

async function seedProductImages(imageFiles, cache) {
  const products = await ProductModel.find({}).sort({ createdAt: 1 });
  if (!products.length) return;

  let cursor = 0;
  const pickNext = (count = 3) => {
    const selected = [];
    for (let i = 0; i < count; i += 1) {
      selected.push(imageFiles[cursor % imageFiles.length]);
      cursor += 1;
    }
    return selected;
  };

  for (const product of products) {
    let candidates = pickByKeyword(imageFiles, getKeywordsForCategory(product.category));
    if (!candidates.length) {
      candidates = pickNext(3);
    }
    const selected = (candidates.length >= 3 ? candidates.slice(0, 3) : [...candidates, ...pickNext(3)]).slice(0, 3);
    const urls = [];
    for (const absPath of selected) {
      const url = await uploadWithCache(absPath, cache, "ecommerce/products");
      if (url) urls.push(url);
    }
    if (!urls.length) continue;

    const patch = { images: urls };
    if (Array.isArray(product.variants) && product.variants.length) {
      patch.variants = product.variants.map((variant, index) => ({
        ...variant.toObject?.() || variant,
        images: [urls[index % urls.length]],
      }));
    }
    await ProductModel.updateOne({ _id: product._id }, { $set: patch });
  }
}

async function seedCmsImages(imageFiles, cache) {
  const pages = await ContentPageModel.find({}).sort({ createdAt: 1 });
  for (const page of pages) {
    const keywords = getKeywordsForCms(page.slug, page.pageType);
    const candidates = pickByKeyword(imageFiles, keywords);
    const selected = candidates.length ? candidates.slice(0, 3) : imageFiles.slice(0, 3);
    const urls = [];
    for (const absPath of selected) {
      const url = await uploadWithCache(absPath, cache, "ecommerce/cms");
      if (url) urls.push(url);
    }
    if (!urls.length) continue;

    const patch = {
      coverImage: urls[0],
      thumbnailUrl: urls[1] || urls[0],
      heroImage: urls[2] || urls[0],
      galleryImages: urls,
      metadata: {
        ...(page.metadata || {}),
        heroImage: urls[2] || urls[0],
        coverImage: urls[0],
        thumbnailUrl: urls[1] || urls[0],
      },
    };
    await ContentPageModel.updateOne({ _id: page._id }, { $set: patch });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log("⏳ Seeding catalog media (Cloudinary + Mongo)...");
  await connectMongo();

  if (options.purgeCloudinary) {
    await purgeCloudinaryFolders(DEFAULT_PURGE_FOLDERS);
  }

  const imageFiles = listImageFiles(options.sourceDir);
  if (!imageFiles.length) {
    throw new Error(`No image files found in ${options.sourceDir}`);
  }
  console.log(`✓ Found ${imageFiles.length} local images in ${options.sourceDir}`);

  const cache = options.clearCache ? {} : loadCache();
  await seedCategoryImages(imageFiles, cache);
  await seedProductImages(imageFiles, cache);
  await seedCmsImages(imageFiles, cache);
  saveCache(cache);

  console.log("✅ Catalog media seeded successfully.");
  console.log(`ℹ Cache saved at ${CACHE_FILE}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to seed catalog media:", error.message || error);
    process.exit(1);
  });
