#!/usr/bin/env node
const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { CategoryTreeModel } = require("../../src/modules/platform/models/category-tree.model");
const { HsnCodeModel } = require("../../src/modules/platform/models/hsn-code.model");
const { GeographyModel } = require("../../src/modules/platform/models/geography.model");

async function seedCategories() {
  const categories = [
    {
      categoryKey: "electronics",
      title: "Electronics",
      parentKey: null,
      level: 0,
      sortOrder: 1,
      attributesSchema: {
        brand: "string",
        color: "string",
        warrantyMonths: "number",
      },
    },
    {
      categoryKey: "mobiles",
      title: "Mobiles",
      parentKey: "electronics",
      level: 1,
      sortOrder: 2,
      attributesSchema: {
        brand: "string",
        ram: "string",
        storage: "string",
        batteryMah: "number",
        network: "string",
      },
    },
    {
      categoryKey: "laptops",
      title: "Laptops",
      parentKey: "electronics",
      level: 1,
      sortOrder: 3,
      attributesSchema: {
        brand: "string",
        processor: "string",
        ram: "string",
        storage: "string",
        screenSize: "string",
      },
    },
  ];

  await Promise.all(
    categories.map((category) =>
      CategoryTreeModel.findOneAndUpdate(
        { categoryKey: category.categoryKey },
        { $set: { ...category, active: true } },
        { upsert: true, new: true },
      ),
    ),
  );
}

async function seedHsnCodes() {
  const hsnCodes = [
    {
      code: "8471",
      description: "Automatic data processing machines and units thereof",
      gstRate: 18,
      cessRate: 0,
      taxType: "gst",
      exempt: false,
      category: "electronics",
      active: true,
    },
    {
      code: "8517",
      description: "Telephone sets, including smartphones",
      gstRate: 18,
      cessRate: 0,
      taxType: "gst",
      exempt: false,
      category: "electronics",
      active: true,
    },
    {
      code: "4202",
      description: "Trunks, suitcases, and similar containers",
      gstRate: 18,
      cessRate: 0,
      taxType: "gst",
      exempt: false,
      category: "fashion",
      active: true,
    },
  ];

  await Promise.all(
    hsnCodes.map((item) =>
      HsnCodeModel.findOneAndUpdate(
        { code: item.code },
        { $set: item },
        { upsert: true, new: true },
      ),
    ),
  );
}

async function seedGeographies() {
  const geographies = [
    {
      countryCode: "IN",
      countryName: "India",
      active: true,
      states: [
        {
          stateCode: "KA",
          stateName: "Karnataka",
          cities: ["Bengaluru", "Mysuru", "Mangalore"],
        },
        {
          stateCode: "MH",
          stateName: "Maharashtra",
          cities: ["Mumbai", "Pune", "Nagpur"],
        },
      ],
    },
    {
      countryCode: "US",
      countryName: "United States",
      active: true,
      states: [
        {
          stateCode: "CA",
          stateName: "California",
          cities: ["Los Angeles", "San Francisco", "San Diego"],
        },
        {
          stateCode: "NY",
          stateName: "New York",
          cities: ["New York", "Buffalo", "Rochester"],
        },
      ],
    },
  ];

  await Promise.all(
    geographies.map((geo) =>
      GeographyModel.findOneAndUpdate(
        { countryCode: geo.countryCode },
        { $set: geo },
        { upsert: true, new: true },
      ),
    ),
  );
}

async function main() {
  await connectMongo();
  await seedCategories();
  await seedHsnCodes();
  await seedGeographies();
  process.stdout.write("Platform metadata seed completed\n");
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`Platform metadata seed failed: ${error.stack || error.message}\n`);
  process.exit(1);
});
