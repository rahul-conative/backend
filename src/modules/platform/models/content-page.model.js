const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const contentPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    pageType: { type: String, required: true, index: true },
    body: { type: String, required: true },
    excerpt: { type: String, default: "" },
    category: { type: String, default: "", index: true },
    tags: [{ type: String, trim: true }],
    coverImage: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    heroImage: { type: String, default: "" },
    galleryImages: [{ type: String }],
    author: {
      name: { type: String, default: "" },
      avatar: { type: String, default: "" },
    },
    readTime: { type: Number, min: 0, default: 0 },
    language: { type: String, default: "en", index: true },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

const ContentPageModel = mongoose.model("ContentPage", contentPageSchema);

module.exports = { ContentPageModel };
