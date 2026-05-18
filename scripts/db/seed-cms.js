#!/usr/bin/env node
"use strict";

const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { StaticPageModel } = require("../../src/modules/cms/models/static-page.model");

const PUBLISHED_AT = new Date("2026-01-01T00:00:00.000Z");

function mkPage(slug, pageType, title, body, opts = {}) {
  return {
    slug,
    pageType,
    title,
    body,
    description: opts.description || "",
    coverImage: opts.coverImage || "",
    points: Array.isArray(opts.points) ? opts.points : [],
    language: opts.language || "en",
    published: opts.published !== false,
    publishedAt: opts.published !== false ? PUBLISHED_AT : undefined,
    metadata: opts.metadata || {},
  };
}

const PAGES = [
  mkPage(
    "privacy-policy",
    "privacy-policy",
    "Privacy Policy",
    "<h1>Privacy Policy</h1><p>We collect and process customer data only to fulfill orders and improve service quality.</p>",
    {
      description: "How customer data is collected, used and protected.",
      points: [
        { title: "Data Collection", description: "Name, email, phone, address and order details are collected for order fulfillment.", image: "" },
        { title: "Data Usage", description: "Data is used for delivery, support, fraud prevention and service improvements.", image: "" },
        { title: "Data Control", description: "Users can request correction/deletion of personal data through support.", image: "" },
      ],
      metadata: { footerGroup: "legal", order: 1 },
    },
  ),
  mkPage(
    "return-policy",
    "return-policy",
    "Return Policy",
    "<h1>Return Policy</h1><p>Most items can be returned within 30 days if unused and in original condition.</p>",
    {
      description: "Simple return and refund process.",
      points: [
        { title: "Return Window", description: "30 days from date of delivery.", image: "" },
        { title: "Pickup Process", description: "Free pickup in eligible areas within 2-3 business days.", image: "" },
        { title: "Refund Timeline", description: "Refund processed in 5-7 business days after quality check.", image: "" },
      ],
      metadata: { footerGroup: "legal", order: 2 },
    },
  ),
  mkPage(
    "payment-policy",
    "payment-policy",
    "Payment Policy",
    "<h1>Payment Policy</h1><p>Secure payment support for UPI, cards, net banking, wallet and COD on selected pin codes.</p>",
    {
      description: "Payment modes and transaction safety information.",
      points: [
        { title: "Accepted Modes", description: "UPI, Credit/Debit Cards, Net Banking, Wallet, COD.", image: "" },
        { title: "Security", description: "All payments are processed using PCI-compliant payment partners.", image: "" },
        { title: "Failed Transactions", description: "Auto reversal in 5-7 business days for failed payments.", image: "" },
      ],
      metadata: { footerGroup: "legal", order: 3 },
    },
  ),
  mkPage(
    "terms-and-conditions",
    "terms-and-conditions",
    "Terms & Conditions",
    "<h1>Terms & Conditions</h1><p>By using this platform, you agree to the marketplace terms and seller-buyer policies.</p>",
    {
      description: "Platform usage and legal terms.",
      points: [
        { title: "Account Responsibility", description: "Users are responsible for account activity and credential safety.", image: "" },
        { title: "Listing Rules", description: "Sellers must publish accurate product information.", image: "" },
        { title: "Policy Updates", description: "Terms may change and continued use implies acceptance.", image: "" },
      ],
      metadata: { footerGroup: "legal", order: 4 },
    },
  ),
  mkPage(
    "help-and-support",
    "help-and-support",
    "Help & Support",
    "<h1>Help & Support</h1><p>Contact us for orders, account issues, returns, refunds, and seller onboarding support.</p>",
    {
      description: "Customer and seller support details.",
      points: [
        { title: "Customer Support", description: "Email: support@samglobal.in | Phone: 1800-123-4567", image: "" },
        { title: "Seller Support", description: "Email: seller@samglobal.in for listing, payout and compliance help.", image: "" },
        { title: "Support Hours", description: "Mon-Sat, 9 AM - 7 PM IST.", image: "" },
      ],
      metadata: { footerGroup: "help", order: 5 },
    },
  ),
  mkPage(
    "faq-track-order",
    "faq",
    "How do I track my order?",
    "<p>You can track your shipment from My Orders using the tracking link.</p>",
    {
      description: "Order tracking steps.",
      points: [
        { title: "Open My Orders", description: "Login and open My Orders in account section.", image: "" },
        { title: "Choose Order", description: "Select the order and click Track Order.", image: "" },
        { title: "Live Updates", description: "See dispatch, transit and delivery updates in real time.", image: "" },
      ],
      metadata: { order: 1, category: "orders" },
    },
  ),
  mkPage(
    "faq-return-exchange",
    "faq",
    "How do I return or exchange an item?",
    "<p>Use My Orders > Return Item to create return or exchange requests.</p>",
    {
      description: "Return and exchange flow.",
      points: [
        { title: "Raise Request", description: "Select item and submit return/exchange reason.", image: "" },
        { title: "Pickup & Verification", description: "Item is picked up and verified by quality team.", image: "" },
        { title: "Refund or Exchange", description: "Refund is processed or replacement shipped post-verification.", image: "" },
      ],
      metadata: { order: 2, category: "returns" },
    },
  ),
  mkPage(
    "slide-summer-sale",
    "homepage-slide",
    "Summer Sale - Up To 60% Off",
    "<p>Discover weekly deals across fashion, electronics and essentials.</p>",
    {
      description: "Homepage hero campaign slide.",
      coverImage: "/image/png/model.png",
      points: [
        { title: "Category Deals", description: "Curated discounts in top customer categories.", image: "" },
        { title: "Limited Time", description: "Offer valid for a limited campaign window.", image: "" },
        { title: "Direct CTA", description: "Single click shop-now flow to campaign page.", image: "" },
      ],
      metadata: { ctaText: "Shop Now", ctaLink: "/categories/sale", order: 1 },
    },
  ),
  mkPage(
    "promo-welcome-offer",
    "promotion-banner",
    "Welcome Offer - 10% Off",
    "<p>Apply WELCOME10 at checkout to get first-order discount.</p>",
    {
      description: "First-order discount banner.",
      points: [
        { title: "Code", description: "Use coupon code WELCOME10.", image: "" },
        { title: "Eligibility", description: "Applies on first successful order.", image: "" },
        { title: "Placement", description: "Visible on homepage and cart banner.", image: "" },
      ],
      metadata: { code: "WELCOME10", discount: 10, type: "percent", placement: "homepage-top" },
    },
  ),
  mkPage(
    "about-us",
    "content",
    "About Us",
    "<h1>About Sam Global</h1><p>We build customer-first commerce operations with strong retail execution.</p>",
    {
      description: "Company story and operating principles.",
      points: [
        { title: "Customer First", description: "Experience design is driven by customer trust and convenience.", image: "" },
        { title: "Execution Focused", description: "Operational discipline in catalog, fulfillment and support.", image: "" },
        { title: "Scalable Systems", description: "Technology and process designed for consistent growth.", image: "" },
      ],
      metadata: { footerGroup: "company", order: 1 },
    },
  ),
  mkPage(
    "terms-of-use",
    "content",
    "Terms of Use",
    "<h1>Terms of Use</h1><p>These terms describe acceptable use of the Sam Global platform.</p>",
    {
      description: "Platform terms and responsibilities.",
      points: [
        { title: "Account Use", description: "Use your account responsibly and keep credentials secure.", image: "" },
        { title: "Prohibited Use", description: "No abuse, fraud, or misuse of platform workflows.", image: "" },
        { title: "Policy Updates", description: "Terms can be updated periodically with legal notice.", image: "" },
      ],
    },
  ),
  mkPage(
    "shipping-policy",
    "content",
    "Shipping Policy",
    "<h1>Shipping Policy</h1><p>Delivery timelines vary by pin code, seller location and product category.</p>",
    {
      description: "Shipping timelines and delivery standards.",
      points: [
        { title: "Standard Delivery", description: "Usually 3-7 business days for most locations.", image: "" },
        { title: "Express Delivery", description: "1-2 day delivery available in selected cities.", image: "" },
        { title: "Tracking", description: "Live order tracking available from My Orders.", image: "" },
      ],
    },
  ),
  mkPage(
    "refund-policy",
    "content",
    "Refund Policy",
    "<h1>Refund Policy</h1><p>Refunds are initiated after return pickup and quality verification.</p>",
    {
      description: "Refund process and timelines.",
      points: [
        { title: "Processing Time", description: "Refunds are processed within 5-7 business days.", image: "" },
        { title: "Payment Source", description: "Refunds are credited to original payment method.", image: "" },
        { title: "Support Escalation", description: "If delayed, contact support with order ID.", image: "" },
      ],
    },
  ),
  mkPage("deals", "content", "Deals", "<h1>Deals</h1><p>Explore ongoing deals across categories.</p>", {
    description: "Daily and seasonal marketplace deals.",
    points: [
      { title: "Daily Deals", description: "Fresh offers updated every day.", image: "" },
      { title: "Category Offers", description: "Special pricing by category and brand.", image: "" },
      { title: "Checkout Savings", description: "Combine coupons with selected promotions.", image: "" },
    ],
  }),
  mkPage("brand-outlet", "content", "Brand Outlet", "<h1>Brand Outlet</h1><p>Official brand stores with curated products and trusted warranties.</p>", {
    description: "Brand storefronts and exclusive collections.",
    points: [
      { title: "Verified Brands", description: "Shop from authentic and verified sellers.", image: "" },
      { title: "Exclusive Collections", description: "Brand-only offers and launches.", image: "" },
      { title: "Assured Support", description: "Clear service and return commitments.", image: "" },
    ],
  }),
  mkPage("gift-cards", "content", "Gift Cards", "<h1>Gift Cards</h1><p>Purchase digital gift cards and share with friends and family.</p>", {
    description: "Digital gift cards with easy redemption.",
    points: [
      { title: "Instant Delivery", description: "Gift cards are delivered instantly by email.", image: "" },
      { title: "Flexible Amounts", description: "Choose a value based on your budget.", image: "" },
      { title: "Easy Redemption", description: "Apply gift card balance at checkout.", image: "" },
    ],
  }),
  mkPage("help-contact", "content", "Help & Contact", "<h1>Help & Contact</h1><p>Reach support for product, order, and account assistance.</p>", {
    description: "All contact channels and help resources.",
    points: [
      { title: "Email Support", description: "support@samglobal.in", image: "" },
      { title: "Phone Support", description: "1800-123-4567", image: "" },
      { title: "Self Help", description: "Use FAQ and order tracking for faster resolution.", image: "" },
    ],
  }),
  mkPage("who-we-are", "content", "Who We Are", "<h1>Who We Are</h1><p>A commerce platform built for customer trust, seller growth and retail execution.</p>", {
    description: "Company overview and values.",
    points: [
      { title: "Customer Trust", description: "Transparent policies and reliable service commitments.", image: "" },
      { title: "Seller Growth", description: "Tools and support for partner success.", image: "" },
      { title: "Operational Scale", description: "Built for consistent performance across markets.", image: "" },
    ],
  }),
  mkPage("mobile-app", "content", "Mobile App", "<h1>Mobile App</h1><p>Shop faster, track orders, and get app-only offers.</p>", {
    description: "Benefits of shopping through mobile app.",
    points: [
      { title: "App-Only Offers", description: "Unlock exclusive promotions and cashback.", image: "" },
      { title: "Faster Checkout", description: "Saved addresses and payment methods.", image: "" },
      { title: "Real-time Notifications", description: "Receive order and delivery updates instantly.", image: "" },
    ],
  }),
  mkPage("seller-policies", "content", "Seller Policies", "<h1>Seller Policies</h1><p>Guidelines for listing quality, fulfillment and seller account compliance.</p>", {
    description: "Policy expectations for marketplace sellers.",
    points: [
      { title: "Listing Accuracy", description: "Product details must be accurate and complete.", image: "" },
      { title: "Fulfillment SLAs", description: "Dispatch and delivery standards must be met.", image: "" },
      { title: "Compliance", description: "Sellers must follow platform and legal requirements.", image: "" },
    ],
  }),
  mkPage("growth-support", "content", "Growth Support", "<h1>Growth Support</h1><p>Programs and insights to help sellers scale revenue and repeat buyers.</p>", {
    description: "Business growth resources for partners.",
    points: [
      { title: "Catalog Optimization", description: "Improve discoverability and conversion rates.", image: "" },
      { title: "Campaign Support", description: "Participate in events and seasonal promotions.", image: "" },
      { title: "Performance Insights", description: "Use analytics to improve order and return metrics.", image: "" },
    ],
  }),
  mkPage("advertise", "content", "Advertise", "<h1>Advertise</h1><p>Run targeted campaigns to reach high-intent shoppers.</p>", {
    description: "Advertising opportunities on platform.",
    points: [
      { title: "Sponsored Listings", description: "Promote products in relevant placements.", image: "" },
      { title: "Budget Control", description: "Set daily spend and campaign goals.", image: "" },
      { title: "Performance Tracking", description: "Track impressions, clicks and conversions.", image: "" },
    ],
  }),
  mkPage("blog", "content", "Blog", "<h1>Blog</h1><p>Discover buying guides, trends and practical shopping tips.</p>", {
    description: "Editorial and educational content for customers.",
    points: [
      { title: "Buying Guides", description: "Choose the right products for your needs.", image: "" },
      { title: "Trend Stories", description: "Seasonal trends and best-value picks.", image: "" },
      { title: "How-to Content", description: "Tips for setup, usage and maintenance.", image: "" },
    ],
  }),
  mkPage("updates", "content", "Updates", "<h1>Updates</h1><p>Latest platform improvements and service announcements.</p>", {
    description: "Product and platform updates.",
    points: [
      { title: "Feature Releases", description: "New customer and seller capabilities.", image: "" },
      { title: "Policy Changes", description: "Important service and process updates.", image: "" },
      { title: "Operational Notices", description: "Regional delivery and holiday updates.", image: "" },
    ],
  }),
  mkPage("announcements", "content", "Announcements", "<h1>Announcements</h1><p>Official communication regarding major launches and campaigns.</p>", {
    description: "Company and marketplace announcements.",
    points: [
      { title: "Campaign Announcements", description: "Major sale events and timelines.", image: "" },
      { title: "Partnership News", description: "New brands and strategic tie-ups.", image: "" },
      { title: "Service Notices", description: "Critical communications for users.", image: "" },
    ],
  }),
  mkPage("support-center", "content", "Support Center", "<h1>Support Center</h1><p>Find support for orders, returns, account and payments.</p>", {
    description: "Centralized support resources for customers.",
    points: [
      { title: "Order Support", description: "Track, cancel, and get delivery updates for your orders.", image: "" },
      { title: "Returns & Refunds", description: "Start returns and track refund status quickly.", image: "" },
      { title: "Account & Security", description: "Resolve login, profile, and security issues.", image: "" },
    ],
  }),
  mkPage("why-choose-us", "content", "Why Choose Us", "<h1>Why Choose Us</h1><p>Reliable service, trusted quality, and customer-first operations.</p>", {
    description: "Benefits customers value most.",
    points: [
      { title: "Trusted Quality", description: "Carefully selected catalog and verified sellers.", image: "" },
      { title: "Fast Delivery", description: "Efficient fulfillment with transparent tracking.", image: "" },
      { title: "Easy Returns", description: "Simple return flow and timely refunds.", image: "" },
    ],
  }),
  mkPage("our-commitment", "content", "Our Commitment", "<h1>Our Commitment</h1><p>We are committed to consistency, transparency and continuous improvement.</p>", {
    description: "Customer-first commitments at every stage.",
    points: [
      { title: "Clear Policies", description: "Transparent policies with no hidden terms.", image: "" },
      { title: "Reliable Support", description: "Responsive support for order and account needs.", image: "" },
      { title: "Continuous Improvement", description: "Regular upgrades based on customer feedback.", image: "" },
    ],
  }),
  mkPage("features", "content", "Features", "<h1>Features</h1><p>Built for simple, secure and fast shopping experiences.</p>", {
    description: "Core platform features for customers.",
    points: [
      { title: "Smart Search", description: "Quick discovery with relevant product results.", image: "" },
      { title: "Secure Checkout", description: "Trusted payment rails and safer transactions.", image: "" },
      { title: "Live Tracking", description: "Order tracking from dispatch to delivery.", image: "" },
    ],
  }),
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const keepExisting = process.argv.includes("--keep-existing");

  if (dryRun) {
    console.log(`[dry-run] ${keepExisting ? "Would upsert" : "Would reset and seed"} ${PAGES.length} CMS pages`);
    PAGES.forEach((p) => console.log(`  - ${p.slug} (${p.pageType}) points=${p.points.length}`));
    return;
  }

  await connectMongo();

  if (!keepExisting) {
    const deleted = await StaticPageModel.deleteMany({});
    console.log(`Removed previous CMS pages: ${deleted?.deletedCount || 0}`);
  }

  const inserted = await StaticPageModel.insertMany(PAGES, { ordered: true });
  console.log(`CMS seed complete: inserted ${inserted.length} pages`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("CMS seed failed:", err?.message || err);
    process.exit(1);
  });
