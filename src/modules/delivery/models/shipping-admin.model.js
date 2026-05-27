const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const shippingPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    code: { type: String, default: "", trim: true, uppercase: true, index: true },
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ["cm", "inch", "mm"], default: "cm" },
    maxWeight: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const pickupScheduleSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },
    from: { type: String, default: "" },
    to: { type: String, default: "" },
    selected: { type: Boolean, default: false },
  },
  { _id: false },
);

const pickupAddressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, index: true },
    contactName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: "", trim: true },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminCountry", required: true, index: true },
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminState", required: true, index: true },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminCity", required: true, index: true },
    zipCodeId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminZipCode", index: true },
    pincode: { type: String, required: true, trim: true, index: true },
    pickupInstructions: { type: String, default: "", trim: true },
    schedule: { type: [pickupScheduleSchema], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const ShippingPackageModel = mongoose.model("ShippingPackage", shippingPackageSchema);
const PickupAddressModel = mongoose.model("PickupAddress", pickupAddressSchema);

module.exports = { ShippingPackageModel, PickupAddressModel };
