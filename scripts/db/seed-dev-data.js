#!/usr/bin/env node
'use strict';

const { v4: uuidv4 } = require('uuid');
const { connectMongo } = require('../../src/infrastructure/mongo/mongo-client');
const { postgresPool } = require('../../src/infrastructure/postgres/postgres-client');
const { UserModel } = require('../../src/modules/user/models/user.model');
const { ProductModel } = require('../../src/modules/product/models/product.model');
const { CartModel } = require('../../src/modules/cart/models/cart.model');
const { CategoryTreeModel } = require('../../src/modules/platform/models/category-tree.model');
const { ContentPageModel } = require('../../src/modules/platform/models/content-page.model');
const { ProductFamilyModel } = require('../../src/modules/platform/models/product-family.model');
const { ProductVariantModel } = require('../../src/modules/platform/models/product-variant.model');
const { ProductReviewModel } = require('../../src/modules/platform/models/product-review.model');
const { HsnCodeModel } = require('../../src/modules/platform/models/hsn-code.model');
const { GeographyModel } = require('../../src/modules/platform/models/geography.model');
const {
  AdminCountryModel,
  AdminStateModel,
  AdminCityModel,
  AdminTaxModel,
  AdminSubTaxModel,
  AdminTaxRuleModel,
} = require('../../src/modules/admin/models/common-management.model');
const { PlatformBrandModel } = require('../../src/modules/platform/models/platform-brand.model');
const { WarrantyTemplateModel } = require('../../src/modules/platform/models/warranty-template.model');
const { PlatformFinishModel } = require('../../src/modules/platform/models/platform-finish.model');
const { PlatformDimensionModel } = require('../../src/modules/platform/models/platform-dimension.model');
const { PlatformBatchModel } = require('../../src/modules/platform/models/platform-batch.model');
const { PlatformProductOptionModel } = require('../../src/modules/platform/models/platform-product-option.model');
const { PlatformProductOptionValueModel } = require('../../src/modules/platform/models/platform-product-option-value.model');
const { LoyaltyModel } = require('../../src/modules/loyalty/models/loyalty.model');
const { RecommendationModel } = require('../../src/modules/recommendation/models/recommendation.model');
const { DynamicPricingModel } = require('../../src/modules/pricing/models/dynamic-pricing.model');
const { ReturnModel } = require('../../src/modules/returns/models/return.model');
const { FraudDetectionModel } = require('../../src/modules/fraud/models/fraud-detection.model');
const { NotificationPreferenceModel } = require('../../src/modules/notification/models/notification-preference.model');
const { hashText } = require('../../src/shared/tools/hash');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function upsertUser(email, payload) {
  return UserModel.findOneAndUpdate(
    { email },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertProduct(slugKey, payload) {
  return ProductModel.findOneAndUpdate(
    { slug: slugKey },
    { $setOnInsert: payload },
    { upsert: true, new: true },
  );
}

async function pgTableExists(tableName) {
  const result = await postgresPool.query('SELECT to_regclass($1) AS r', [tableName]);
  return Boolean(result.rows[0]?.r);
}

// ─── 1. Users ─────────────────────────────────────────────────────────────────

async function seedUsers(passwordHash) {
  // Platform admin
  const admin = await upsertUser('admin@example.com', {
    email: 'admin@example.com',
    phone: '9000000001',
    passwordHash,
    role: 'admin',
    accountStatus: 'active',
    emailVerified: true,
    profile: { firstName: 'Platform', lastName: 'Admin' },
    referralCode: 'ADMIN001',
  });

  // Sub-admin
  const subAdmin = await upsertUser('subadmin@example.com', {
    email: 'subadmin@example.com',
    phone: '9000000002',
    passwordHash,
    role: 'sub-admin',
    accountStatus: 'active',
    emailVerified: true,
    profile: { firstName: 'Sub', lastName: 'Admin' },
    allowedModules: ['products', 'orders', 'users', 'returns', 'sellers'],
    referralCode: 'SUBADM01',
  });

  // Seller 1 — TechMart India (Electronics)
  const seller1 = await upsertUser('techmart@example.com', {
    email: 'techmart@example.com',
    phone: '9000000010',
    passwordHash,
    role: 'seller',
    accountStatus: 'active',
    emailVerified: true,
    profile: { firstName: 'Rajesh', lastName: 'Mehta' },
    referralCode: 'TECHMT01',
    sellerProfile: {
      displayName: 'TechMart India',
      legalBusinessName: 'TechMart India Pvt Ltd',
      businessName: 'TechMart India',
      supportEmail: 'support@techmart.in',
      supportPhone: '9000000010',
      businessType: 'private_limited',
      gstNumber: '27AABCT1234A1Z5',
      panNumber: 'AABCT1234A',
      kycStatus: 'verified',
      bankVerificationStatus: 'verified',
      goLiveStatus: 'live',
      onboardingStatus: 'live',
      profileCompleted: true,
      onboardingChecklist: {
        profileCompleted: true,
        kycSubmitted: true,
        gstVerified: true,
        bankLinked: true,
        firstProductPublished: true,
      },
      bankDetails: {
        accountHolderName: 'TechMart India Pvt Ltd',
        accountNumber: '50100234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        branchName: 'Andheri West, Mumbai',
        bankVerified: true,
      },
      businessAddress: {
        line1: '401, Technopark, Sector 5',
        line2: 'Navi Mumbai, Maharashtra',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400614',
      },
      pickupAddress: {
        line1: '401, Technopark, Sector 5',
        line2: 'Navi Mumbai, Maharashtra',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400614',
        contactName: 'Rajesh Mehta',
        contactPhone: '9000000010',
      },
    },
  });

  // Seller 2 — FashionHub (Clothing / Fashion)
  const seller2 = await upsertUser('fashionhub@example.com', {
    email: 'fashionhub@example.com',
    phone: '9000000011',
    passwordHash,
    role: 'seller',
    accountStatus: 'active',
    emailVerified: true,
    profile: { firstName: 'Priya', lastName: 'Sharma' },
    referralCode: 'FASHUB01',
    sellerProfile: {
      displayName: 'FashionHub',
      legalBusinessName: 'FashionHub Retail LLP',
      businessName: 'FashionHub',
      supportEmail: 'care@fashionhub.in',
      supportPhone: '9000000011',
      businessType: 'llp',
      gstNumber: '07AAGFF5678B1Z3',
      panNumber: 'AAGFF5678B',
      kycStatus: 'verified',
      bankVerificationStatus: 'verified',
      goLiveStatus: 'live',
      onboardingStatus: 'live',
      profileCompleted: true,
      onboardingChecklist: {
        profileCompleted: true,
        kycSubmitted: true,
        gstVerified: true,
        bankLinked: true,
        firstProductPublished: true,
      },
      bankDetails: {
        accountHolderName: 'FashionHub Retail LLP',
        accountNumber: '00112233445566',
        ifscCode: 'ICIC0002345',
        bankName: 'ICICI Bank',
        branchName: 'Connaught Place, Delhi',
        bankVerified: true,
      },
      businessAddress: {
        line1: 'B-12, Lajpat Nagar Market',
        line2: '',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        postalCode: '110024',
      },
      pickupAddress: {
        line1: 'B-12, Lajpat Nagar Market',
        line2: '',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        postalCode: '110024',
        contactName: 'Priya Sharma',
        contactPhone: '9000000011',
      },
    },
  });

  // Seller 3 — BookWorld (Books / Digital content)
  const seller3 = await upsertUser('bookworld@example.com', {
    email: 'bookworld@example.com',
    phone: '9000000012',
    passwordHash,
    role: 'seller',
    accountStatus: 'active',
    emailVerified: true,
    profile: { firstName: 'Ankit', lastName: 'Joshi' },
    referralCode: 'BKWRLD01',
    sellerProfile: {
      displayName: 'BookWorld',
      legalBusinessName: 'BookWorld Digital Pvt Ltd',
      businessName: 'BookWorld',
      supportEmail: 'hello@bookworld.in',
      supportPhone: '9000000012',
      businessType: 'private_limited',
      gstNumber: '29AABCB9012C1Z8',
      panNumber: 'AABCB9012C',
      kycStatus: 'verified',
      bankVerificationStatus: 'verified',
      goLiveStatus: 'live',
      onboardingStatus: 'live',
      profileCompleted: true,
      onboardingChecklist: {
        profileCompleted: true,
        kycSubmitted: true,
        gstVerified: true,
        bankLinked: true,
        firstProductPublished: true,
      },
      bankDetails: {
        accountHolderName: 'BookWorld Digital Pvt Ltd',
        accountNumber: '39001122334455',
        ifscCode: 'SBIN0040521',
        bankName: 'State Bank of India',
        branchName: 'Koramangala, Bengaluru',
        bankVerified: true,
      },
      businessAddress: {
        line1: '14, 5th Cross, Koramangala 4th Block',
        line2: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560034',
      },
      pickupAddress: {
        line1: '14, 5th Cross, Koramangala 4th Block',
        line2: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560034',
        contactName: 'Ankit Joshi',
        contactPhone: '9000000012',
      },
    },
  });

  // Seller 4 — FitZone (Sports & Fitness)
  const seller4 = await upsertUser('fitzone@example.com', {
    email: 'fitzone@example.com',
    phone: '9000000013',
    passwordHash,
    role: 'seller',
    accountStatus: 'active',
    emailVerified: true,
    profile: { firstName: 'Vikram', lastName: 'Singh' },
    referralCode: 'FITZONE1',
    sellerProfile: {
      displayName: 'FitZone',
      legalBusinessName: 'FitZone Sports India Pvt Ltd',
      businessName: 'FitZone',
      supportEmail: 'support@fitzone.in',
      supportPhone: '9000000013',
      businessType: 'private_limited',
      gstNumber: '24AACFS3456D1Z2',
      panNumber: 'AACFS3456D',
      kycStatus: 'verified',
      bankVerificationStatus: 'verified',
      goLiveStatus: 'live',
      onboardingStatus: 'live',
      profileCompleted: true,
      onboardingChecklist: {
        profileCompleted: true,
        kycSubmitted: true,
        gstVerified: true,
        bankLinked: true,
        firstProductPublished: true,
      },
      bankDetails: {
        accountHolderName: 'FitZone Sports India Pvt Ltd',
        accountNumber: '67891234567890',
        ifscCode: 'AXIS0004321',
        bankName: 'Axis Bank',
        branchName: 'Ahmedabad, Gujarat',
        bankVerified: true,
      },
      businessAddress: {
        line1: 'Plot 22, GIDC Industrial Estate',
        line2: 'Vatva Phase 2',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        postalCode: '382445',
      },
      pickupAddress: {
        line1: 'Plot 22, GIDC Industrial Estate',
        line2: 'Vatva Phase 2',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        postalCode: '382445',
        contactName: 'Vikram Singh',
        contactPhone: '9000000013',
      },
    },
  });

  // Buyers
  const buyer1 = await upsertUser('buyer1@example.com', {
    email: 'buyer1@example.com',
    phone: '9100000001',
    passwordHash,
    role: 'buyer',
    accountStatus: 'active',
    emailVerified: true,
    profile: { firstName: 'Amit', lastName: 'Kumar' },
    referralCode: 'AMTKUM01',
  });

  const buyer2 = await upsertUser('buyer2@example.com', {
    email: 'buyer2@example.com',
    phone: '9100000002',
    passwordHash,
    role: 'buyer',
    accountStatus: 'active',
    emailVerified: true,
    profile: { firstName: 'Sunita', lastName: 'Rao' },
    referralCode: 'SUNRAO01',
  });

  console.log('✓ Seeded users: 1 admin, 1 sub-admin, 4 sellers, 2 buyers');
  return { admin, subAdmin, seller1, seller2, seller3, seller4, buyer1, buyer2 };
}

// ─── 2. Categories ────────────────────────────────────────────────────────────

async function seedCategories() {
  const categoryImageMap = {
    electronics: '/image/png/Electronics.png',
    fashion: '/image/png/Fashion.png',
    'home-kitchen': '/image/png/Home.png',
    books: '/image/png/ForYou.png',
    'sports-fitness': '/image/png/SportsFitness.png',
    beauty: '/image/png/Beauty.png',
    grocery: '/image/png/FoodHealth.png',
    mobiles: '/image/png/Mobiles.png',
    laptops: '/image/jpg/productImg1.jpg',
    audio: '/image/jpg/productImg2.jpg',
    televisions: '/image/jpg/productImg3.jpg',
    'mens-clothing': '/image/png/men-fashion.png',
    'womens-clothing': '/image/jpg/stylish-girls.jpg',
    footwear: '/image/png/stylish-pair.png',
    jewellery: '/image/png/Ring.png',
    'home-decor': '/image/jpg/home-decor.jpg',
    furniture: '/image/png/Furniture.png',
    'kitchen-appliances': '/image/png/Appliances.png',
    skincare: '/image/png/Perfume.png',
    haircare: '/image/png/SprayBottle.png',
    beverages: '/image/png/FoodHealth.png',
  };

  const categories = [
    // Electronics
    { categoryKey: 'electronics', title: 'Electronics', parentKey: null, level: 0, sortOrder: 1,
      attributesSchema: { brand: 'string', color: 'string', warrantyMonths: 'number' } },
    { categoryKey: 'mobiles', title: 'Mobiles & Smartphones', parentKey: 'electronics', level: 1, sortOrder: 1,
      attributesSchema: { brand: 'string', ram: 'string', storage: 'string', batteryMah: 'number', network: 'string', color: 'string', operatingSystem: 'string' } },
    { categoryKey: 'laptops', title: 'Laptops', parentKey: 'electronics', level: 1, sortOrder: 2,
      attributesSchema: { brand: 'string', processor: 'string', ram: 'string', storage: 'string', screenSize: 'string', os: 'string', graphicsCard: 'string' } },
    { categoryKey: 'tablets', title: 'Tablets', parentKey: 'electronics', level: 1, sortOrder: 3,
      attributesSchema: { brand: 'string', ram: 'string', storage: 'string', screenSize: 'string', connectivity: 'string' } },
    { categoryKey: 'cameras', title: 'Cameras & Photography', parentKey: 'electronics', level: 1, sortOrder: 4,
      attributesSchema: { brand: 'string', megapixels: 'number', sensorType: 'string', videoResolution: 'string' } },
    { categoryKey: 'audio', title: 'Audio & Headphones', parentKey: 'electronics', level: 1, sortOrder: 5,
      attributesSchema: { brand: 'string', type: 'string', connectivity: 'string', noiseCancellation: 'boolean', driverSize: 'string' } },
    { categoryKey: 'accessories', title: 'Computer Accessories', parentKey: 'electronics', level: 1, sortOrder: 6,
      attributesSchema: { brand: 'string', compatibility: 'string', connectivity: 'string', color: 'string' } },
    { categoryKey: 'televisions', title: 'Televisions', parentKey: 'electronics', level: 1, sortOrder: 7,
      attributesSchema: { brand: 'string', screenSize: 'string', resolution: 'string', smartTv: 'boolean', panelType: 'string' } },

    // Fashion
    { categoryKey: 'fashion', title: 'Fashion', parentKey: null, level: 0, sortOrder: 2,
      attributesSchema: { brand: 'string', size: 'string', color: 'string', material: 'string' } },
    { categoryKey: 'mens-clothing', title: "Men's Clothing", parentKey: 'fashion', level: 1, sortOrder: 1,
      attributesSchema: { brand: 'string', size: 'string', color: 'string', material: 'string', fit: 'string', occasion: 'string' } },
    { categoryKey: 'womens-clothing', title: "Women's Clothing", parentKey: 'fashion', level: 1, sortOrder: 2,
      attributesSchema: { brand: 'string', size: 'string', color: 'string', material: 'string', pattern: 'string', occasion: 'string' } },
    { categoryKey: 'footwear', title: 'Footwear', parentKey: 'fashion', level: 1, sortOrder: 3,
      attributesSchema: { brand: 'string', size: 'string', color: 'string', material: 'string', closure: 'string', soleMaterial: 'string' } },
    { categoryKey: 'handbags', title: 'Handbags & Wallets', parentKey: 'fashion', level: 1, sortOrder: 4,
      attributesSchema: { brand: 'string', color: 'string', material: 'string', compartments: 'number' } },
    { categoryKey: 'jewellery', title: 'Jewellery', parentKey: 'fashion', level: 1, sortOrder: 5,
      attributesSchema: { brand: 'string', material: 'string', gemstone: 'string', purity: 'string' } },

    // Home & Kitchen
    { categoryKey: 'home-kitchen', title: 'Home & Kitchen', parentKey: null, level: 0, sortOrder: 3,
      attributesSchema: { brand: 'string', material: 'string', color: 'string', warrantyMonths: 'number' } },
    { categoryKey: 'kitchen-appliances', title: 'Kitchen Appliances', parentKey: 'home-kitchen', level: 1, sortOrder: 1,
      attributesSchema: { brand: 'string', wattage: 'number', capacity: 'string', material: 'string', color: 'string', warrantyMonths: 'number' } },
    { categoryKey: 'cookware', title: 'Cookware & Bakeware', parentKey: 'home-kitchen', level: 1, sortOrder: 2,
      attributesSchema: { brand: 'string', material: 'string', capacity: 'string', inductionCompatible: 'boolean', coatingType: 'string' } },
    { categoryKey: 'furniture', title: 'Furniture', parentKey: 'home-kitchen', level: 1, sortOrder: 3,
      attributesSchema: { brand: 'string', material: 'string', color: 'string', assemblyRequired: 'boolean', dimensions: 'string' } },
    { categoryKey: 'home-decor', title: 'Home Decor', parentKey: 'home-kitchen', level: 1, sortOrder: 4,
      attributesSchema: { brand: 'string', material: 'string', color: 'string', style: 'string' } },

    // Books & Education
    { categoryKey: 'books', title: 'Books & Education', parentKey: null, level: 0, sortOrder: 4,
      attributesSchema: { author: 'string', publisher: 'string', language: 'string', isbn: 'string', edition: 'string', format: 'string' } },
    { categoryKey: 'tech-books', title: 'Technology & Programming', parentKey: 'books', level: 1, sortOrder: 1,
      attributesSchema: { author: 'string', publisher: 'string', language: 'string', isbn: 'string', programmingLanguage: 'string', edition: 'string' } },
    { categoryKey: 'fiction', title: 'Fiction & Literature', parentKey: 'books', level: 1, sortOrder: 2,
      attributesSchema: { author: 'string', publisher: 'string', language: 'string', isbn: 'string', genre: 'string' } },
    { categoryKey: 'academic', title: 'Academic & Reference', parentKey: 'books', level: 1, sortOrder: 3,
      attributesSchema: { author: 'string', publisher: 'string', subject: 'string', grade: 'string', edition: 'string' } },
    { categoryKey: 'digital-courses', title: 'Online Courses & E-Learning', parentKey: 'books', level: 1, sortOrder: 4,
      attributesSchema: { instructor: 'string', duration: 'string', level: 'string', language: 'string', certificate: 'boolean' } },

    // Sports & Fitness
    { categoryKey: 'sports-fitness', title: 'Sports & Fitness', parentKey: null, level: 0, sortOrder: 5,
      attributesSchema: { brand: 'string', sportType: 'string', size: 'string', material: 'string' } },
    { categoryKey: 'exercise-equipment', title: 'Exercise Equipment', parentKey: 'sports-fitness', level: 1, sortOrder: 1,
      attributesSchema: { brand: 'string', type: 'string', weightKg: 'number', material: 'string', maxWeightCapacity: 'number' } },
    { categoryKey: 'sportswear', title: 'Sportswear & Activewear', parentKey: 'sports-fitness', level: 1, sortOrder: 2,
      attributesSchema: { brand: 'string', size: 'string', color: 'string', material: 'string', sport: 'string', gender: 'string' } },
    { categoryKey: 'nutrition', title: 'Nutrition & Supplements', parentKey: 'sports-fitness', level: 1, sortOrder: 3,
      attributesSchema: { brand: 'string', flavour: 'string', weightGrams: 'number', servings: 'number', protein: 'string', formType: 'string' } },

    // Beauty & Personal Care
    { categoryKey: 'beauty', title: 'Beauty & Personal Care', parentKey: null, level: 0, sortOrder: 6,
      attributesSchema: { brand: 'string', skinType: 'string', volume: 'string', expiryMonths: 'number' } },
    { categoryKey: 'skincare', title: 'Skincare', parentKey: 'beauty', level: 1, sortOrder: 1,
      attributesSchema: { brand: 'string', skinType: 'string', volume: 'string', ingredients: 'string', spf: 'number' } },
    { categoryKey: 'haircare', title: 'Hair Care', parentKey: 'beauty', level: 1, sortOrder: 2,
      attributesSchema: { brand: 'string', hairType: 'string', volume: 'string', type: 'string' } },

    // Grocery
    { categoryKey: 'grocery', title: 'Grocery & Food', parentKey: null, level: 0, sortOrder: 7,
      attributesSchema: { brand: 'string', weight: 'string', packSize: 'string', organic: 'boolean', expiryDate: 'date' } },
    { categoryKey: 'packaged-foods', title: 'Packaged Foods', parentKey: 'grocery', level: 1, sortOrder: 1,
      attributesSchema: { brand: 'string', weight: 'string', packSize: 'string', vegan: 'boolean', glutenFree: 'boolean' } },
    { categoryKey: 'beverages', title: 'Beverages', parentKey: 'grocery', level: 1, sortOrder: 2,
      attributesSchema: { brand: 'string', volume: 'string', flavour: 'string', caffeinated: 'boolean' } },
  ];

  await Promise.all(categories.map((cat) =>
    CategoryTreeModel.findOneAndUpdate(
      { categoryKey: cat.categoryKey },
      {
        $set: {
          ...cat,
          active: true,
          imageUrl: categoryImageMap[cat.categoryKey] || categoryImageMap[cat.parentKey] || '',
          bannerUrl: categoryImageMap[cat.categoryKey] || categoryImageMap[cat.parentKey] || '',
          iconUrl: categoryImageMap[cat.categoryKey] || categoryImageMap[cat.parentKey] || '',
        },
      },
      { upsert: true, new: true },
    ),
  ));

  console.log(`✓ Seeded ${categories.length} categories`);
  return categories;
}

// ─── 3. HSN Codes ─────────────────────────────────────────────────────────────

async function seedHsnCodes() {
  const codes = [
    { code: '8517', description: 'Telephone sets, smartphones', gstRate: 18, cessRate: 0, category: 'mobiles' },
    { code: '8471', description: 'Automatic data processing machines (laptops, tablets)', gstRate: 18, cessRate: 0, category: 'laptops' },
    { code: '8518', description: 'Microphones, headphones, audio equipment', gstRate: 18, cessRate: 0, category: 'audio' },
    { code: '8525', description: 'Digital cameras, camcorders', gstRate: 18, cessRate: 0, category: 'cameras' },
    { code: '8528', description: 'Television receivers, monitors', gstRate: 28, cessRate: 0, category: 'televisions' },
    { code: '6109', description: 'T-shirts, singlets, other vests', gstRate: 12, cessRate: 0, category: 'mens-clothing' },
    { code: '6203', description: "Men's suits, jackets, trousers, jeans", gstRate: 12, cessRate: 0, category: 'mens-clothing' },
    { code: '6204', description: "Women's suits, jackets, dresses", gstRate: 12, cessRate: 0, category: 'womens-clothing' },
    { code: '6403', description: 'Footwear with outer soles and uppers of rubber/plastics', gstRate: 18, cessRate: 0, category: 'footwear' },
    { code: '8516', description: 'Electric water heaters, hair dryers, kitchen appliances', gstRate: 18, cessRate: 0, category: 'kitchen-appliances' },
    { code: '7323', description: 'Table, kitchen or other household articles of iron or steel (cookware)', gstRate: 12, cessRate: 0, category: 'cookware' },
    { code: '4901', description: 'Printed books, brochures, leaflets', gstRate: 0, cessRate: 0, category: 'books' },
    { code: '4903', description: "Children's picture, drawing or colouring books", gstRate: 0, cessRate: 0, category: 'books' },
    { code: '9506', description: 'Articles and equipment for sports, gymnastics, athletics', gstRate: 12, cessRate: 0, category: 'sports-fitness' },
    { code: '2106', description: 'Food preparations, protein supplements', gstRate: 18, cessRate: 0, category: 'nutrition' },
    { code: '3304', description: 'Beauty preparations for skin-care, sunscreen, cosmetics', gstRate: 18, cessRate: 0, category: 'beauty' },
    { code: '8543', description: 'Electrical machines — USB hubs, docking stations, accessories', gstRate: 18, cessRate: 0, category: 'accessories' },
  ];

  await Promise.all(codes.map((item) =>
    HsnCodeModel.findOneAndUpdate(
      { code: item.code },
      { $set: { ...item, taxType: 'gst', exempt: item.gstRate === 0, active: true } },
      { upsert: true, new: true },
    ),
  ));

  console.log(`✓ Seeded ${codes.length} HSN codes`);
}

// ─── 4. Geography ─────────────────────────────────────────────────────────────

async function seedGeographies() {
  const geos = [
    {
      countryCode: 'IN', countryName: 'India', active: true,
      states: [
        { stateCode: 'MH', stateName: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad', 'Nashik'] },
        { stateCode: 'KA', stateName: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'] },
        { stateCode: 'TN', stateName: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Salem'] },
        { stateCode: 'DL', stateName: 'Delhi', cities: ['New Delhi', 'Dwarka', 'Rohini', 'Saket'] },
        { stateCode: 'GJ', stateName: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'] },
        { stateCode: 'UP', stateName: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi'] },
        { stateCode: 'RJ', stateName: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'] },
        { stateCode: 'WB', stateName: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur'] },
        { stateCode: 'TS', stateName: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad'] },
        { stateCode: 'PB', stateName: 'Punjab', cities: ['Chandigarh', 'Ludhiana', 'Amritsar'] },
      ],
    },
    {
      countryCode: 'US', countryName: 'United States', active: true,
      states: [
        { stateCode: 'CA', stateName: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'] },
        { stateCode: 'NY', stateName: 'New York', cities: ['New York City', 'Buffalo', 'Rochester'] },
        { stateCode: 'TX', stateName: 'Texas', cities: ['Houston', 'Dallas', 'Austin', 'San Antonio'] },
      ],
    },
  ];

  await Promise.all(geos.map((geo) =>
    GeographyModel.findOneAndUpdate(
      { countryCode: geo.countryCode },
      { $set: geo },
      { upsert: true, new: true },
    ),
  ));

  console.log(`✓ Seeded ${geos.length} geographies`);
}

// ─── 4A. Admin Common Management ─────────────────────────────────────────────

async function seedAdminCommonManagement() {
  const countrySeed = [
    { name: 'India', code: 'IN', dialCode: '+91', active: true },
    { name: 'United States', code: 'US', dialCode: '+1', active: true },
    { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', active: true },
  ];

  const countries = {};
  for (const entry of countrySeed) {
    const doc = await AdminCountryModel.findOneAndUpdate(
      { code: entry.code },
      { $set: entry },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    countries[entry.code] = doc;
  }

  const stateSeed = [
    { name: 'Maharashtra', countryCode: 'IN' },
    { name: 'Karnataka', countryCode: 'IN' },
    { name: 'Delhi', countryCode: 'IN' },
    { name: 'California', countryCode: 'US' },
    { name: 'New York', countryCode: 'US' },
    { name: 'Dubai', countryCode: 'AE' },
  ];

  const states = {};
  for (const entry of stateSeed) {
    const country = countries[entry.countryCode];
    if (!country) continue;
    const doc = await AdminStateModel.findOneAndUpdate(
      { countryId: country._id, name: entry.name },
      { $set: { name: entry.name, countryId: country._id, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    states[`${entry.countryCode}:${entry.name}`] = doc;
  }

  const citySeed = [
    { name: 'Mumbai', stateKey: 'IN:Maharashtra' },
    { name: 'Pune', stateKey: 'IN:Maharashtra' },
    { name: 'Bengaluru', stateKey: 'IN:Karnataka' },
    { name: 'Mysuru', stateKey: 'IN:Karnataka' },
    { name: 'New Delhi', stateKey: 'IN:Delhi' },
    { name: 'Los Angeles', stateKey: 'US:California' },
    { name: 'San Francisco', stateKey: 'US:California' },
    { name: 'New York City', stateKey: 'US:New York' },
    { name: 'Dubai City', stateKey: 'AE:Dubai' },
  ];

  for (const entry of citySeed) {
    const state = states[entry.stateKey];
    if (!state) continue;
    await AdminCityModel.findOneAndUpdate(
      { stateId: state._id, name: entry.name },
      { $set: { name: entry.name, stateId: state._id, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const taxSeed = [
    { name: 'GST', countryCode: 'IN' },
    { name: 'Sales Tax', countryCode: 'US' },
    { name: 'VAT', countryCode: 'AE' },
  ];

  const taxes = {};
  for (const entry of taxSeed) {
    const country = countries[entry.countryCode];
    const doc = await AdminTaxModel.findOneAndUpdate(
      { name: entry.name },
      { $set: { name: entry.name, countryId: country?._id || null, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    taxes[entry.name] = doc;
  }

  const subTaxSeed = [
    { taxName: 'GST', name: 'CGST', percentage: 9 },
    { taxName: 'GST', name: 'SGST', percentage: 9 },
    { taxName: 'GST', name: 'IGST', percentage: 18 },
    { taxName: 'Sales Tax', name: 'State Sales Tax', percentage: 7.5 },
    { taxName: 'VAT', name: 'Standard VAT', percentage: 5 },
  ];

  const subTaxesByTax = {};
  for (const entry of subTaxSeed) {
    const tax = taxes[entry.taxName];
    if (!tax) continue;
    const doc = await AdminSubTaxModel.findOneAndUpdate(
      { taxId: tax._id, name: entry.name },
      { $set: { taxId: tax._id, name: entry.name, percentage: entry.percentage, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (!subTaxesByTax[entry.taxName]) subTaxesByTax[entry.taxName] = [];
    subTaxesByTax[entry.taxName].push(doc);
  }

  const taxRuleSeed = [
    {
      description: 'Electronics tax rule (India)',
      taxName: 'GST',
      category: 'electronics',
      subTaxNames: ['CGST', 'SGST'],
      metadata: { source: 'seed', priority: 1 },
    },
    {
      description: 'Fashion tax rule (India)',
      taxName: 'GST',
      category: 'fashion',
      subTaxNames: ['CGST', 'SGST'],
      metadata: { source: 'seed', priority: 2 },
    },
    {
      description: 'US standard sales tax rule',
      taxName: 'Sales Tax',
      category: 'general',
      subTaxNames: ['State Sales Tax'],
      metadata: { source: 'seed', priority: 1 },
    },
  ];

  for (const entry of taxRuleSeed) {
    const tax = taxes[entry.taxName];
    if (!tax) continue;
    const candidates = subTaxesByTax[entry.taxName] || [];
    const subTaxIds = candidates
      .filter((item) => entry.subTaxNames.includes(item.name))
      .map((item) => item._id);

    await AdminTaxRuleModel.findOneAndUpdate(
      { description: entry.description, taxId: tax._id },
      {
        $set: {
          description: entry.description,
          taxId: tax._id,
          subTaxIds,
          category: entry.category,
          metadata: entry.metadata || {},
          active: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  console.log('✓ Seeded admin common management: countries, states, cities, taxes, sub taxes, tax rules');
}

// ─── 4B. Platform Management ─────────────────────────────────────────────────

async function seedPlatformManagement() {
  const brandSeed = [
    { name: 'Samsung', logo: '/assets/brands/samsung.png', thumbnails: '/assets/brands/samsung-thumb.png', active: true, sortOrder: 1 },
    { name: 'Dell', logo: '/assets/brands/dell.png', thumbnails: '/assets/brands/dell-thumb.png', active: true, sortOrder: 2 },
    { name: 'Nike', logo: '/assets/brands/nike.png', thumbnails: '/assets/brands/nike-thumb.png', active: true, sortOrder: 3 },
  ];
  for (const entry of brandSeed) {
    await PlatformBrandModel.findOneAndUpdate(
      { name: entry.name },
      { $set: entry },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const warrantySeed = [
    { period: '6 Months', active: true, metadata: { type: 'limited' } },
    { period: '12 Months', active: true, metadata: { type: 'manufacturer' } },
    { period: '24 Months', active: true, metadata: { type: 'extended' } },
  ];
  for (const entry of warrantySeed) {
    await WarrantyTemplateModel.findOneAndUpdate(
      { period: entry.period },
      { $set: entry },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const finishSeed = ['Matte', 'Glossy', 'Satin', 'Textured'];
  for (const name of finishSeed) {
    await PlatformFinishModel.findOneAndUpdate(
      { name },
      { $set: { name, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const dimensionSeed = ['10x10x10 cm', '25x15x5 cm', '40x30x20 cm'];
  for (const dimensions_value of dimensionSeed) {
    await PlatformDimensionModel.findOneAndUpdate(
      { dimensions_value },
      { $set: { dimensions_value, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const now = Date.now();
  const batchSeed = [
    { batchCode: 'BATCH-2026-001', manufactureDate: now - 60 * 24 * 3600 * 1000, expiryDate: now + 365 * 24 * 3600 * 1000, active: true },
    { batchCode: 'BATCH-2026-002', manufactureDate: now - 30 * 24 * 3600 * 1000, expiryDate: now + 400 * 24 * 3600 * 1000, active: true },
  ];
  for (const entry of batchSeed) {
    await PlatformBatchModel.findOneAndUpdate(
      { batchCode: entry.batchCode },
      { $set: entry },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  const optionSeed = [
    { name: 'Color', values: ['Black', 'White', 'Blue'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
    { name: 'Storage', values: ['64GB', '128GB', '256GB'] },
  ];

  for (const optionEntry of optionSeed) {
    const option = await PlatformProductOptionModel.findOneAndUpdate(
      { name: optionEntry.name },
      { $set: { name: optionEntry.name, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    for (const valueName of optionEntry.values) {
      await PlatformProductOptionValueModel.findOneAndUpdate(
        { option_id: String(option._id), name: valueName },
        { $set: { option_id: String(option._id), name: valueName, active: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  }

  console.log('✓ Seeded platform management: brands, warranty templates, finishes, dimensions, batches, product options');
}

// ─── 5. CMS Content ───────────────────────────────────────────────────────────

async function seedCmsContent() {
  const publishedAt = new Date('2026-01-01T00:00:00.000Z');
  const pages = [
    { slug: 'privacy-policy', title: 'Privacy Policy', pageType: 'legal',
      body: '# Privacy Policy\n\nWe collect information needed to create accounts, process orders, prevent fraud, provide support, and improve the shopping experience. Customer profile, address, payment status, device, and order data are used only for platform operations, compliance, safety, and service communication. Users can request access, correction, or deletion of personal data by contacting support.',
      metadata: { footerGroup: 'legal', seoTitle: 'Privacy Policy', version: '1.0' } },
    { slug: 'terms-and-conditions', title: 'Terms and Conditions', pageType: 'legal',
      body: '# Terms and Conditions\n\nBy using the platform, buyers and sellers agree to follow marketplace policies, provide accurate information, and use the service lawfully. Orders, cancellations, returns, seller payouts, and account actions are governed by the published platform rules.',
      metadata: { footerGroup: 'legal', seoTitle: 'Terms and Conditions', version: '1.0' } },
    { slug: 'shipping-policy', title: 'Shipping Policy', pageType: 'legal',
      body: '# Shipping Policy\n\nDelivery availability, fees, COD, and estimated dates depend on seller location, buyer pincode, item weight, and carrier coverage. Customers can track shipment status from their order page after dispatch.',
      metadata: { footerGroup: 'help', seoTitle: 'Shipping Policy', version: '1.0' } },
    { slug: 'return-refund-policy', title: 'Return and Refund Policy', pageType: 'legal',
      body: '# Return and Refund Policy\n\nEligible products can be returned within the listed return window when the item is damaged, defective, or incorrect. Refunds are processed to the original payment method or wallet after review and approval.',
      metadata: { footerGroup: 'help', seoTitle: 'Return and Refund Policy', version: '1.0' } },
    { slug: 'about-us', title: 'About Us', pageType: 'company',
      body: 'A modern ecommerce marketplace connecting trusted sellers with customers through secure payments, clear order tracking, and reliable support.',
      metadata: { footerGroup: 'company', seoTitle: 'About Us' } },
    { slug: 'contact-us', title: 'Contact Us', pageType: 'company',
      body: 'For support, orders, seller onboarding, or account help, contact the support team from the help section in your account.',
      metadata: { footerGroup: 'company', email: 'support@example.com', phone: '+91-9999999999', supportHours: '10:00 AM – 7:00 PM IST' } },
    { slug: 'faq', title: 'FAQs', pageType: 'faq',
      body: '# Frequently Asked Questions\n\n## How do I track an order?\nOpen your account orders page and select the order to view the latest delivery status.\n\n## How do returns work?\nEligible products can be returned from the order details page within the listed return window.\n\n## How do I become a seller?\nCreate a seller account, complete profile and KYC, then wait for marketplace review.',
      metadata: { footerGroup: 'help', seoTitle: 'FAQs', categories: ['orders', 'returns', 'seller', 'account'] } },
    { slug: 'help-and-support', title: 'Help and Support', pageType: 'help',
      body: 'Find help for orders, payments, returns, seller onboarding, account access, and marketplace policies.',
      metadata: { footerGroup: 'help', seoTitle: 'Help and Support', contactCta: '/support' } },
    { slug: 'home-hero-banner', title: 'Home Hero Banner', pageType: 'banner',
      body: 'Featured hero banner for the home page.',
      metadata: { placement: 'home.hero', headline: 'Big savings on everyday essentials', subtitle: 'Shop electronics, fashion, home, beauty, grocery and more.', ctaLabel: 'Shop Now', ctaUrl: '/products', backgroundColor: '#0f766e', textColor: '#ffffff', active: true, sortOrder: 1 } },
    { slug: 'electronics-sale-banner', title: 'Electronics Sale Banner', pageType: 'promotion_banner',
      body: 'Electronics mega sale promotional banner.',
      metadata: { placement: 'promotion.electronics', headline: 'Electronics Mega Sale — Up to 40% off', subtitle: 'Laptops, smartphones, audio and more at unbeatable prices.', ctaLabel: 'Shop Electronics', ctaUrl: '/categories/electronics', backgroundColor: '#1e40af', textColor: '#ffffff', active: true, sortOrder: 1 } },
    { slug: 'fashion-season-sale', title: 'Fashion Season Sale Banner', pageType: 'promotion_banner',
      body: 'End of season fashion sale banner.',
      metadata: { placement: 'promotion.fashion', headline: 'End of Season Sale — Fashion up to 60% off', subtitle: 'Trendy styles for men, women and kids.', ctaLabel: 'Shop Fashion', ctaUrl: '/categories/fashion', backgroundColor: '#be185d', textColor: '#ffffff', active: true, sortOrder: 2 } },
    { slug: 'seller-growth-banner', title: 'Seller Growth Banner', pageType: 'banner',
      body: 'Seller onboarding and growth banner.',
      metadata: { placement: 'home.seller', headline: 'Start selling with confidence', subtitle: 'Manage catalog, orders, delivery, and payouts from the seller panel.', ctaLabel: 'Become a Seller', ctaUrl: '/seller/register', backgroundColor: '#1d4ed8', textColor: '#ffffff', active: true, sortOrder: 2 } },
    { slug: 'reward-on-purchase-rule-1000', title: 'Reward Rule ₹1000', pageType: 'reward_on_purchase',
      body: 'Reward points for cart threshold.',
      metadata: { minPurchaseAmt: 1000, rewardPoint: 50, active: true } },
    { slug: 'reward-on-purchase-rule-2500', title: 'Reward Rule ₹2500', pageType: 'reward_on_purchase',
      body: 'Reward points for higher cart threshold.',
      metadata: { minPurchaseAmt: 2500, rewardPoint: 140, active: true } },
    { slug: 'ppc-promo-techmart-q2', title: 'TechMart Q2 PPC Boost', pageType: 'ppc_promotion',
      body: 'PPC campaign for electronics category.',
      metadata: { advertiser: 'techmart', seller: 'TechMart India', type: 'Product', cpc: '1.20', budget: '500.00', impressions: 1240, clicks: 87, approved: 'Yes' } },
    { slug: 'ppc-promo-fashionhub-summer', title: 'FashionHub Summer PPC', pageType: 'ppc_promotion',
      body: 'PPC campaign for summer fashion.',
      metadata: { advertiser: 'fashionhub', seller: 'FashionHub', type: 'Banner', cpc: '0.95', budget: '320.00', impressions: 980, clicks: 65, approved: 'Pending' } },
    { slug: 'event-weightage-order-paid', title: 'Order Paid Event Weightage', pageType: 'product_event_weightage',
      body: 'Event score weightage for recommendation model.',
      metadata: { event: 'products order_paid', weightage: 10.0 } },
    { slug: 'event-weightage-time-spent', title: 'Time Spent Event Weightage', pageType: 'product_event_weightage',
      body: 'Event score weightage for recommendation model.',
      metadata: { event: 'products time_spent', weightage: 5.0 } },
    { slug: 'tag-weightage-iphone-15-pro', title: 'Tag Weightage iPhone 15 Pro', pageType: 'recommended_tag_weightage',
      body: 'Custom boost for iPhone related products.',
      metadata: { tag: 'iPhone', product: 'iPhone 15 Pro', systemWeightage: 25.0, customWeightage: 30.0, validTill: '2026-12-31' } },
    { slug: 'tag-weightage-galaxy-s24', title: 'Tag Weightage Galaxy S24', pageType: 'recommended_tag_weightage',
      body: 'Custom boost for Samsung related products.',
      metadata: { tag: 'Samsung', product: 'Galaxy S24 5G', systemWeightage: 18.0, customWeightage: 22.0, validTill: '2026-12-31' } },
    { slug: 'order-status-payment-pending', title: 'Payment Pending', pageType: 'order_status',
      body: 'Awaiting payment confirmation.',
      metadata: { name: 'Payment Pending', priority: 1, code: 'payment_pending', active: true } },
    { slug: 'order-status-packed', title: 'Packed', pageType: 'order_status',
      body: 'Order packed and ready for shipment.',
      metadata: { name: 'Packed', priority: 2, code: 'packed', active: true } },
    { slug: 'order-status-shipped', title: 'Shipped', pageType: 'order_status',
      body: 'Order has been shipped.',
      metadata: { name: 'Shipped', priority: 3, code: 'shipped', active: true } },
    { slug: 'user-transaction-tn-0005418', title: 'Tom Hanks', pageType: 'user_transaction',
      body: 'Order placed wallet debit.',
      metadata: { transactionId: 'TN-0005418', userLabel: 'Tom Hanks (tomhanks@example.com)', type: 'debit', amount: 10335, description: 'Order Placed #O6450151299', status: 'Transaction Completed' } },
    { slug: 'user-transaction-tn-0005419', title: 'Emma Watson', pageType: 'user_transaction',
      body: 'Referral reward credit.',
      metadata: { transactionId: 'TN-0005419', userLabel: 'Emma Watson (emma@example.com)', type: 'credit', amount: 250, description: 'Referral Reward Credited', status: 'Transaction Completed' } },
    { slug: 'footer-links', title: 'Footer Links', pageType: 'footer',
      body: 'Footer navigation groups for the platform.',
      metadata: {
        groups: [
          { title: 'Shop', links: [{ label: 'Electronics', url: '/categories/electronics' }, { label: 'Fashion', url: '/categories/fashion' }, { label: 'Home & Kitchen', url: '/categories/home-kitchen' }, { label: 'Books', url: '/categories/books' }] },
          { title: 'Help', links: [{ label: 'FAQs', url: '/cms/faq' }, { label: 'Shipping Policy', url: '/cms/shipping-policy' }, { label: 'Return Policy', url: '/cms/return-refund-policy' }, { label: 'Contact Us', url: '/cms/contact-us' }] },
          { title: 'Company', links: [{ label: 'About Us', url: '/cms/about-us' }, { label: 'Privacy Policy', url: '/cms/privacy-policy' }, { label: 'Terms & Conditions', url: '/cms/terms-and-conditions' }] },
        ],
        socialLinks: [
          { label: 'Instagram', url: 'https://instagram.com/example' },
          { label: 'Facebook', url: 'https://facebook.com/example' },
          { label: 'X', url: 'https://x.com/example' },
        ],
      } },
  ];

  await Promise.all(pages.map((page) =>
    ContentPageModel.findOneAndUpdate(
      { slug: page.slug },
      { $set: { ...page, language: 'en', published: true, publishedAt } },
      { upsert: true, new: true },
    ),
  ));

  console.log(`✓ Seeded ${pages.length} CMS pages`);
}

// ─── 6. Products ──────────────────────────────────────────────────────────────

async function seedProducts(users) {
  const { seller1, seller2, seller3, seller4 } = users;
  const s1 = String(seller1._id);
  const s2 = String(seller2._id);
  const s3 = String(seller3._id);
  const s4 = String(seller4._id);

  // ── SIMPLE products ──────────────────────────────────────────────────────────

  const laptop = await upsertProduct('techmart-dell-inspiron-15-3520', {
    sellerId: s1,
    title: 'Dell Inspiron 15 3520 Laptop',
    slug: 'techmart-dell-inspiron-15-3520',
    shortDescription: 'Reliable everyday laptop with Intel Core i5, 8GB RAM, 512GB SSD and FHD display.',
    description: 'The Dell Inspiron 15 3520 is a feature-rich laptop designed for everyday productivity and entertainment. Powered by Intel Core i5-1235U processor with 8GB DDR4 RAM and a fast 512GB NVMe SSD, it delivers smooth performance for office tasks, streaming, and light creative work. The 15.6-inch FHD anti-glare display and 8-hour battery make it ideal for students and professionals.',
    productType: 'simple',
    category: 'laptops',
    categoryId: 'laptops',
    brand: 'Dell',
    price: 52999,
    mrp: 62999,
    salePrice: 52999,
    costPrice: 42000,
    gstRate: 18,
    hsnCode: '8471',
    sku: 'DLL-INS15-3520-I5-8-512',
    barcode: '8901234567890',
    stock: 85,
    reservedStock: 5,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-01-15'),
    tags: ['laptop', 'dell', 'inspiron', 'intel', 'windows', 'student laptop', 'office laptop'],
    attributes: new Map([['processor', 'Intel Core i5-1235U'], ['ram', '8GB DDR4'], ['storage', '512GB NVMe SSD'], ['display', '15.6" FHD Anti-Glare'], ['os', 'Windows 11 Home'], ['battery', '41Whr']]),
    specifications: new Map([
      ['Processor', new Map([['Brand', 'Intel'], ['Model', 'Core i5-1235U'], ['Cores', '10'], ['Clock Speed', '1.3 GHz – 4.4 GHz']])],
      ['Memory', new Map([['RAM', '8GB DDR4 3200MHz'], ['Max RAM', '16GB'], ['Storage', '512GB NVMe SSD']])],
      ['Display', new Map([['Size', '15.6 inches'], ['Resolution', '1920 x 1080 FHD'], ['Panel', 'Anti-Glare'], ['Brightness', '220 nits']])],
      ['Connectivity', new Map([['WiFi', 'Wi-Fi 5 (802.11ac)'], ['Bluetooth', 'Bluetooth 5.1'], ['Ports', 'USB 3.2, USB 2.0, HDMI 1.4, SD Card Reader']])],
    ]),
    images: ['/assets/products/dell-inspiron-15-3520/main.jpg', '/assets/products/dell-inspiron-15-3520/side.jpg', '/assets/products/dell-inspiron-15-3520/keyboard.jpg'],
    weight: 1.79,
    weightUnit: 'kg',
    dimensions: { length: 35.8, width: 23.5, height: 1.99, unit: 'cm' },
    warranty: { period: 12, periodUnit: 'months', type: 'manufacturer', provider: 'Dell India', terms: '1 year comprehensive warranty with onsite service.', returnPolicy: { eligible: true, days: 10, type: 'standard', restockingFee: 0 } },
    shipping: { freeShipping: true, shippingClass: 'standard', processingDays: 2, dangerousGoods: false },
    inventorySettings: { trackInventory: true, allowBackorder: false, lowStockThreshold: 10, manageVariantInventory: false },
    seo: { metaTitle: 'Dell Inspiron 15 3520 Laptop – i5 8GB 512GB SSD | TechMart India', metaDescription: 'Buy Dell Inspiron 15 3520 laptop with Intel Core i5, 8GB RAM, 512GB SSD. Best price on TechMart India. Free shipping.', keywords: ['dell laptop', 'inspiron 15', 'i5 laptop', 'windows laptop', 'student laptop'] },
    analytics: { views: 2840, uniqueViews: 1920, impressions: 8400, cartAdds: 312, wishlistAdds: 198, purchases: 64, revenue: 3391936, conversionRate: 2.25 },
    rating: 4.3,
    reviewCount: 47,
    moderation: { submittedAt: new Date('2026-01-10'), reviewedAt: new Date('2026-01-12'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  const wirelessMouse = await upsertProduct('techmart-logitech-m720-wireless-mouse', {
    sellerId: s1,
    title: 'Logitech M720 Triathlon Wireless Mouse',
    slug: 'techmart-logitech-m720-wireless-mouse',
    shortDescription: 'Multi-device Bluetooth mouse with hyper-scroll wheel and up to 3 device connectivity.',
    description: 'The Logitech M720 Triathlon is a premium wireless mouse built for productivity power users. Connect to up to 3 devices via Bluetooth or USB nano receiver and switch between them with a button click. The hyper-fast scroll wheel, 1000 DPI sensor, and ergonomic design reduce fatigue during long working sessions. Compatible with Windows, macOS, and Chrome OS.',
    productType: 'simple',
    category: 'accessories',
    categoryId: 'accessories',
    brand: 'Logitech',
    price: 4499,
    mrp: 6495,
    salePrice: 4499,
    costPrice: 2800,
    gstRate: 18,
    hsnCode: '8543',
    sku: 'LGT-M720-MOUS-BLK',
    barcode: '5099206063662',
    stock: 230,
    reservedStock: 12,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-01-20'),
    tags: ['mouse', 'logitech', 'wireless mouse', 'bluetooth mouse', 'productivity', 'multi-device'],
    attributes: new Map([['connectivity', 'Bluetooth + USB Nano Receiver'], ['dpi', '1000'], ['buttons', '8'], ['batteryLife', '24 months'], ['compatibility', 'Windows, macOS, Chrome OS']]),
    specifications: new Map([
      ['Sensor', new Map([['Type', 'Optical'], ['DPI', '1000']])],
      ['Connectivity', new Map([['Options', 'Bluetooth Low Energy + Unifying Receiver'], ['Range', '10 m']])],
      ['Power', new Map([['Battery', '1x AA alkaline'], ['Battery Life', 'Up to 24 months']])],
    ]),
    images: ['/assets/products/logitech-m720/main.jpg', '/assets/products/logitech-m720/top.jpg', '/assets/products/logitech-m720/side.jpg'],
    weight: 0.145,
    weightUnit: 'kg',
    dimensions: { length: 12.4, width: 7.25, height: 4.35, unit: 'cm' },
    warranty: { period: 36, periodUnit: 'months', type: 'manufacturer', provider: 'Logitech India', returnPolicy: { eligible: true, days: 10, type: 'standard', restockingFee: 0 } },
    shipping: { freeShipping: false, additionalCost: 49, shippingClass: 'standard', processingDays: 1 },
    inventorySettings: { trackInventory: true, allowBackorder: true, lowStockThreshold: 20 },
    seo: { metaTitle: 'Logitech M720 Triathlon Wireless Mouse | TechMart India', metaDescription: 'Multi-device wireless mouse with Bluetooth & USB receiver. Buy Logitech M720 at best price.', keywords: ['logitech mouse', 'wireless mouse', 'bluetooth mouse', 'multi-device mouse', 'm720'] },
    analytics: { views: 3120, uniqueViews: 2100, impressions: 9200, cartAdds: 540, purchases: 189, revenue: 850311 },
    rating: 4.6,
    reviewCount: 134,
    moderation: { submittedAt: new Date('2026-01-18'), reviewedAt: new Date('2026-01-19'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  const mensJeans = await upsertProduct('fashionhub-levis-511-slim-fit-jeans', {
    sellerId: s2,
    title: "Levi's 511 Slim Fit Men's Jeans",
    slug: 'fashionhub-levis-511-slim-fit-jeans',
    shortDescription: "Classic slim fit jeans in stretch denim for all-day comfort.",
    description: "Levi's 511 Slim Fit jeans deliver a modern silhouette with a comfortable stretch denim fabric. Sitting below the waist with a slim fit through the thigh and a narrow leg opening, these jeans look great from office to weekend. Available in multiple washes and sizes.",
    productType: 'simple',
    category: 'mens-clothing',
    categoryId: 'mens-clothing',
    brand: "Levi's",
    price: 2799,
    mrp: 3999,
    salePrice: 2799,
    costPrice: 1400,
    gstRate: 12,
    hsnCode: '6203',
    sku: "LVS-511-JNS-32-BLU",
    stock: 145,
    reservedStock: 8,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-02-01'),
    tags: ['jeans', "levi's", 'mens jeans', 'slim fit', 'denim', 'casual'],
    attributes: new Map([['size', '32'], ['waist', '32'], ['length', '32'], ['fit', 'Slim'], ['material', '98% Cotton 2% Elastane'], ['color', 'Dark Blue Wash']]),
    specifications: new Map([
      ['Fabric', new Map([['Material', '98% Cotton, 2% Elastane'], ['Stretch', 'High stretch'], ['Wash Care', 'Machine wash cold']])],
      ['Fit', new Map([['Type', 'Slim Fit'], ['Rise', 'Mid Rise'], ['Leg Opening', 'Narrow']])],
    ]),
    images: ['/assets/products/levis-511/front.jpg', '/assets/products/levis-511/back.jpg', '/assets/products/levis-511/detail.jpg'],
    weight: 0.55,
    weightUnit: 'kg',
    warranty: { returnPolicy: { eligible: true, days: 30, type: 'easy_return', restockingFee: 0 } },
    shipping: { freeShipping: false, additionalCost: 49, processingDays: 1 },
    inventorySettings: { trackInventory: true, allowBackorder: false, lowStockThreshold: 15 },
    seo: { metaTitle: "Levi's 511 Slim Fit Jeans for Men | FashionHub", metaDescription: "Buy Levi's 511 slim fit jeans online. Best price with free returns.", keywords: ["levi's jeans", 'slim fit jeans', 'mens jeans', '511 jeans', 'denim jeans'] },
    analytics: { views: 4210, uniqueViews: 3100, cartAdds: 780, purchases: 312, revenue: 873888 },
    rating: 4.4,
    reviewCount: 221,
    moderation: { submittedAt: new Date('2026-01-28'), reviewedAt: new Date('2026-01-30'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  const runningShoes = await upsertProduct('fitzone-nike-air-zoom-pegasus-40', {
    sellerId: s4,
    title: 'Nike Air Zoom Pegasus 40 Running Shoes',
    slug: 'fitzone-nike-air-zoom-pegasus-40',
    shortDescription: 'Lightweight road running shoe with responsive Zoom Air cushioning.',
    description: 'The Nike Air Zoom Pegasus 40 is the next evolution in Nike\'s iconic running shoe family. Engineered with dual-density foam and a forefoot Zoom Air unit for a responsive, cushioned ride on every run. The breathable mesh upper keeps feet cool and the rubber outsole delivers durable traction.',
    productType: 'simple',
    category: 'footwear',
    categoryId: 'footwear',
    brand: 'Nike',
    price: 9499,
    mrp: 11995,
    salePrice: 9499,
    costPrice: 5500,
    gstRate: 18,
    hsnCode: '6403',
    sku: 'NK-PEGASUS40-M-9-BLK',
    stock: 62,
    reservedStock: 3,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-02-10'),
    tags: ['running shoes', 'nike', 'pegasus', 'sports shoes', 'zoom air', 'road running'],
    attributes: new Map([['size', '9'], ['gender', 'Men'], ['color', 'Black/White'], ['surface', 'Road'], ['drop', '10mm']]),
    specifications: new Map([
      ['Upper', new Map([['Material', 'Breathable Mesh'], ['Fit', 'Standard'], ['Closure', 'Lace-up']])],
      ['Sole', new Map([['Midsole', 'Dual-density React foam'], ['Outsole', 'Rubber with waffle pattern'], ['Cushioning', 'Zoom Air forefoot unit']])],
    ]),
    images: ['/assets/products/nike-pegasus-40/main.jpg', '/assets/products/nike-pegasus-40/side.jpg', '/assets/products/nike-pegasus-40/sole.jpg'],
    weight: 0.287,
    weightUnit: 'kg',
    warranty: { returnPolicy: { eligible: true, days: 30, type: 'easy_return', restockingFee: 0 } },
    shipping: { freeShipping: false, additionalCost: 99, processingDays: 2 },
    inventorySettings: { trackInventory: true, allowBackorder: false, lowStockThreshold: 10 },
    seo: { metaTitle: 'Nike Air Zoom Pegasus 40 Running Shoes | FitZone', metaDescription: 'Buy Nike Pegasus 40 running shoes online. Zoom Air cushioning. Best price at FitZone.', keywords: ['nike pegasus 40', 'running shoes', 'nike running', 'zoom air shoes'] },
    analytics: { views: 1870, uniqueViews: 1420, cartAdds: 245, purchases: 78, revenue: 740922 },
    rating: 4.5,
    reviewCount: 56,
    moderation: { submittedAt: new Date('2026-02-07'), reviewedAt: new Date('2026-02-09'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  // ── VARIABLE products ────────────────────────────────────────────────────────

  const smartphone = await upsertProduct('techmart-samsung-galaxy-s24-5g', {
    sellerId: s1,
    title: 'Samsung Galaxy S24 5G Smartphone',
    slug: 'techmart-samsung-galaxy-s24-5g',
    shortDescription: 'AI-powered Galaxy S24 with 50MP triple camera, 6.2" Dynamic AMOLED display and 5G connectivity.',
    description: 'The Samsung Galaxy S24 redefines mobile intelligence. With the Exynos 2400 chipset, Galaxy AI features, and a 50MP triple-camera system, it captures stunning photos and handles demanding tasks effortlessly. The 6.2-inch Dynamic AMOLED 2X display with 120Hz refresh rate and 4000mAh battery offer an immersive, all-day experience. Available in 128GB and 256GB storage options in Phantom Black, Marble Grey, and Cobalt Violet.',
    productType: 'variable',
    category: 'mobiles',
    categoryId: 'mobiles',
    brand: 'Samsung',
    price: 69999,
    mrp: 79999,
    salePrice: 69999,
    costPrice: 55000,
    gstRate: 18,
    hsnCode: '8517',
    sku: 'SG-S24-5G-128-BLK',
    stock: 320,
    reservedStock: 22,
    currency: 'INR',
    hasVariants: true,
    variantAxes: ['storage', 'color'],
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-01-25'),
    tags: ['samsung', 'galaxy s24', 'smartphone', '5g phone', 'android', 'flagship', 'galaxy ai'],
    options: [
      { name: 'Storage', slug: 'storage', values: ['128GB', '256GB'], displayType: 'button', required: true, sortOrder: 0 },
      { name: 'Color', slug: 'color', values: ['Phantom Black', 'Marble Grey', 'Cobalt Violet'], displayType: 'color_swatch', required: true, sortOrder: 1 },
    ],
    variants: [
      { sku: 'SG-S24-5G-128-BLK', title: 'Galaxy S24 128GB Phantom Black', price: 69999, mrp: 79999, salePrice: 69999, gstRate: 18, stock: 90, reservedStock: 8, attributes: new Map([['storage', '128GB'], ['color', 'Phantom Black']]), isDefault: true, status: 'active', sortOrder: 0, images: ['/assets/products/samsung-s24/128gb-black.jpg'] },
      { sku: 'SG-S24-5G-128-GRY', title: 'Galaxy S24 128GB Marble Grey', price: 69999, mrp: 79999, salePrice: 69999, gstRate: 18, stock: 70, reservedStock: 5, attributes: new Map([['storage', '128GB'], ['color', 'Marble Grey']]), isDefault: false, status: 'active', sortOrder: 1, images: ['/assets/products/samsung-s24/128gb-grey.jpg'] },
      { sku: 'SG-S24-5G-128-VIO', title: 'Galaxy S24 128GB Cobalt Violet', price: 69999, mrp: 79999, salePrice: 69999, gstRate: 18, stock: 55, reservedStock: 4, attributes: new Map([['storage', '128GB'], ['color', 'Cobalt Violet']]), isDefault: false, status: 'active', sortOrder: 2, images: ['/assets/products/samsung-s24/128gb-violet.jpg'] },
      { sku: 'SG-S24-5G-256-BLK', title: 'Galaxy S24 256GB Phantom Black', price: 79999, mrp: 89999, salePrice: 79999, gstRate: 18, stock: 45, reservedStock: 3, attributes: new Map([['storage', '256GB'], ['color', 'Phantom Black']]), isDefault: false, status: 'active', sortOrder: 3, images: ['/assets/products/samsung-s24/256gb-black.jpg'] },
      { sku: 'SG-S24-5G-256-GRY', title: 'Galaxy S24 256GB Marble Grey', price: 79999, mrp: 89999, salePrice: 79999, gstRate: 18, stock: 38, reservedStock: 2, attributes: new Map([['storage', '256GB'], ['color', 'Marble Grey']]), isDefault: false, status: 'active', sortOrder: 4, images: ['/assets/products/samsung-s24/256gb-grey.jpg'] },
      { sku: 'SG-S24-5G-256-VIO', title: 'Galaxy S24 256GB Cobalt Violet', price: 79999, mrp: 89999, salePrice: 79999, gstRate: 18, stock: 22, reservedStock: 0, attributes: new Map([['storage', '256GB'], ['color', 'Cobalt Violet']]), isDefault: false, status: 'active', sortOrder: 5, images: ['/assets/products/samsung-s24/256gb-violet.jpg'] },
    ],
    attributes: new Map([['network', '5G'], ['display', '6.2" Dynamic AMOLED 2X 120Hz'], ['camera', '50MP + 12MP + 10MP'], ['battery', '4000mAh'], ['processor', 'Exynos 2400'], ['operatingSystem', 'Android 14, One UI 6.1']]),
    specifications: new Map([
      ['Display', new Map([['Size', '6.2 inches'], ['Type', 'Dynamic AMOLED 2X'], ['Resolution', '2340 x 1080 FHD+'], ['Refresh Rate', '120Hz adaptive']])],
      ['Camera', new Map([['Rear Main', '50MP OIS'], ['Rear Ultra-wide', '12MP'], ['Rear Telephoto', '10MP 3x Optical Zoom'], ['Front', '12MP']])],
      ['Battery', new Map([['Capacity', '4000 mAh'], ['Fast Charging', '25W wired'], ['Wireless', '15W wireless']])],
    ]),
    images: ['/assets/products/samsung-s24/hero.jpg', '/assets/products/samsung-s24/camera.jpg', '/assets/products/samsung-s24/display.jpg'],
    weight: 0.167,
    weightUnit: 'kg',
    dimensions: { length: 14.7, width: 7.06, height: 0.759, unit: 'cm' },
    warranty: { period: 12, periodUnit: 'months', type: 'manufacturer', provider: 'Samsung India', returnPolicy: { eligible: true, days: 10, type: 'standard', restockingFee: 0 } },
    shipping: { freeShipping: true, processingDays: 1 },
    inventorySettings: { trackInventory: true, allowBackorder: false, lowStockThreshold: 20, manageVariantInventory: true },
    seo: { metaTitle: 'Samsung Galaxy S24 5G – 128GB/256GB | TechMart India', metaDescription: 'Buy Samsung Galaxy S24 5G smartphone. AI camera, 120Hz AMOLED display. Best price with free shipping.', keywords: ['samsung galaxy s24', 'galaxy s24 5g', 'samsung flagship', '5g smartphone', 'android phone 2024'] },
    analytics: { views: 12400, uniqueViews: 8900, impressions: 42000, cartAdds: 1840, wishlistAdds: 920, purchases: 328, revenue: 24117376, conversionRate: 2.64 },
    rating: 4.7,
    reviewCount: 289,
    moderation: { submittedAt: new Date('2026-01-22'), reviewedAt: new Date('2026-01-24'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  const tshirt = await upsertProduct('fashionhub-unisex-graphic-tshirt', {
    sellerId: s2,
    title: 'Urban Classics Unisex Graphic T-Shirt',
    slug: 'fashionhub-unisex-graphic-tshirt',
    shortDescription: '100% premium cotton unisex t-shirt with bold graphic print.',
    description: "Urban Classics graphic t-shirt made from 180 GSM 100% combed cotton for superior softness and durability. Available in 5 sizes (XS–XL) and 4 colour options. Pre-shrunk for a consistent fit wash after wash.",
    productType: 'variable',
    category: 'mens-clothing',
    categoryId: 'mens-clothing',
    brand: 'Urban Classics',
    price: 599,
    mrp: 999,
    salePrice: 599,
    costPrice: 250,
    gstRate: 12,
    hsnCode: '6109',
    sku: 'UC-GFX-TS-M-BLK',
    stock: 840,
    reservedStock: 45,
    currency: 'INR',
    hasVariants: true,
    variantAxes: ['size', 'color'],
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-01-30'),
    tags: ['t-shirt', 'graphic tee', 'unisex', 'casual wear', 'cotton', 'streetwear'],
    options: [
      { name: 'Size', slug: 'size', values: ['XS', 'S', 'M', 'L', 'XL'], displayType: 'button', required: true, sortOrder: 0 },
      { name: 'Color', slug: 'color', values: ['Black', 'White', 'Navy', 'Olive'], displayType: 'color_swatch', required: true, sortOrder: 1 },
    ],
    variants: [
      { sku: 'UC-GFX-TS-XS-BLK', title: 'XS / Black', price: 599, mrp: 999, gstRate: 12, stock: 60, reservedStock: 2, attributes: new Map([['size', 'XS'], ['color', 'Black']]), isDefault: false, status: 'active', sortOrder: 0 },
      { sku: 'UC-GFX-TS-S-BLK', title: 'S / Black', price: 599, mrp: 999, gstRate: 12, stock: 110, reservedStock: 8, attributes: new Map([['size', 'S'], ['color', 'Black']]), isDefault: false, status: 'active', sortOrder: 1 },
      { sku: 'UC-GFX-TS-M-BLK', title: 'M / Black', price: 599, mrp: 999, gstRate: 12, stock: 130, reservedStock: 12, attributes: new Map([['size', 'M'], ['color', 'Black']]), isDefault: true, status: 'active', sortOrder: 2 },
      { sku: 'UC-GFX-TS-L-BLK', title: 'L / Black', price: 599, mrp: 999, gstRate: 12, stock: 120, reservedStock: 10, attributes: new Map([['size', 'L'], ['color', 'Black']]), isDefault: false, status: 'active', sortOrder: 3 },
      { sku: 'UC-GFX-TS-XL-BLK', title: 'XL / Black', price: 599, mrp: 999, gstRate: 12, stock: 80, reservedStock: 5, attributes: new Map([['size', 'XL'], ['color', 'Black']]), isDefault: false, status: 'active', sortOrder: 4 },
      { sku: 'UC-GFX-TS-M-WHT', title: 'M / White', price: 599, mrp: 999, gstRate: 12, stock: 95, reservedStock: 4, attributes: new Map([['size', 'M'], ['color', 'White']]), isDefault: false, status: 'active', sortOrder: 5 },
      { sku: 'UC-GFX-TS-M-NVY', title: 'M / Navy', price: 599, mrp: 999, gstRate: 12, stock: 100, reservedStock: 3, attributes: new Map([['size', 'M'], ['color', 'Navy']]), isDefault: false, status: 'active', sortOrder: 6 },
      { sku: 'UC-GFX-TS-M-OLV', title: 'M / Olive', price: 599, mrp: 999, gstRate: 12, stock: 85, reservedStock: 1, attributes: new Map([['size', 'M'], ['color', 'Olive']]), isDefault: false, status: 'active', sortOrder: 7 },
    ],
    attributes: new Map([['material', '100% Combed Cotton 180GSM'], ['fit', 'Regular Unisex'], ['care', 'Machine wash cold'], ['neckline', 'Crew Neck']]),
    images: ['/assets/products/urban-tshirt/black-front.jpg', '/assets/products/urban-tshirt/white-front.jpg', '/assets/products/urban-tshirt/detail.jpg'],
    weight: 0.22,
    weightUnit: 'kg',
    warranty: { returnPolicy: { eligible: true, days: 30, type: 'easy_return', restockingFee: 0 } },
    shipping: { freeShipping: false, additionalCost: 39, processingDays: 1 },
    inventorySettings: { trackInventory: true, allowBackorder: false, lowStockThreshold: 20, manageVariantInventory: true },
    seo: { metaTitle: 'Unisex Graphic T-Shirt – 5 Sizes, 4 Colours | FashionHub', metaDescription: 'Shop Urban Classics graphic t-shirts in premium 180 GSM cotton. Available in XS–XL and 4 colours.', keywords: ['graphic t-shirt', 'unisex tshirt', 'cotton tshirt', 'casual wear', 'streetwear'] },
    analytics: { views: 8900, uniqueViews: 6200, cartAdds: 2100, purchases: 890, revenue: 533110 },
    rating: 4.2,
    reviewCount: 612,
    moderation: { submittedAt: new Date('2026-01-27'), reviewedAt: new Date('2026-01-29'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  // ── DIGITAL products ─────────────────────────────────────────────────────────

  const jsEbook = await upsertProduct('bookworld-javascript-complete-guide-ebook', {
    sellerId: s3,
    title: 'JavaScript: The Complete Guide – E-Book (PDF + EPUB)',
    slug: 'bookworld-javascript-complete-guide-ebook',
    shortDescription: 'Comprehensive 800-page JavaScript guide from fundamentals to advanced patterns. Includes ES2024 features.',
    description: 'Master JavaScript from beginner to advanced level with this comprehensive 800-page guide. Covers core language features, DOM manipulation, async programming (Promises, async/await), ES2024 features, React integration, Node.js basics, testing with Jest, and modern tooling. Includes 100+ real-world code examples, exercises and solutions. Available as PDF and EPUB.',
    productType: 'digital',
    category: 'tech-books',
    categoryId: 'tech-books',
    brand: 'BookWorld',
    price: 899,
    mrp: 1499,
    salePrice: 899,
    costPrice: 100,
    gstRate: 18,
    hsnCode: '4901',
    sku: 'BW-JS-COMPGD-EBOOK',
    stock: 9999,
    reservedStock: 0,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-01-05'),
    tags: ['javascript', 'ebook', 'programming', 'web development', 'nodejs', 'react', 'es2024', 'digital book'],
    attributes: new Map([['author', 'BookWorld Editorial Team'], ['publisher', 'BookWorld Digital Pvt Ltd'], ['pages', '800'], ['language', 'English'], ['format', 'PDF, EPUB'], ['edition', '4th Edition 2024']]),
    digital: {
      fileUrl: '/secure-downloads/bw-js-complete-guide-v4.pdf',
      previewUrl: '/previews/bw-js-complete-guide-preview.pdf',
      fileSize: 18432000,
      fileType: 'ebook',
      licenseType: 'single_use',
      downloadLimit: 5,
      expiryDays: 365,
      accessControl: { loginRequired: true, purchaseRequired: true },
      version: '4.0',
      platforms: ['Web', 'iOS', 'Android', 'Kindle'],
    },
    images: ['/assets/products/js-complete-guide/cover.jpg', '/assets/products/js-complete-guide/sample-pages.jpg'],
    warranty: { returnPolicy: { eligible: false, days: 0, type: 'no_return' } },
    shipping: { freeShipping: true, processingDays: 0 },
    inventorySettings: { trackInventory: false, allowBackorder: true },
    seo: { metaTitle: 'JavaScript: The Complete Guide E-Book | BookWorld', metaDescription: 'Download the complete JavaScript guide PDF. 800 pages, ES2024, React, Node.js. Instant download.', keywords: ['javascript ebook', 'js guide pdf', 'learn javascript', 'programming ebook', 'web development book'] },
    analytics: { views: 6700, uniqueViews: 4900, cartAdds: 1240, purchases: 621, revenue: 558279 },
    rating: 4.8,
    reviewCount: 498,
    moderation: { submittedAt: new Date('2026-01-03'), reviewedAt: new Date('2026-01-04'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  const designTemplates = await upsertProduct('bookworld-figma-ui-design-templates-pack', {
    sellerId: s3,
    title: 'Figma UI Design Templates Pack – 200+ Screens',
    slug: 'bookworld-figma-ui-design-templates-pack',
    shortDescription: 'Professional Figma UI kit with 200+ screens for mobile and web apps.',
    description: 'Accelerate your design workflow with this professional Figma UI kit containing 200+ fully editable screens across 15+ categories: E-commerce, Finance, Health, Social, Onboarding, Dashboard, and more. Auto-layout, components, design tokens and light/dark themes included. Compatible with Figma (free and pro).',
    productType: 'digital',
    category: 'digital-courses',
    categoryId: 'digital-courses',
    brand: 'BookWorld',
    price: 1499,
    mrp: 3499,
    salePrice: 1499,
    costPrice: 200,
    gstRate: 18,
    hsnCode: '4901',
    sku: 'BW-FIGMA-UITPL-200',
    stock: 9999,
    reservedStock: 0,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-01-10'),
    tags: ['figma', 'ui kit', 'design templates', 'mobile ui', 'web design', 'digital download'],
    attributes: new Map([['format', 'Figma (.fig)'], ['screens', '200+'], ['compatibility', 'Figma, Adobe XD'], ['version', '2.1']]),
    digital: {
      fileUrl: '/secure-downloads/figma-ui-kit-v2.1.fig',
      previewUrl: '/previews/figma-ui-kit-preview.jpg',
      fileSize: 84000000,
      fileType: 'template',
      licenseType: 'multi_use',
      downloadLimit: 3,
      expiryDays: 0,
      accessControl: { loginRequired: true, purchaseRequired: true },
      version: '2.1',
      platforms: ['Web', 'macOS', 'Windows'],
    },
    images: ['/assets/products/figma-kit/cover.jpg', '/assets/products/figma-kit/screens-preview.jpg', '/assets/products/figma-kit/components.jpg'],
    warranty: { returnPolicy: { eligible: false, days: 0, type: 'no_return' } },
    shipping: { freeShipping: true, processingDays: 0 },
    inventorySettings: { trackInventory: false, allowBackorder: true },
    seo: { metaTitle: 'Figma UI Kit – 200+ Screens | BookWorld', metaDescription: 'Download 200+ professional Figma UI screens. Mobile + web. Auto-layout, dark/light themes. Instant download.', keywords: ['figma ui kit', 'figma templates', 'ui design kit', 'mobile ui templates', 'web design templates'] },
    analytics: { views: 4200, uniqueViews: 3100, cartAdds: 840, purchases: 367, revenue: 550133 },
    rating: 4.9,
    reviewCount: 312,
    moderation: { submittedAt: new Date('2026-01-08'), reviewedAt: new Date('2026-01-09'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  // ── BUNDLE products ──────────────────────────────────────────────────────────

  const laptopBundle = await upsertProduct('techmart-laptop-complete-bundle', {
    sellerId: s1,
    title: 'Laptop Complete Work Bundle – Dell Inspiron + Mouse + Bag',
    slug: 'techmart-laptop-complete-bundle',
    shortDescription: 'Everything you need to get started: Dell Inspiron 15, Logitech M720 mouse, and a premium 15.6" laptop bag.',
    description: 'Get everything you need for productive work in one bundle: the Dell Inspiron 15 3520 laptop, Logitech M720 Triathlon wireless mouse, and a premium padded 15.6-inch laptop bag. Save ₹2,500 compared to buying separately. Ideal for students, professionals, and home office setups.',
    productType: 'bundle',
    category: 'laptops',
    categoryId: 'laptops',
    brand: 'Dell',
    price: 59498,
    mrp: 71493,
    salePrice: 59498,
    costPrice: 47000,
    gstRate: 18,
    hsnCode: '8471',
    sku: 'TM-LTOP-BUNDLE-001',
    stock: 30,
    reservedStock: 2,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-02-05'),
    bundleDiscount: 3.5,
    bundleItems: [
      { productId: String(laptop._id), quantity: 1, price: 52999, isRequired: true, title: 'Dell Inspiron 15 3520' },
      { productId: String(wirelessMouse._id), quantity: 1, price: 4499, isRequired: true, title: 'Logitech M720 Wireless Mouse' },
      { quantity: 1, price: 1999, isRequired: false, title: 'Premium 15.6" Laptop Bag' },
    ],
    tags: ['laptop bundle', 'work from home bundle', 'dell bundle', 'computer bundle', 'office setup'],
    images: ['/assets/products/laptop-bundle/hero.jpg', '/assets/products/laptop-bundle/components.jpg'],
    warranty: { returnPolicy: { eligible: true, days: 10, type: 'standard', restockingFee: 0 } },
    shipping: { freeShipping: true, processingDays: 3 },
    inventorySettings: { trackInventory: true, allowBackorder: false, lowStockThreshold: 5 },
    seo: { metaTitle: 'Laptop Work Bundle – Dell + Mouse + Bag | TechMart India', metaDescription: 'Buy Dell Inspiron laptop bundle with wireless mouse and bag. Save ₹2,500. Free shipping.', keywords: ['laptop bundle', 'dell inspiron bundle', 'home office bundle', 'laptop combo'] },
    analytics: { views: 980, uniqueViews: 780, cartAdds: 89, purchases: 22, revenue: 1308956 },
    rating: 4.5,
    reviewCount: 18,
    moderation: { submittedAt: new Date('2026-02-02'), reviewedAt: new Date('2026-02-04'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  const fitnessBundle = await upsertProduct('fitzone-home-workout-starter-bundle', {
    sellerId: s4,
    title: 'Home Workout Starter Bundle – Resistance Bands + Yoga Mat + Skipping Rope',
    slug: 'fitzone-home-workout-starter-bundle',
    shortDescription: 'Complete beginner home workout kit with 5 resistance bands, premium yoga mat and adjustable skipping rope.',
    description: 'Start your fitness journey at home with this all-in-one beginner workout bundle. Includes a set of 5 fabric resistance bands (5–40 lbs), a 6mm thick non-slip TPE yoga mat, and a high-speed adjustable skipping rope. Save 22% compared to buying each separately.',
    productType: 'bundle',
    category: 'exercise-equipment',
    categoryId: 'exercise-equipment',
    brand: 'FitZone',
    price: 1299,
    mrp: 1699,
    salePrice: 1299,
    costPrice: 650,
    gstRate: 12,
    hsnCode: '9506',
    sku: 'FZ-HOME-WRKOUT-BNDL',
    stock: 75,
    reservedStock: 4,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-02-12'),
    bundleDiscount: 22,
    bundleItems: [
      { quantity: 1, price: 699, isRequired: true, title: 'FitZone 5-Pack Resistance Bands (5–40 lbs)' },
      { quantity: 1, price: 799, isRequired: true, title: 'FitZone 6mm TPE Non-Slip Yoga Mat' },
      { quantity: 1, price: 299, isRequired: false, title: 'FitZone Adjustable Speed Skipping Rope' },
    ],
    tags: ['fitness bundle', 'home workout', 'resistance bands', 'yoga mat', 'beginner fitness', 'exercise kit'],
    images: ['/assets/products/fitness-bundle/hero.jpg', '/assets/products/fitness-bundle/components.jpg'],
    warranty: { returnPolicy: { eligible: true, days: 15, type: 'standard', restockingFee: 0 } },
    shipping: { freeShipping: false, additionalCost: 99, processingDays: 2 },
    inventorySettings: { trackInventory: true, allowBackorder: false, lowStockThreshold: 10 },
    seo: { metaTitle: 'Home Workout Starter Bundle – Bands + Mat + Rope | FitZone', metaDescription: 'Complete beginner home workout bundle with resistance bands, yoga mat and skipping rope. Save 22%.', keywords: ['home workout bundle', 'resistance bands set', 'yoga mat bundle', 'fitness starter kit'] },
    analytics: { views: 2140, uniqueViews: 1780, cartAdds: 310, purchases: 112, revenue: 145488 },
    rating: 4.4,
    reviewCount: 89,
    moderation: { submittedAt: new Date('2026-02-10'), reviewedAt: new Date('2026-02-11'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  // ── SUBSCRIPTION products ────────────────────────────────────────────────────

  const creativeCloudSub = await upsertProduct('bookworld-creative-mastery-monthly', {
    sellerId: s3,
    title: 'Creative Mastery — Monthly Subscription (Design + Photo + Video)',
    slug: 'bookworld-creative-mastery-monthly',
    shortDescription: 'All-access monthly subscription: 50+ design courses, premium template library, and live coaching sessions.',
    description: 'Creative Mastery is a comprehensive monthly subscription for designers, photographers, and video editors. Get unlimited access to 50+ premium courses, 2000+ professional templates (Figma, Canva, After Effects), monthly live Q&A sessions with industry experts, and a private community forum. New courses added every month.',
    productType: 'subscription',
    category: 'digital-courses',
    categoryId: 'digital-courses',
    brand: 'BookWorld',
    price: 799,
    mrp: 1499,
    salePrice: 799,
    costPrice: 150,
    gstRate: 18,
    hsnCode: '4901',
    sku: 'BW-CREAMS-MONTHLY',
    stock: 9999,
    reservedStock: 0,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-01-01'),
    subscription: {
      billingCycle: 'monthly',
      trialDays: 7,
      recurringPrice: 799,
      setupFee: 0,
      maxRenewalCount: null,
      features: [
        'Unlimited access to 50+ premium design, photo and video courses',
        '2000+ professional templates (Figma, Canva, After Effects, Premiere)',
        '2 live coaching sessions per month with industry experts',
        'Private community forum access',
        'Monthly certificate for completed courses',
        'New courses added every month',
        'Download templates for offline use',
      ],
      gracePeriodDays: 5,
      autoRenew: true,
      cancellationPolicy: 'Cancel anytime. Access continues until end of billing period. No refund for partial months.',
    },
    tags: ['subscription', 'online courses', 'design courses', 'creative subscription', 'monthly plan', 'templates'],
    images: ['/assets/products/creative-mastery/cover.jpg', '/assets/products/creative-mastery/dashboard.jpg', '/assets/products/creative-mastery/courses.jpg'],
    warranty: { returnPolicy: { eligible: false, days: 0, type: 'no_return' } },
    shipping: { freeShipping: true, processingDays: 0 },
    inventorySettings: { trackInventory: false, allowBackorder: true },
    seo: { metaTitle: 'Creative Mastery Monthly – Design, Photo & Video Courses | BookWorld', metaDescription: 'Subscribe to Creative Mastery for unlimited design courses, 2000+ templates and live coaching. ₹799/month.', keywords: ['design subscription', 'online design courses', 'creative courses', 'figma templates subscription', 'monthly design plan'] },
    analytics: { views: 9800, uniqueViews: 7200, cartAdds: 2100, purchases: 1040, revenue: 831360 },
    rating: 4.7,
    reviewCount: 874,
    moderation: { submittedAt: new Date('2025-12-28'), reviewedAt: new Date('2025-12-30'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  const proteinSub = await upsertProduct('fitzone-monthly-nutrition-box', {
    sellerId: s4,
    title: 'FitZone Monthly Nutrition Box — Personalised Supplement Subscription',
    slug: 'fitzone-monthly-nutrition-box',
    shortDescription: 'Curated monthly box of premium protein, vitamins and supplements tailored to your fitness goals.',
    description: 'Receive a personalised monthly nutrition box with 3–5 premium supplements selected for your fitness profile: whey protein, BCAAs, multivitamins, creatine, and pre-workout. Each box is curated by certified nutritionists. Cancel anytime. Free shipping on all boxes.',
    productType: 'subscription',
    category: 'nutrition',
    categoryId: 'nutrition',
    brand: 'FitZone',
    price: 1899,
    mrp: 2499,
    salePrice: 1899,
    costPrice: 900,
    gstRate: 18,
    hsnCode: '2106',
    sku: 'FZ-NUTRI-BOX-MONTHLY',
    stock: 9999,
    reservedStock: 0,
    currency: 'INR',
    status: 'active',
    visibility: 'public',
    publishedAt: new Date('2026-01-15'),
    subscription: {
      billingCycle: 'monthly',
      trialDays: 0,
      recurringPrice: 1899,
      setupFee: 0,
      features: [
        'Curated box of 3–5 premium supplements monthly',
        'Personalised to your fitness goals (bulk, cut, maintain)',
        'Certified nutritionist recommendations',
        'Exclusive subscriber discount on additional orders',
        'Free shipping on every box',
        'Cancel or pause anytime',
      ],
      gracePeriodDays: 7,
      autoRenew: true,
      cancellationPolicy: 'Cancel or pause anytime before next billing date. No partial refunds.',
    },
    tags: ['nutrition subscription', 'protein box', 'supplement subscription', 'fitness subscription', 'monthly box'],
    images: ['/assets/products/nutrition-box/hero.jpg', '/assets/products/nutrition-box/unboxing.jpg', '/assets/products/nutrition-box/supplements.jpg'],
    warranty: { returnPolicy: { eligible: false, days: 0, type: 'no_return' } },
    shipping: { freeShipping: true, processingDays: 3 },
    inventorySettings: { trackInventory: false, allowBackorder: true },
    seo: { metaTitle: 'FitZone Monthly Nutrition Box – Personalised Supplements | FitZone', metaDescription: 'Personalised monthly supplement box curated by nutritionists. Protein, BCAAs, vitamins. Cancel anytime.', keywords: ['monthly nutrition box', 'supplement subscription', 'protein subscription', 'fitness box', 'personalised supplements'] },
    analytics: { views: 3800, uniqueViews: 2900, cartAdds: 620, purchases: 245, revenue: 465255 },
    rating: 4.5,
    reviewCount: 187,
    moderation: { submittedAt: new Date('2026-01-12'), reviewedAt: new Date('2026-01-14'), checklist: { titleVerified: true, categoryVerified: true, complianceVerified: true, mediaVerified: true, pricingVerified: true, inventoryVerified: true } },
  });

  const products = { laptop, wirelessMouse, mensJeans, runningShoes, smartphone, tshirt, jsEbook, designTemplates, laptopBundle, fitnessBundle, creativeCloudSub, proteinSub };
  const count = Object.keys(products).length;
  console.log(`✓ Seeded ${count} products (simple×4, variable×2, digital×2, bundle×2, subscription×2)`);
  return products;
}

// ─── 7. Product Families & Variants ──────────────────────────────────────────

async function seedProductFamilies(users, products) {
  const s1 = String(users.seller1._id);

  await ProductFamilyModel.findOneAndUpdate(
    { familyCode: 'FAM-SAMSUNG-S24' },
    {
      $set: {
        sellerId: s1,
        title: 'Samsung Galaxy S24 Family',
        category: 'mobiles',
        baseAttributes: { brand: 'Samsung', series: 'Galaxy S24', network: '5G' },
        variantAxes: ['storage', 'color'],
        status: 'active',
      },
    },
    { upsert: true, new: true },
  );

  for (const variant of products.smartphone.variants || []) {
    await ProductVariantModel.findOneAndUpdate(
      { sku: variant.sku },
      {
        $set: {
          familyCode: 'FAM-SAMSUNG-S24',
          productId: String(products.smartphone._id),
          sellerId: s1,
          sku: variant.sku,
          attributes: Object.fromEntries(variant.attributes || new Map()),
          stock: variant.stock,
          reservedStock: variant.reservedStock,
          status: variant.status,
        },
      },
      { upsert: true, new: true },
    );
  }

  console.log('✓ Seeded product families and variants');
}

// ─── 8. Reviews ───────────────────────────────────────────────────────────────

async function seedReviews(users, products) {
  const { buyer1, buyer2 } = users;
  const reviews = [
    { productId: String(products.laptop._id), buyerId: String(buyer1._id), rating: 5, title: 'Excellent laptop for students', reviewText: 'Super fast SSD, great display and build quality. The battery easily lasts 6–7 hours. Worth every rupee.' },
    { productId: String(products.smartphone._id), buyerId: String(buyer1._id), rating: 5, title: 'Best smartphone under 75k', reviewText: 'Galaxy AI features are genuinely useful. Camera quality is outstanding. 120Hz display is buttery smooth.' },
    { productId: String(products.wirelessMouse._id), buyerId: String(buyer2._id), rating: 4, title: 'Great multi-device mouse', reviewText: 'Switching between my laptop and desktop is seamless. The hyper-scroll wheel is a game changer. Battery life is incredible.' },
    { productId: String(products.jsEbook._id), buyerId: String(buyer2._id), rating: 5, title: 'Best JS resource I have read', reviewText: 'Covers everything from fundamentals to modern ES2024 features. Real examples throughout. Highly recommend.' },
    { productId: String(products.creativeCloudSub._id), buyerId: String(buyer1._id), rating: 5, title: 'Worth every rupee', reviewText: 'The template library alone is worth the subscription. Live sessions are insightful. Improved my design workflow significantly.' },
  ];

  await Promise.all(reviews.map((review) =>
    ProductReviewModel.findOneAndUpdate(
      { productId: review.productId, buyerId: review.buyerId },
      { $set: { ...review, orderId: 'seed-order', media: [], helpfulVotes: Math.floor(Math.random() * 40) + 5, status: 'published' } },
      { upsert: true, new: true },
    ),
  ));

  console.log(`✓ Seeded ${reviews.length} product reviews`);
}

// ─── 9. User engagement data ──────────────────────────────────────────────────

async function seedEngagement(users, products) {
  const { buyer1, buyer2 } = users;
  const b1 = String(buyer1._id);
  const b2 = String(buyer2._id);

  await CartModel.findOneAndUpdate(
    { userId: b1 },
    { userId: b1, items: [{ productId: String(products.laptop._id), quantity: 1, price: 52999 }, { productId: String(products.wirelessMouse._id), quantity: 1, price: 4499 }], wishlist: [String(products.smartphone._id), String(products.jsEbook._id)] },
    { upsert: true, new: true },
  );

  await CartModel.findOneAndUpdate(
    { userId: b2 },
    { userId: b2, items: [{ productId: String(products.tshirt._id), quantity: 2, price: 599 }], wishlist: [String(products.runningShoes._id), String(products.designTemplates._id)] },
    { upsert: true, new: true },
  );

  await LoyaltyModel.findOneAndUpdate(
    { userId: b1 },
    { $set: { totalPoints: 1250, tier: 'gold', totalSpent: 125000 }, $setOnInsert: { pointsHistory: [], tierHistory: [] } },
    { upsert: true, new: true },
  );

  await LoyaltyModel.findOneAndUpdate(
    { userId: b2 },
    { $set: { totalPoints: 320, tier: 'silver', totalSpent: 32000 }, $setOnInsert: { pointsHistory: [], tierHistory: [] } },
    { upsert: true, new: true },
  );

  await RecommendationModel.findOneAndUpdate(
    { userId: b1 },
    { $set: { recommendedProducts: [{ productId: String(products.smartphone._id), score: 96, reason: 'purchase_history' }, { productId: String(products.wirelessMouse._id), score: 88, reason: 'similar_to_viewed' }], trending: [{ productId: String(products.laptop._id), category: 'laptops', trendScore: 92, period: 'week' }], lastUpdated: new Date() } },
    { upsert: true, new: true },
  );

  await DynamicPricingModel.findOneAndUpdate(
    { productId: String(products.smartphone._id) },
    { $set: { basePriceUSD: 849, currentPrice: 829, demandScore: 0.88, rules: [{ type: 'demand_based', condition: { minDemandScore: 0.85 }, priceModifier: 0.98, priority: 1, active: true }] } },
    { upsert: true, new: true },
  );

  await NotificationPreferenceModel.findOneAndUpdate(
    { userId: b1 },
    { $set: { channels: { email: true, sms: true, push: true, inApp: true }, eventTypes: { order: true, payment: true, shipping: true, promo: true, referral: true, newProduct: true }, frequency: 'real_time', timezone: 'Asia/Kolkata' } },
    { upsert: true, new: true },
  );

  await NotificationPreferenceModel.findOneAndUpdate(
    { userId: b2 },
    { $set: { channels: { email: true, sms: false, push: true, inApp: true }, eventTypes: { order: true, payment: true, shipping: true, promo: false, referral: true, newProduct: false }, frequency: 'daily_digest', timezone: 'Asia/Kolkata' } },
    { upsert: true, new: true },
  );

  await ReturnModel.findOneAndUpdate(
    { orderId: 'seed-order-001', buyerId: b1 },
    { $set: { reason: 'defective_product', description: 'Laptop screen has a dead pixel in the top-left corner.', items: [{ productId: String(products.laptop._id), quantity: 1, unitPrice: 52999 }], status: 'requested' } },
    { upsert: true, new: true },
  );

  await FraudDetectionModel.findOneAndUpdate(
    { orderId: 'seed-order-001', buyerId: b1 },
    { $set: { riskScore: 12, riskLevel: 'low', indicators: [], action: 'allow', reviewStatus: 'cleared' } },
    { upsert: true, new: true },
  );

  console.log('✓ Seeded carts, loyalty, recommendations, dynamic pricing, notifications, returns, fraud data');
}

// ─── 10. PostgreSQL data ──────────────────────────────────────────────────────

async function seedPostgres(users, products) {
  const { admin, seller1, buyer1, buyer2 } = users;
  const { laptop } = products;
  const adminId = String(admin._id);
  const seller1Id = String(seller1._id);
  const buyer1Id = String(buyer1._id);
  const buyer2Id = String(buyer2._id);
  const laptopId = String(laptop._id);

  // Seller KYC records
  const sellers = [
    { sellerId: String(users.seller1._id), pan: 'AABCT1234A', gst: '27AABCT1234A1Z5', name: 'TechMart India Pvt Ltd', type: 'private_limited' },
    { sellerId: String(users.seller2._id), pan: 'AAGFF5678B', gst: '07AAGFF5678B1Z3', name: 'FashionHub Retail LLP', type: 'llp' },
    { sellerId: String(users.seller3._id), pan: 'AABCB9012C', gst: '29AABCB9012C1Z8', name: 'BookWorld Digital Pvt Ltd', type: 'private_limited' },
    { sellerId: String(users.seller4._id), pan: 'AACFS3456D', gst: '24AACFS3456D1Z2', name: 'FitZone Sports India Pvt Ltd', type: 'private_limited' },
  ];

  for (const seller of sellers) {
    await postgresPool.query(
      `INSERT INTO seller_kyc (id, seller_id, pan_number, gst_number, legal_name, business_type, verification_status, documents, reviewed_by, submitted_at, reviewed_at)
       VALUES ($1,$2,$3,$4,$5,$6,'verified',$7,$8,NOW(),NOW())
       ON CONFLICT (seller_id) DO UPDATE SET
         pan_number=EXCLUDED.pan_number, gst_number=EXCLUDED.gst_number, legal_name=EXCLUDED.legal_name,
         business_type=EXCLUDED.business_type, verification_status='verified', reviewed_by=EXCLUDED.reviewed_by, reviewed_at=NOW(), updated_at=NOW()`,
      [uuidv4(), seller.sellerId, seller.pan, seller.gst, seller.name, seller.type, JSON.stringify({ source: 'seed' }), adminId],
    );
  }

  // Orders
  const orderId1 = uuidv4();
  const orderId2 = uuidv4();
  const existing1 = await postgresPool.query('SELECT id FROM orders WHERE buyer_id=$1 LIMIT 1', [buyer1Id]);
  if (!existing1.rows[0]) {
    await postgresPool.query(
      `INSERT INTO orders (id,buyer_id,status,currency,subtotal_amount,discount_amount,tax_amount,total_amount,shipping_address,wallet_discount_amount,payable_amount,tax_breakup)
       VALUES ($1,$2,'delivered','INR',$3,0,$4,$5,$6,0,$5,$7)`,
      [orderId1, buyer1Id, 52999, 9539.82, 62538.82, JSON.stringify({ line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' }), JSON.stringify({ taxableAmount: 52999, cgstAmount: 4769.91, sgstAmount: 4769.91, igstAmount: 0, totalTaxAmount: 9539.82, taxMode: 'cgst_sgst' })],
    );
    const oi1 = uuidv4();
    await postgresPool.query(
      `INSERT INTO order_items (id,order_id,product_id,seller_id,quantity,unit_price,line_total) VALUES ($1,$2,$3,$4,1,$5,$5)`,
      [oi1, orderId1, laptopId, seller1Id, 52999],
    );
    await postgresPool.query(
      `INSERT INTO payments (id,order_id,buyer_id,provider,status,amount,currency,transaction_reference,provider_order_id,provider_payment_id,verification_method,metadata,verified_at)
       VALUES ($1,$2,$3,'razorpay','captured',$4,'INR',$5,$6,$7,'webhook',$8,NOW())`,
      [uuidv4(), orderId1, buyer1Id, 62538.82, `txn_${orderId1.slice(0,8)}`, `ord_${orderId1.slice(0,8)}`, `pay_${orderId1.slice(0,8)}`, JSON.stringify({ source: 'seed' })],
    );
  }

  const existing2 = await postgresPool.query('SELECT id FROM orders WHERE buyer_id=$1 LIMIT 1', [buyer2Id]);
  if (!existing2.rows[0]) {
    await postgresPool.query(
      `INSERT INTO orders (id,buyer_id,status,currency,subtotal_amount,discount_amount,tax_amount,total_amount,shipping_address,wallet_discount_amount,payable_amount,tax_breakup)
       VALUES ($1,$2,'confirmed','INR',$3,0,$4,$5,$6,0,$5,$7)`,
      [orderId2, buyer2Id, 1198, 143.76, 1341.76, JSON.stringify({ line1: 'B-12 Lajpat Nagar', city: 'New Delhi', state: 'Delhi', postalCode: '110024' }), JSON.stringify({ taxableAmount: 1198, cgstAmount: 71.88, sgstAmount: 71.88, igstAmount: 0, totalTaxAmount: 143.76, taxMode: 'cgst_sgst' })],
    );
    const oi2 = uuidv4();
    await postgresPool.query(
      `INSERT INTO order_items (id,order_id,product_id,seller_id,quantity,unit_price,line_total) VALUES ($1,$2,$3,$4,2,599,1198)`,
      [oi2, orderId2, String(products.tshirt._id), String(users.seller2._id)],
    );
  }

  // Wallets
  for (const [userId, balance] of [[buyer1Id, 2500], [buyer2Id, 500]]) {
    const existing = await postgresPool.query('SELECT id FROM wallets WHERE user_id=$1 LIMIT 1', [userId]);
    if (!existing.rows[0]) {
      await postgresPool.query('INSERT INTO wallets (id,user_id,available_balance,locked_balance,created_at) VALUES ($1,$2,$3,0,NOW())', [uuidv4(), userId, balance]);
    }
  }

  // Vendor payouts
  await postgresPool.query(
    `INSERT INTO vendor_payouts (id,seller_id,period_start,period_end,gross_amount,commission_amount,processing_fee_amount,tax_withheld_amount,net_payout_amount,currency,status,scheduled_at,metadata)
     VALUES ($1,$2,NOW()-INTERVAL '7 days',NOW(),52999,5299.9,120,529.99,47049.11,'INR','scheduled',NOW(),$3)
     ON CONFLICT DO NOTHING`,
    [uuidv4(), seller1Id, JSON.stringify({ source: 'seed' })],
  );

  // Platform fee config
  const categories = [
    ['electronics', 8, 10, 5],
    ['mobiles', 6, 10, 5],
    ['laptops', 5, 15, 8],
    ['fashion', 12, 0, 0],
    ['mens-clothing', 12, 0, 0],
    ['womens-clothing', 12, 0, 0],
    ['footwear', 10, 0, 0],
    ['books', 5, 0, 0],
    ['sports-fitness', 8, 5, 3],
    ['beauty', 10, 5, 3],
    ['grocery', 3, 5, 0],
  ];

  for (const [category, commission, fixed, closing] of categories) {
    const existing = await postgresPool.query('SELECT id FROM platform_fee_config WHERE category=$1 AND active=true LIMIT 1', [category]);
    if (!existing.rows[0]) {
      await postgresPool.query(
        `INSERT INTO platform_fee_config (id,category,commission_percent,fixed_fee_amount,closing_fee_amount,active,effective_from,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW(),NOW())`,
        [uuidv4(), category, commission, fixed, closing],
      );
    }
  }

  // Shipping zones & rates
  if (await pgTableExists('shipping_zones')) {
    const zones = [
      [uuidv4(), 'SOUTH_METRO', 'South Metro', 'IN', ['KARNATAKA', 'TAMIL_NADU', 'TELANGANA', 'ANDHRA_PRADESH']],
      [uuidv4(), 'WEST_METRO', 'West Metro', 'IN', ['MAHARASHTRA', 'GUJARAT', 'GOA']],
      [uuidv4(), 'NORTH_METRO', 'North Metro', 'IN', ['DELHI', 'HARYANA', 'PUNJAB', 'UTTAR_PRADESH', 'RAJASTHAN']],
      [uuidv4(), 'EAST_METRO', 'East Metro', 'IN', ['WEST_BENGAL', 'ODISHA', 'JHARKHAND', 'BIHAR']],
      [uuidv4(), 'REST_OF_INDIA', 'Rest of India', 'IN', []],
    ];
    for (const [id, code, name, country, states] of zones) {
      await postgresPool.query(
        `INSERT INTO shipping_zones (id,zone_code,zone_name,country_code,states,active) VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT (zone_code) DO NOTHING`,
        [id, code, name, country, JSON.stringify(states)],
      );
    }
  }

  if (await pgTableExists('shipping_rates')) {
    const rates = [
      ['SOUTH_METRO', 'express', 0, 500, 79, 30, 20],
      ['SOUTH_METRO', 'standard', 0, 1000, 49, 20, 15],
      ['SOUTH_METRO', 'standard', 1001, 5000, 79, 15, 15],
      ['WEST_METRO', 'express', 0, 500, 79, 30, 20],
      ['WEST_METRO', 'standard', 0, 1000, 49, 20, 15],
      ['NORTH_METRO', 'standard', 0, 1000, 59, 20, 15],
      ['NORTH_METRO', 'express', 0, 500, 89, 30, 20],
      ['REST_OF_INDIA', 'standard', 0, 1000, 69, 25, 15],
    ];
    for (const [zone, mode, wMin, wMax, base, perKg, cod] of rates) {
      const ex = await postgresPool.query('SELECT id FROM shipping_rates WHERE zone_code=$1 AND shipping_mode=$2 AND weight_min_grams=$3 AND weight_max_grams=$4 LIMIT 1', [zone, mode, wMin, wMax]);
      if (!ex.rows[0]) {
        await postgresPool.query(
          `INSERT INTO shipping_rates (id,zone_code,shipping_mode,weight_min_grams,weight_max_grams,base_fee,per_kg_fee,cod_fee,currency,active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'INR',true)`,
          [uuidv4(), zone, mode, wMin, wMax, base, perKg, cod],
        );
      }
    }
  }

  if (await pgTableExists('pincode_serviceability')) {
    const pincodes = [
      ['560001', 'Bengaluru', 'KARNATAKA', 'SOUTH_METRO', true, true, 2],
      ['560034', 'Bengaluru', 'KARNATAKA', 'SOUTH_METRO', true, true, 2],
      ['400001', 'Mumbai', 'MAHARASHTRA', 'WEST_METRO', true, true, 2],
      ['400614', 'Navi Mumbai', 'MAHARASHTRA', 'WEST_METRO', true, true, 3],
      ['110001', 'New Delhi', 'DELHI', 'NORTH_METRO', true, true, 2],
      ['110024', 'New Delhi', 'DELHI', 'NORTH_METRO', true, true, 2],
      ['380001', 'Ahmedabad', 'GUJARAT', 'WEST_METRO', true, true, 3],
      ['700001', 'Kolkata', 'WEST_BENGAL', 'EAST_METRO', true, false, 4],
      ['600001', 'Chennai', 'TAMIL_NADU', 'SOUTH_METRO', true, true, 3],
      ['500001', 'Hyderabad', 'TELANGANA', 'SOUTH_METRO', true, true, 3],
    ];
    for (const [pincode, city, state, zone, serviceable, cod, days] of pincodes) {
      await postgresPool.query(
        `INSERT INTO pincode_serviceability (id,pincode,city,state,zone_code,serviceable,cod_available,estimated_delivery_days)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (pincode) DO NOTHING`,
        [uuidv4(), pincode, city, state, zone, serviceable, cod, days],
      );
    }
  }

  // Subscription plans
  if (await pgTableExists('platform_subscription_plans')) {
    const plans = [
      ['SELLER_STARTER', 'Seller Starter', 'Basic seller listing with up to 50 products.', ['seller'], ['basic_listing'], 499, 4999],
      ['SELLER_GROWTH', 'Seller Growth', 'Growth toolkit: up to 500 products, analytics, priority support.', ['seller'], ['catalog_boost', 'analytics', 'priority_support'], 999, 9999],
      ['SELLER_PRO', 'Seller Pro', 'Full catalog, advanced analytics, dedicated account manager.', ['seller'], ['unlimited_catalog', 'advanced_analytics', 'dedicated_am', 'priority_support', 'catalog_boost'], 2499, 24999],
    ];
    for (const [code, title, desc, roles, flags, monthly, yearly] of plans) {
      await postgresPool.query(
        `INSERT INTO platform_subscription_plans (id,plan_code,title,description,target_roles,feature_flags,monthly_price,yearly_price,currency,active,metadata,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'INR',true,$9,NOW(),NOW()) ON CONFLICT (plan_code) DO NOTHING`,
        [uuidv4(), code, title, desc, JSON.stringify(roles), JSON.stringify(flags), monthly, yearly, JSON.stringify({ source: 'seed' })],
      );
    }
  }

  console.log('✓ Seeded PostgreSQL data: KYC, orders, payments, wallets, payouts, fee config, shipping, subscriptions');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await connectMongo();
  console.log('✓ MongoDB connected\n');

  const passwordHash = await hashText('Password@123');

  const users = await seedUsers(passwordHash);
  await seedCategories();
  await seedHsnCodes();
  await seedGeographies();
  await seedAdminCommonManagement();
  await seedPlatformManagement();
  await seedCmsContent();

  const products = await seedProducts(users);
  await seedProductFamilies(users, products);
  await seedReviews(users, products);
  await seedEngagement(users, products);
  try {
    await seedPostgres(users, products);
  } catch (error) {
    console.warn(`⚠ Skipping PostgreSQL seeding: ${error.message || error}`);
  }

  console.log('\n✅ Development data seeded successfully!');
  console.log('\nTest credentials (password: Password@123):');
  console.log('  admin@example.com        — Admin');
  console.log('  subadmin@example.com     — Sub Admin (products, orders, users, returns, sellers)');
  console.log('  techmart@example.com     — Seller (Electronics)');
  console.log('  fashionhub@example.com   — Seller (Fashion)');
  console.log('  bookworld@example.com    — Seller (Books / Digital)');
  console.log('  fitzone@example.com      — Seller (Sports / Fitness)');
  console.log('  buyer1@example.com       — Buyer (Gold loyalty tier)');
  console.log('  buyer2@example.com       — Buyer (Silver loyalty tier)');
}

main()
  .catch((error) => {
    process.stderr.write(`\n❌ Seeding failed: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await postgresPool.end();
    process.exit();
  });
