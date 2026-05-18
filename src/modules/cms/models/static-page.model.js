const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const pointSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
  },
  { _id: false },
);

const staticPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    pageType: { type: String, required: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    description: { type: String, default: "", trim: true },
    coverImage: { type: String, default: "" },
    points: { type: [pointSchema], default: [] },
    language: { type: String, default: "en", index: true },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

const StaticPageModel = mongoose.model("CmsStaticPage", staticPageSchema);

module.exports = { StaticPageModel };
