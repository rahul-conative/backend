const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const platformProductOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    slug: { type: String, trim: true, default: "", index: true },
    displayType: {
      type: String,
      enum: ["button", "dropdown", "color_swatch", "radio", "thumbnail"],
      default: "button",
    },
    description: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const PlatformProductOptionModel = mongoose.model("PlatformProductOption", platformProductOptionSchema);

module.exports = { PlatformProductOptionModel };
