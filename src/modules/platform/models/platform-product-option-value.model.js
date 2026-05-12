const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const platformProductOptionValueSchema = new mongoose.Schema(
  {
    option_id: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

platformProductOptionValueSchema.index({ option_id: 1, name: 1 }, { unique: true });

const PlatformProductOptionValueModel = mongoose.model("PlatformProductOptionValue", platformProductOptionValueSchema);

module.exports = { PlatformProductOptionValueModel };

