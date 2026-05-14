#!/usr/bin/env node
"use strict";

const path = require("path");
const { pathToFileURL } = require("url");

const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { ContentPageModel } = require("../../src/modules/platform/models/content-page.model");

const CUSTOMER_DATA_DIR = path.resolve(__dirname, "../../../customer/src/data");
const PUBLISHED_AT = new Date("2026-01-01T00:00:00.000Z");

const img = {
  about: "/image/png/aboutBanner.png",
  app: "/image/png/ForYou.png",
  beauty: "/image/png/Beauty.png",
  brand: "/image/png/BrandAndPartnershipDiscussions.png",
  cashback: "/image/svg/caseBack.svg",
  deals: "/image/png/off.png",
  electronics: "/image/png/Electronics.png",
  exchange: "/image/svg/exchange.svg",
  fashion: "/image/png/model.png",
  footerGift: "/image/svg/gift.svg",
  gift: "/image/png/FusionLehenga.png",
  growth: "/image/png/growth.png",
  help: "/image/png/GeneralInquiries.png",
  home: "/image/jpg/home-decor.jpg",
  logo: "/image/png/logo.png",
  payment: "/image/png/Payment.png",
  return: "/image/png/Return.png",
  shipping: "/image/svg/shipping.svg",
  seller: "/image/png/StoreAndRetailOpportunities.png",
  smartHome: "/image/jpg/smart-home.jpg",
  story: "/image/png/ourStory.png",
};

