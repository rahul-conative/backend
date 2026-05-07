const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    dialCode: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const stateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminCountry", required: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

stateSchema.index({ countryId: 1, name: 1 }, { unique: true });

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminState", required: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

citySchema.index({ stateId: 1, name: 1 }, { unique: true });

const taxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminCountry", index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const subTaxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    taxId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminTax", required: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

subTaxSchema.index({ taxId: 1, name: 1 }, { unique: true });

const taxRuleSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    taxId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminTax", required: true, index: true },
    subTaxIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "AdminSubTax" }],
    category: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

const AdminCountryModel = mongoose.model("AdminCountry", countrySchema);
const AdminStateModel = mongoose.model("AdminState", stateSchema);
const AdminCityModel = mongoose.model("AdminCity", citySchema);
const AdminTaxModel = mongoose.model("AdminTax", taxSchema);
const AdminSubTaxModel = mongoose.model("AdminSubTax", subTaxSchema);
const AdminTaxRuleModel = mongoose.model("AdminTaxRule", taxRuleSchema);

module.exports = {
  AdminCountryModel,
  AdminStateModel,
  AdminCityModel,
  AdminTaxModel,
  AdminSubTaxModel,
  AdminTaxRuleModel,
};
