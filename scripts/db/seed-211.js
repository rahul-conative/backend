#!/usr/bin/env node
"use strict";

const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { ContentPageModel } = require("../../src/modules/platform/models/content-page.model");

const PUBLISHED_AT = new Date("2026-01-01T00:00:00.000Z");

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const imageObj = (url = "", alt = "", type = "section") => ({
  url,
  alt,
  title: alt,
  caption: "",
  type,
});

const ctaObj = (label = "", url = "", target = "_self") => ({
  label,
  url,
  target,
});

const pointObj = (title, description, icon = "", sortOrder = 0) => ({
  title,
  description,
  image: imageObj(icon, title, "point"),
  cta: ctaObj(),
  sortOrder,
});

const sectionPointObj = (
  title,
  description,
  icon = "",
  sortOrder = 0,
) => ({
  title,
  description,
  image: imageObj(icon, title, "point"),
  cta: ctaObj(),
  sortOrder,
});

// ─────────────────────────────────────────────────────────────
// CONTACT PAGE DATA
// ─────────────────────────────────────────────────────────────

const contactUsPage = {
  slug: "help-contact",
  pageType: "contact",

  title: "Contact Our Support Team",

  description:
    "Every great experience begins with a conversation. Connect with Sam Global for support, partnerships, and business inquiries.",

  excerpt:
    "Contact Sam Global support team for general inquiries, partnerships, and customer support.",

  body: `
    <h1>Contact Our Support Team</h1>

    <h2>Let’s Connect</h2>

    <p>
      Every great experience begins with a conversation.
      Whether you’re a customer, a brand partner, or someone
      looking to collaborate, we’re here to connect,
      understand, and assist.
    </p>

    <h2>How Can We Help You?</h2>

    <p>
      From product queries to partnership opportunities,
      our team is available to support you at every step.
    </p>
  `,

  coverImage: "/image/png/contact-support.png",
  heroImage: "/image/png/contact-support.png",
  thumbnailUrl: "/image/png/contact-support.png",

  image: {
    url: "/image/png/contact-support.png",
    alt: "Contact Our Support Team",
    title: "Contact Our Support Team",
    caption: "",
    type: "hero",
  },

  galleryImages: ["/image/png/contact-support.png"],

  gallery: [
    {
      url: "/image/png/contact-support.png",
      alt: "Contact Our Support Team",
      title: "Contact Our Support Team",
      caption: "",
      type: "gallery",
    },
  ],

  language: "en",

  status: "published",

  published: true,

  publishedAt: PUBLISHED_AT,

  visibility: {
    channels: ["web", "app"],
    roles: ["public"],
  },

  cta: {
    label: "Contact Support",
    url: "/help-contact",
    target: "_self",
  },

  sections: [
    {
      type: "support_categories",

      title: "How Can We Help You?",

      description:
        "From product queries to partnership opportunities, our team is available to support you at every step.",

      image: imageObj("", "How Can We Help You?", "section"),

      gallery: [],

      points: [
        sectionPointObj(
          "General Inquiries",
          "For common questions, information, and platform-related queries.",
          "/image/icons/inquiry.svg",
          1,
        ),

        sectionPointObj(
          "Brand And Partnership Discussions",
          "Connect with us for business partnerships and brand collaboration.",
          "/image/icons/partnership.svg",
          2,
        ),

        sectionPointObj(
          "Store And Retail Opportunities",
          "Explore retail, franchise, and store-related business opportunities.",
          "/image/icons/store.svg",
          3,
        ),

        sectionPointObj(
          "Customer Support",
          "Get help with orders, products, returns, refunds, and account support.",
          "/image/icons/support.svg",
          4,
        ),
      ],

      cta: ctaObj(),

      sortOrder: 1,
    },

    {
      type: "contact_info",

      title: "Get In Touch",

      description: "We’d love to hear from you.",

      image: imageObj("", "Get In Touch", "section"),

      gallery: [],

      points: [
        sectionPointObj(
          "Email",
          "info@samglobal.com",
          "/image/icons/email.svg",
          1,
        ),

        sectionPointObj(
          "Call",
          "+91 97790-15070",
          "/image/icons/phone.svg",
          2,
        ),

        sectionPointObj(
          "Address",
          "Shop No. 12, Ground Floor, Indore, Madhya Pradesh, India",
          "/image/icons/location.svg",
          3,
        ),
      ],

      cta: ctaObj(),

      sortOrder: 2,
    },

    {
      type: "business_inquiry",

      title: "For Brand & Business Inquiries",

      description:
        "Looking to partner with us or expand with Sam Global?",

      image: imageObj("", "Business Inquiry", "section"),

      gallery: [],

      points: [
        sectionPointObj(
          "Business Email",
          "info@samglobal.com",
          "/image/icons/email.svg",
          1,
        ),
      ],

      cta: ctaObj(
        "info@samglobal.com",
        "mailto:info@samglobal.com",
      ),

      sortOrder: 3,
    },

    {
      type: "visit_us",

      title: "Visit Us",

      description:
        "As we expand across cities, we invite you to experience Sam Global through our growing retail presence.",

      image: imageObj("", "Visit Us", "section"),

      gallery: [],

      points: [
        sectionPointObj(
          "Store Address",
          "Shop No. 12, Ground Floor, Indore, Madhya Pradesh, India",
          "/image/icons/location.svg",
          1,
        ),
      ],

      cta: ctaObj(
        "Get Directions",
        "https://maps.google.com",
        "_blank",
      ),

      sortOrder: 4,
    },

    {
      type: "response_commitment",

      title: "Response Commitment",

      description:
        "We value your time. Our team will respond to all queries within 24–48 business hours.",

      image: imageObj("", "Response Commitment", "section"),

      gallery: [],

      points: [],

      cta: ctaObj(),

      sortOrder: 5,
    },

    {
      type: "closing_message",

      title:
        "We’re building more than retail. We’re building connections.",

      description: "",

      image: imageObj("", "Closing Message", "section"),

      gallery: [],

      points: [],

      cta: ctaObj(),

      sortOrder: 6,
    },
  ],

  metadata: {
    footerGroup: "help",

    version: "1.0",

    seoTitle: "Contact Us | Sam Global",

    cmsKey: "help-contact",

    routePath: "/help-contact",

    data: {
      title: "Contact Our Support Team",

      intro: {
        heading: "Let’s Connect",

        description:
          "Every great experience begins with a conversation. Whether you’re a customer, a brand partner, or someone looking to collaborate, we’re here to connect, understand, and assist.",
      },
    },
  },

  points: [
    pointObj(
      "General Inquiries",
      "For common questions, information, and platform-related queries.",
      "/image/icons/inquiry.svg",
      1,
    ),

    pointObj(
      "Brand And Partnership Discussions",
      "Connect with us for business partnerships and brand collaboration.",
      "/image/icons/partnership.svg",
      2,
    ),

    pointObj(
      "Store And Retail Opportunities",
      "Explore retail, franchise, and store-related business opportunities.",
      "/image/icons/store.svg",
      3,
    ),

    pointObj(
      "Customer Support",
      "Get help with orders, products, returns, refunds, and account support.",
      "/image/icons/support.svg",
      4,
    ),
  ],
};

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  await connectMongo();

  await ContentPageModel.updateOne(
    { slug: contactUsPage.slug },

    {
      $set: contactUsPage,
    },

    {
      upsert: true,
      runValidators: true,
    },
  );

  console.log("✅ Contact Us CMS page seeded successfully");

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Failed to seed Contact Us CMS page", error);

  process.exit(1);
});