const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const platformDimensionSchema = new mongoose.Schema(
  {
    dimensions_value: { type: String, required: true, trim: true, unique: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const PlatformDimensionModel = mongoose.model("PlatformDimension", platformDimensionSchema);

module.exports = { PlatformDimensionModel };

