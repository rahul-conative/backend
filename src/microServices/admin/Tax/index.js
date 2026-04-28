const mongoose = require("mongoose");
const { addTimeStamp } = require("../../../../utils/globalFunction");

const Schema = mongoose.Schema;

const TaxSchema = new Schema({
  name: {
    type: String,
    trim: true,
    lowercase: true,
  },
  country_code: {
    type: Schema.Types.ObjectId,
    ref: "Country",
  },
  ...addTimeStamp(),
});

TaxSchema.options.toJSON = {
  transform: function (doc, ret, options) {
    delete ret.__v;
    return ret;
  },
};

module.exports = mongoose.model("Tax", TaxSchema, "Tax");