function parseArgs(argv = []) {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

async function importCustomerData(fileName) {
  const fileUrl = pathToFileURL(path.join(CUSTOMER_DATA_DIR, fileName)).href;
  return import(fileUrl);
}

function kebab(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function markdownList(items = []) {
  return items.map((item) => `- ${item}`).join("\n");
}

function bodyFromPolicy(data) {
  const lines = [`# ${data.title || "Policy"}`];
  if (data.intro?.heading) lines.push(`\n## ${data.intro.heading}`);
  if (data.intro?.description) lines.push(data.intro.description);
  for (const section of data.sections || []) {
    lines.push(`\n## ${section.title}`);
    if (section.description) lines.push(section.description);
    if (Array.isArray(section.points) && section.points.length) {
      lines.push(markdownList(section.points));
    }
    if (section.footer) lines.push(section.footer.replace(/<[^>]+>/g, ""));
  }
  return lines.filter(Boolean).join("\n\n");
}

function bodyFromMarketing(page) {
  const lines = [`# ${page.title}`, page.description];
  for (const section of page.sections || []) {
    lines.push(`\n## ${section.title}`);
    if (section.subtitle) lines.push(section.subtitle);
    for (const item of section.items || []) {
      lines.push(`\n### ${item.title}`);
      lines.push(item.description);
    }
  }
  return lines.filter(Boolean).join("\n\n");
}

function bodyFromItems(title, description, items = []) {
  const lines = [`# ${title}`, description];
  for (const item of items) {
    lines.push(`\n## ${item.title || item.question}`);
    lines.push(item.description || item.answer || "");
  }
  return lines.filter(Boolean).join("\n\n");
}

function gallery(...images) {
  return [...new Set(images.filter(Boolean))];
}

function pageRecord({
  slug,
  title,
  pageType,
  body,
  excerpt = "",
  routePath = "",
  data = null,
  heroImage = img.about,
  coverImage = heroImage,
  thumbnailUrl = coverImage,
  tags = [],
  metadata = {},
}) {
  const galleryImages = gallery(heroImage, coverImage, thumbnailUrl, ...(metadata.images || []));
  return {
    slug,
    title,
    pageType,
    body,
    excerpt,
    tags,
    heroImage,
    coverImage,
    thumbnailUrl,
    galleryImages,
    language: "en",
    published: true,
    publishedAt: PUBLISHED_AT,
    metadata: {
      ...metadata,
      cmsKey: slug,
      routePath,
      data,
      heroImage,
      coverImage,
      thumbnailUrl,
    },
  };
}

function footerData() {
  return {
    cmsKey: "footer-links",
    benefits: [
      { title: "10% Cashback on all App orders", description: "Enjoy exclusive savings on every purchase.", icon: img.cashback, alt: "Cashback" },
      { title: "30 days Easy Returns & Exchanges", description: "Hassle-free returns with customer-first policies.", icon: img.exchange, alt: "Returns and exchanges" },
      { title: "Free & Fast Shipping", description: "Reliable and quick delivery across locations.", icon: img.shipping, alt: "Shipping" },
    ],
    linkGroups: [
      { title: "Buy", links: [{ label: "Men", href: "/categories/men" }, { label: "Women", href: "/categories/women" }, { label: "Kids", href: "/categories/kids" }, { label: "Accessories", href: "/categories/accessories" }, { label: "Footwear", href: "/categories/footwear" }] },
      { title: "Sell", links: [{ label: "Become a Seller", href: "/seller/status" }, { label: "Seller Dashboard", href: "/seller/status" }, { label: "Seller Policies", href: "/seller-policies" }, { label: "Growth Support", href: "/growth-support" }] },
      { title: "About SAM", links: [{ label: "Who We Are", href: "/who-we-are" }, { label: "Why Choose Us", href: "/why-choose-us" }, { label: "Our Commitment", href: "/our-commitment" }, { label: "Features", href: "/features" }] },
      { title: "Tools & apps", links: [{ label: "Mobile App", href: "/mobile-app" }, { label: "Seller Tools", href: "/seller/status" }, { label: "Analytics Dashboard", href: "/seller/tracking" }] },
      { title: "Help & Contact", links: [{ label: "Customer Support", href: "/support" }, { label: "FAQs", href: "/faq" }, { label: "Returns", href: "/returns" }, { label: "Terms of Use", href: "/terms-of-use" }, { label: "Shipping Policy", href: "/shipping-policy" }, { label: "Refund Policy", href: "/refund-policy" }] },
      { title: "Community", links: [{ label: "Blog", href: "/blog" }, { label: "Updates", href: "/updates" }, { label: "Announcements", href: "/announcements" }] },
    ],
    actionLinks: [
      { label: "Become a Seller", href: "/seller/status", icon: "/image/svg/seller.svg", alt: "Seller" },
      { label: "Advertise", href: "/advertise", icon: "/image/svg/advertise.svg", alt: "Advertise" },
      { label: "Gift Cards", href: "/gift-cards", icon: img.footerGift, alt: "Gift cards" },
      { label: "Help Center", href: "/help-contact", icon: "/image/svg/help.svg", alt: "Help center" },
    ],
    appDownload: {
      title: "Download our app for a faster and smarter shopping experience.",
      links: [
        { label: "Download on the App Store", href: "#", image: "/image/svg/appStore.svg", alt: "Download on the App Store" },
        { label: "Get it on Google Play", href: "#", image: "/image/svg/playStore.svg", alt: "Get it on Google Play" },
      ],
    },
    copyright: "Sam Global - Smart Choices. Better Living.",
    socialLinks: [
      { label: "Instagram", href: "#", icon: "/image/svg/youtube.svg", alt: "Instagram" },
      { label: "Facebook", href: "#", icon: "/image/svg/facebook.svg", alt: "Facebook" },
      { label: "YouTube", href: "#", icon: "/image/svg/youtube.svg", alt: "YouTube" },
    ],
  };
}

function homeSectionRecords() {
  const seasonal = {
    cmsKey: "home-seasonal-carousel",
    slides: [
      { name: "Personalized Gifts", image: "/image/png/maxi.png", link: "/gift-cards" },
      { name: "Fashion Gifts", image: "/image/png/blazer.png", link: "/categories/fashion" },
      { name: "Beauty & Personal Care", image: "/image/png/pants.png", link: "/categories/beauty" },
      { name: "Home & Lifestyle", image: "/image/jpg/home-decor.jpg", link: "/categories/home-decor" },
    ],
  };
  const support = {
    cmsKey: "home-help-support",
    items: [
      { icon: "/image/png/Order.png", title: "Where is my order?", description: "Track your order status in real-time through your account dashboard." },
      { icon: "/image/png/Return.png", title: "How do returns work?", description: "Simple and hassle-free return process within the defined return window." },
      { icon: "/image/png/Payment.png", title: "Payment Methods", description: "We support secure payments via cards, UPI, net banking, and wallets." },
    ],
  };
  const about = {
    cmsKey: "home-about-sections",
    mission: {
      title: "Our Mission",
      description: "Our mission is to build one of India's most execution-focused retail networks, delivering high-performance stores and consistent brand experiences.",
      image: "/image/png/hand.png",
    },
    story: {
      description: "Sam Global is built on over 18+ years of experience in FMCG distribution and customer selling, with a strong foundation in execution and scale.",
      image: img.story,
    },
    values: [
      { icon: "/image/png/excellence.png", title: "Execution Excellence", description: "Every store, customer interaction, and process is driven by performance and discipline." },
      { icon: "/image/png/customer.png", title: "Customer First", description: "Our approach is built around understanding Indian consumers and delivering consistent retail experiences." },
      { icon: "/image/png/growth.png", title: "Scalable Growth", description: "We focus on systems and processes that support sustainable expansion across markets." },
    ],
  };

  return [
    pageRecord({
      slug: seasonal.cmsKey,
      title: "Home Seasonal Carousel",
      pageType: "home_section",
      body: bodyFromItems("Home Seasonal Carousel", "Carousel slides for the home shopping experience.", seasonal.slides),
      routePath: "/",
      data: seasonal,
      heroImage: "/image/png/maxi.png",
      coverImage: "/image/png/blazer.png",
      thumbnailUrl: "/image/png/pants.png",
      metadata: { placement: "home.seasonal", images: seasonal.slides.map((slide) => slide.image) },
    }),
    pageRecord({
      slug: support.cmsKey,
      title: "Home Help Support",
      pageType: "home_section",
      body: bodyFromItems("Home Help Support", "Support cards shown on the home page.", support.items),
      routePath: "/",
      data: support,
      heroImage: img.help,
      coverImage: img.payment,
      thumbnailUrl: img.return,
      metadata: { placement: "home.support", images: support.items.map((item) => item.icon) },
    }),
    pageRecord({
      slug: about.cmsKey,
      title: "Home About Sections",
      pageType: "home_section",
      body: bodyFromItems("Home About Sections", about.mission.description, about.values),
      routePath: "/",
      data: about,
      heroImage: about.mission.image,
      coverImage: about.story.image,
      thumbnailUrl: "/image/png/excellence.png",
      metadata: { placement: "home.about", images: [about.mission.image, about.story.image, ...about.values.map((item) => item.icon)] },
    }),
  ];
}

function commerceShowcaseRecords() {
  const topDeals = [
    { cmsKey: "top-deal-fusion-lehenga", title: "Fusion Lehenga", image: "/image/png/FusionLehenga.png", price: 9993, oldPrice: 11199 },
    { cmsKey: "top-deal-mens-wear", title: "Men's Wear", image: "/image/png/stylish-mens-kurtas 1.png", price: 993, oldPrice: 1199 },
    { cmsKey: "top-deal-jewelled-watches", title: "Jewelled Watches", image: "/image/png/gold-watch-with-rhinestones 1.png", price: 9993, oldPrice: 11199 },
    { cmsKey: "top-deal-formal-shoes", title: "Formal Shoes", image: "/image/png/stylish-pair.png", price: 993, oldPrice: 1199 },
  ];
  const arrivals = [
    { cmsKey: "arrival-diamond-jewelry-sets", title: "Diamond-Like Simulant Jewelry Sets", views: "66K+", images: ["/image/png/SimulantJewelrySets.png", "/image/png/Ring.png"], price: 9993, oldPrice: 11199 },
    { cmsKey: "arrival-trendy-outfits", title: "Trendy Outfits for Men & Women", views: "66K+", images: ["/image/jpg/stylish-girls.jpg", "/image/png/blazer.png"], price: 9993, oldPrice: 11199 },
    { cmsKey: "arrival-fragrances", title: "Fine Mist Unisex Fragrances", views: "66K+", images: ["/image/png/SprayBottle.png", "/image/png/Perfume.png"], price: 9993, oldPrice: 11199 },
  ];
  const categories = [
    { cmsKey: "static-category-womens-fashion", title: "Women's Fashion", image: "/image/jpg/stylish-girls.jpg" },
    { cmsKey: "static-category-mens-fashion", title: "Men's Fashion", image: "/image/png/men-fashion.png" },
    { cmsKey: "static-category-kids-collection", title: "Kids Collection", image: "/image/jpg/kids-fashion.jpg" },
    { cmsKey: "static-category-home-decor", title: "Home Decor", image: "/image/jpg/home-decor.jpg" },
    { cmsKey: "static-category-smart-home", title: "Smart Home", image: "/image/jpg/smart-home.jpg" },
  ];
  const productsForYou = [
    { cmsKey: "for-you-burberry-jacket", title: "Burberry Jacket", subtitle: "Embroidered hooded wax jacket in black", image: "/image/jpg/stylish-girls.jpg", rating: 5, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-lace-dress", title: "Lace Dress", subtitle: "Elegant lace long sleeve midi dress in black", image: "/image/jpg/kids-fashion.jpg", rating: 4, price: 950, oldPrice: 1180 },
    { cmsKey: "for-you-classic-fit-set", title: "Classic Fit Set", subtitle: "Classic fit full set for men in premium cotton", image: "/image/png/men-fashion.png", rating: 4, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-track-pants", title: "Track Pants", subtitle: "Men's classic loose fit track pants in green", image: "/image/jpg/smart-home.jpg", rating: 4, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-denim-street", title: "Denim Street", subtitle: "Relaxed denim fashion with shopping look", image: "/image/jpg/home-decor.jpg", rating: 5, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-mens-twin-set", title: "Men's Twin Set", subtitle: "Twin coordinated men style for festive wear", image: "/image/png/men-fashion.png", rating: 4, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-duo-shades", title: "Duo Shades", subtitle: "Casual duo look with sunglasses and denim", image: "/image/jpg/stylish-girls.jpg", rating: 4, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-kids-combo", title: "Kids Combo", subtitle: "Mini trend duo for boys and girls in grey", image: "/image/jpg/kids-fashion.jpg", rating: 4, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-premium-mist", title: "Premium Mist", subtitle: "Luxury fragrance mist bottle with night glow", image: "/image/png/Perfume.png", rating: 5, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-air-cooler", title: "Air Cooler", subtitle: "Compact room air cooler for daily comfort", image: "/image/jpg/smart-home.jpg", rating: 4, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-ethnic-duo", title: "Ethnic Duo", subtitle: "Festive kurta pair in contrast shades", image: "/image/png/men-fashion.png", rating: 4, price: 990, oldPrice: 1200 },
    { cmsKey: "for-you-handbag-duo", title: "Handbag Duo", subtitle: "Premium handbag set in coffee and beige", image: "/image/jpg/home-decor.jpg", rating: 4, price: 990, oldPrice: 1200 },
  ];
  const data = {
    cmsKey: "static-commerce-showcases",
    topDeals,
    arrivals,
    categories,
    productsForYou,
  };
  const images = [
    ...topDeals.map((item) => item.image),
    ...arrivals.flatMap((item) => item.images),
    ...categories.map((item) => item.image),
    ...productsForYou.map((item) => item.image),
  ];

  return [
    pageRecord({
      slug: "static-commerce-showcases",
      title: "Static Commerce Showcases",
      pageType: "static_data",
      body: bodyFromItems("Static Commerce Showcases", "Fallback cards for top deals, arrivals, categories, and products for you.", [...topDeals, ...arrivals, ...categories, ...productsForYou]),
      routePath: "static.data.commerce",
      data,
      heroImage: "/image/png/FusionLehenga.png",
      coverImage: "/image/jpg/stylish-girls.jpg",
      thumbnailUrl: "/image/png/Perfume.png",
      metadata: { images },
      tags: ["static", "commerce"],
    }),
  ];
}

async function buildPages() {
  const { marketingPages, faqItems, supportTopics, whyChooseUsItems, commitmentItems, featureItems } = await importCustomerData("staticPages.js");
  const { termsOfUseData } = await importCustomerData("termsOfUseData.js");
  const { shippingPolicyData } = await importCustomerData("shippingPolicyData.js");
  const { refundPolicyData } = await importCustomerData("refundPolicyData.js");
  const { faqData } = await importCustomerData("faqData.js");
  const { productDetailFAQ } = await importCustomerData("productDetailFAQ.js");
  const { productDetailData } = await importCustomerData("productDetails.js");
  const { topNavLinks, sellDropdownData, accountMenuItems } = await importCustomerData("header.js");

  const marketingImages = {
    deals: img.deals,
    "brand-outlet": img.fashion,
    "gift-cards": img.gift,
    "help-contact": img.help,
    "who-we-are": img.about,
    "mobile-app": img.app,
    "seller-policies": img.seller,
    "growth-support": img.growth,
    advertise: img.brand,
    blog: img.home,
    updates: img.smartHome,
    announcements: img.logo,
  };

  const pages = Object.entries(marketingPages).map(([key, page]) => {
    const slug = page.cmsKey || kebab(key);
    return pageRecord({
      slug,
      title: page.title,
      pageType: "static_page",
      body: bodyFromMarketing(page),
      excerpt: page.description,
      routePath: `/${slug}`,
      data: { ...page, cmsKey: slug },
      heroImage: marketingImages[slug] || img.about,
      coverImage: marketingImages[slug] || img.about,
      thumbnailUrl: marketingImages[slug] || img.about,
      tags: ["static", "customer"],
    });
  });

  const policyPages = [
    { slug: "terms-of-use", routePath: "/terms-of-use", data: termsOfUseData, image: img.logo },
    { slug: "terms-and-conditions", routePath: "/terms-and-conditions", data: { ...termsOfUseData, title: "Terms and Conditions" }, image: img.logo },
    { slug: "shipping-policy", routePath: "/shipping-policy", data: shippingPolicyData, image: img.shipping },
    { slug: "refund-policy", routePath: "/refund-policy", data: refundPolicyData, image: img.return },
    { slug: "return-refund-policy", routePath: "/return-refund-policy", data: refundPolicyData, image: img.return },
  ].map((item) =>
    pageRecord({
      slug: item.slug,
      title: item.data.title,
      pageType: "legal",
      body: bodyFromPolicy(item.data),
      excerpt: item.data.intro?.description || "",
      routePath: item.routePath,
      data: { ...item.data, cmsKey: item.slug },
      heroImage: item.image,
      coverImage: item.image,
      thumbnailUrl: item.image,
      tags: ["policy", "legal"],
      metadata: { footerGroup: "help", version: "1.0", seoTitle: item.data.title },
    }),
  );

  pages.push(
    ...policyPages,
    pageRecord({
      slug: "faq",
      title: "Frequently Asked Questions",
      pageType: "faq",
      body: bodyFromItems("Frequently Asked Questions", "Quick answers for common shopping questions.", faqItems),
      excerpt: "Quick answers for orders, payments, deliveries, and returns.",
      routePath: "/faq",
      data: { cmsKey: "faq", eyebrow: "Support", title: "Frequently Asked Questions", description: "Quick answers for the most common questions about orders, payments, deliveries, and returns.", ctaText: "Visit Support Center", ctaTo: "/support", questions: faqItems, groupedQuestions: faqData },
      heroImage: img.help,
      coverImage: img.help,
      thumbnailUrl: img.logo,
      tags: ["faq", "support"],
    }),
    pageRecord({
      slug: "support-center",
      title: "Support Center",
      pageType: "support",
      body: bodyFromItems("Support Center", "Find support for orders, returns, account issues, and product questions.", supportTopics),
      excerpt: "Find the right support path for orders, returns, account issues, and product questions.",
      routePath: "/support",
      data: { cmsKey: "support-center", eyebrow: "Help center", title: "Support Center", description: "Find the right support path for orders, returns, account issues, and product questions.", ctaText: "Browse FAQs", ctaTo: "/faq", topics: supportTopics },
      heroImage: img.payment,
      coverImage: img.help,
      thumbnailUrl: img.return,
      tags: ["support"],
    }),
    pageRecord({
      slug: "why-choose-us",
      title: "Why Choose Us",
      pageType: "static_page",
      body: bodyFromItems("Why Choose Us", "The reasons customers keep choosing Sam Global.", whyChooseUsItems),
      excerpt: "Enjoy curated products, meaningful savings, fast delivery, and customer-first service.",
      routePath: "/why-choose-us",
      data: { cmsKey: "why-choose-us", eyebrow: "Why choose us", title: "Shop with confidence at Sam Global", description: "Enjoy curated products, meaningful savings, fast delivery, and customer service built around your needs.", ctaText: "See features", ctaTo: "/features", items: whyChooseUsItems },
      heroImage: img.fashion,
      coverImage: img.about,
      thumbnailUrl: img.logo,
      tags: ["company"],
    }),
    pageRecord({
      slug: "our-commitment",
      title: "Our Commitment",
      pageType: "static_page",
      body: bodyFromItems("Our Commitment", "Meaningful service, clear policies, and quality first.", commitmentItems),
      excerpt: "Clear policies, dependable service, and continuous improvement.",
      routePath: "/our-commitment",
      data: { cmsKey: "our-commitment", eyebrow: "Our promise", title: "Committed to quality, transparency, and every customer", description: "We keep our promises with clear policies, dependable service, and continuous improvement.", ctaText: "Browse support", ctaTo: "/support", items: commitmentItems },
      heroImage: img.story,
      coverImage: img.about,
      thumbnailUrl: img.logo,
      tags: ["company"],
    }),
    pageRecord({
      slug: "features",
      title: "Features",
      pageType: "static_page",
      body: bodyFromItems("Features", "Smart shopping features built to help customers move faster.", featureItems),
      excerpt: "Explore the tools and experiences that make Sam Global fast, secure, and easy to use.",
      routePath: "/features",
      data: { cmsKey: "features", eyebrow: "Features", title: "Features designed for effortless shopping", description: "Explore the tools and experiences that make Sam Global fast, secure, and easy to use.", items: featureItems },
      heroImage: img.electronics,
      coverImage: img.smartHome,
      thumbnailUrl: img.logo,
      tags: ["platform"],
    }),
    pageRecord({
      slug: "footer-links",
      title: "Footer Links",
      pageType: "footer",
      body: "Footer navigation, benefits, app download links, actions, payment labels, and social links.",
      routePath: "global.footer",
      data: footerData(),
      heroImage: img.logo,
      coverImage: img.logo,
      thumbnailUrl: img.logo,
      metadata: { groups: footerData().linkGroups, socialLinks: footerData().socialLinks },
    }),
    pageRecord({
      slug: "header-navigation",
      title: "Header Navigation",
      pageType: "navigation",
      body: "Top navigation links, seller dropdown, and account menu data.",
      routePath: "global.header",
      data: { cmsKey: "header-navigation", topNavLinks, sellDropdownData, accountMenuItems },
      heroImage: img.logo,
      coverImage: img.fashion,
      thumbnailUrl: img.logo,
      tags: ["navigation"],
    }),
    pageRecord({
      slug: "product-detail-static-content",
      title: "Product Detail Static Content",
      pageType: "product_content",
      body: bodyFromItems("Product Detail Static Content", "Fallback product media and detail FAQ content.", productDetailFAQ),
      routePath: "/products/:productId",
      data: { cmsKey: "product-detail-static-content", productDetailData, productDetailFAQ },
      heroImage: productDetailData.images?.mainImage || img.fashion,
      coverImage: productDetailData.images?.sideImages?.[0]?.img || img.fashion,
      thumbnailUrl: productDetailData.images?.sideImages?.[1]?.img || img.fashion,
      metadata: { images: [productDetailData.images?.mainImage, ...(productDetailData.images?.sideImages || []).map((item) => item.img)] },
      tags: ["product"],
    }),
    ...homeSectionRecords(),
    ...commerceShowcaseRecords(),
  );

  return pages;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const pages = await buildPages();

  if (options.dryRun) {
    console.log(`Prepared ${pages.length} CMS static content records:`);
    pages.forEach((page) => console.log(`- ${page.slug} (${page.pageType})`));
    return;
  }

  await connectMongo();
  for (const page of pages) {
    await ContentPageModel.findOneAndUpdate(
      { slug: page.slug },
      { $set: page },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`Seeded ${pages.length} CMS static content records.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed CMS static content:", error.message || error);
    process.exit(1);
  });
