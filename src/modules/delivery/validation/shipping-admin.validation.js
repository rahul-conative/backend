const Joi = require("joi");

const idList = Joi.alternatives().try(
  Joi.string(),
  Joi.array().items(Joi.string()).min(1),
);

const listSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    q: Joi.string().allow(""),
    keyWord: Joi.string().allow(""),
    search: Joi.string().allow(""),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    size: Joi.number().integer().min(1).max(100),
    countryId: Joi.string(),
    stateId: Joi.string(),
    cityId: Joi.string(),
    active: Joi.boolean(),
  }).required(),
  params: Joi.object({}).required(),
});

const statusSchema = Joi.object({
  body: Joi.object({
    ids: idList,
    _id: idList,
    isDisable: Joi.boolean().required(),
  }).or("ids", "_id").required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const deleteSchema = Joi.object({
  body: Joi.object({
    ids: idList,
    _id: idList,
  }).or("ids", "_id").required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const shippingPackageBody = {
  name: Joi.string().trim().required(),
  code: Joi.string().trim().allow("", null),
  length: Joi.number().min(0).required(),
  width: Joi.number().min(0).required(),
  height: Joi.number().min(0).required(),
  unit: Joi.string().valid("cm", "inch", "mm").default("cm"),
  maxWeight: Joi.number().min(0),
  active: Joi.boolean(),
  isDisable: Joi.boolean(),
};

const shippingPackageUpdateBody = {
  ...shippingPackageBody,
  name: Joi.string().trim(),
  length: Joi.number().min(0),
  width: Joi.number().min(0),
  height: Joi.number().min(0),
};

const pickupScheduleSchema = Joi.object({
  day: Joi.string().trim().required(),
  from: Joi.string().allow("", null),
  to: Joi.string().allow("", null),
  selected: Joi.boolean(),
});

const pickupAddressBody = {
  label: Joi.string().trim().required(),
  contactName: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  email: Joi.string().email().allow("", null),
  addressLine1: Joi.string().trim().required(),
  addressLine2: Joi.string().trim().allow("", null),
  countryId: Joi.string().required(),
  stateId: Joi.string().required(),
  cityId: Joi.string().required(),
  zipCodeId: Joi.string().allow("", null),
  pincode: Joi.string().trim().required(),
  pickupInstructions: Joi.string().trim().allow("", null),
  schedule: Joi.array().items(pickupScheduleSchema),
  active: Joi.boolean(),
  isDisable: Joi.boolean(),
};

const pickupAddressUpdateBody = {
  ...pickupAddressBody,
  label: Joi.string().trim(),
  contactName: Joi.string().trim(),
  phone: Joi.string().trim(),
  addressLine1: Joi.string().trim(),
  countryId: Joi.string(),
  stateId: Joi.string(),
  cityId: Joi.string(),
  pincode: Joi.string().trim(),
};

const paramSchema = (paramName) => Joi.object({
  body: Joi.object({}).default({}),
  query: Joi.object({}).required(),
  params: Joi.object({ [paramName]: Joi.string().required() }).required(),
});

const createSchema = (body) => Joi.object({
  body: Joi.object(body).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateSchema = (paramName, body) => Joi.object({
  body: Joi.object(body).min(1).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ [paramName]: Joi.string().required() }).required(),
});

module.exports = {
  listSchema,
  statusSchema,
  deleteSchema,
  createShippingPackageSchema: createSchema(shippingPackageBody),
  updateShippingPackageSchema: updateSchema("packageId", shippingPackageUpdateBody),
  shippingPackageParamSchema: paramSchema("packageId"),
  createPickupAddressSchema: createSchema(pickupAddressBody),
  updatePickupAddressSchema: updateSchema("pickupAddressId", pickupAddressUpdateBody),
  pickupAddressParamSchema: paramSchema("pickupAddressId"),
};
