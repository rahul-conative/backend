const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const platformProductOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const PlatformProductOptionModel = mongoose.model("PlatformProductOption", platformProductOptionSchema);

module.exports = { PlatformProductOptionModel };

