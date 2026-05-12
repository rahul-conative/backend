const Joi = require("joi");
const { PRODUCT_STATUS } = require("../../../shared/domain/commerce-constants");

const optionalString = () => Joi.string().trim().allow("", null);
const optionalPositiveNumber = () => Joi.number().positive().empty("");
const optionalNonNegativeInteger = () => Joi.number().integer().min(0).empty("");
const optionalNonNegativeNumber = () => Joi.number().min(0).empty("");

const createProductSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(3).max(120).required(),
    sellerId: optionalString(),
    description: Joi.string().min(10).required(),
    price: Joi.number().positive().required(),
    mrp: Joi.number().positive().required(),
    category: Joi.string().required(),
    categoryId: Joi.string(),
    brand: optionalString(),
    productFamilyCode: optionalString(),
    sku: optionalString(),
    color: optionalString(),
    attributes: Joi.object().default({}),
    variants: Joi.array().items(
      Joi.object({
        sku: Joi.string().trim().required(),
        price: optionalPositiveNumber(),
        mrp: optionalPositiveNumber(),
        stock: optionalNonNegativeInteger().default(0),
        attributes: Joi.object().default({}),
        images: Joi.array().items(Joi.string().uri()).default([]),
      }),
    ).default([]),
    options: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().trim().required(),
          values: Joi.array().items(Joi.string().trim()).required(),
          required: Joi.boolean().default(false),
          displayType: Joi.string().trim().default("dropdown"),
        }),
      )
      .default([]),
    dimensions: Joi.object({
      length: optionalPositiveNumber(),
      width: optionalPositiveNumber(),
      height: optionalPositiveNumber(),
      unit: Joi.string().trim().default("cm"),
      weight: optionalPositiveNumber(),
      weightUnit: Joi.string().trim().default("kg"),
    }).default({}),
    hsnCode: optionalString(),
    origin: Joi.object({
      country: optionalString(),
      state: optionalString(),
      city: optionalString(),
    }).default({}),
    warranty: Joi.object({
      period: optionalNonNegativeInteger(),
      periodUnit: Joi.string().valid("days", "weeks", "months", "years").default("months"),
      type: optionalString().default("manufacturer"),
      provider: optionalString(),
      terms: optionalString(),
      returnPolicy: Joi.object({
        eligible: Joi.boolean().default(true),
        days: optionalNonNegativeInteger().default(7),
        type: optionalString().default("standard"),
        restockingFee: optionalNonNegativeNumber().default(0),
      }).default({}),
      serviceableCountries: Joi.array().items(Joi.string().trim()).default([]),
    }).default({}),
    metadata: Joi.object().default({}),
    stock: Joi.number().integer().min(0).required(),
    images: Joi.array().items(Joi.string().uri()).default([]),
    gstRate: Joi.number().min(0).max(100).default(18),
    status: Joi.string()
      .valid(...Object.values(PRODUCT_STATUS))
      .default(PRODUCT_STATUS.DRAFT),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateProductSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(3).max(120),
    sellerId: optionalString(),
    description: Joi.string().min(10),
    price: Joi.number().positive(),
    mrp: Joi.number().positive(),
    category: Joi.string(),
    categoryId: Joi.string(),
    brand: optionalString(),
    productFamilyCode: optionalString(),
    sku: optionalString(),
    color: optionalString(),
    attributes: Joi.object(),
    variants: Joi.array().items(
      Joi.object({
        sku: Joi.string().trim().required(),
        price: optionalPositiveNumber(),
        mrp: optionalPositiveNumber(),
        stock: optionalNonNegativeInteger(),
        attributes: Joi.object(),
        images: Joi.array().items(Joi.string().uri()),
      }),
    ),
    options: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().required(),
        values: Joi.array().items(Joi.string().trim()).required(),
        required: Joi.boolean(),
        displayType: Joi.string().trim(),
      }),
    ),
    dimensions: Joi.object({
      length: optionalPositiveNumber(),
      width: optionalPositiveNumber(),
      height: optionalPositiveNumber(),
      unit: optionalString(),
      weight: optionalPositiveNumber(),
      weightUnit: optionalString(),
    }),
    hsnCode: optionalString(),
    origin: Joi.object({
      country: optionalString(),
      state: optionalString(),
      city: optionalString(),
    }),
    warranty: Joi.object({
      period: optionalNonNegativeInteger(),
      periodUnit: Joi.string().valid("days", "weeks", "months", "years"),
      type: optionalString(),
      provider: optionalString(),
      terms: optionalString(),
      returnPolicy: Joi.object({
        eligible: Joi.boolean(),
        days: optionalNonNegativeInteger(),
        type: optionalString(),
        restockingFee: optionalNonNegativeNumber(),
      }),
      serviceableCountries: Joi.array().items(Joi.string().trim()),
    }),
    metadata: Joi.object(),
    stock: Joi.number().integer().min(0),
    images: Joi.array().items(Joi.string().uri()),
    gstRate: Joi.number().min(0).max(100),
    status: Joi.string().valid(...Object.values(PRODUCT_STATUS)),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    productId: Joi.string().required(),
  }).required(),
});

const listProductSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    category: Joi.string(),
    status: Joi.string(),
    hsnCode: Joi.string(),
    color: Joi.string(),
    country: Joi.string(),
    state: Joi.string(),
    city: Joi.string(),
    productFamilyCode: Joi.string(),
    sku: Joi.string(),
    q: Joi.string().allow(""),
    keyWord: Joi.string().allow(""),
    search: Joi.string().allow(""),
    sellerId: Joi.string(),
    includeAllStatuses: Joi.boolean(),
  }).required(),
  params: Joi.object({}).required(),
});

const searchProductSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    q: Joi.string().min(2).required(),
  }).required(),
  params: Joi.object({}).required(),
});

const reviewProductSchema = Joi.object({
  body: Joi.object({
    status: Joi.string()
      .valid(PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE, PRODUCT_STATUS.REJECTED)
      .required(),
    rejectionReason: Joi.string().max(500).allow("", null),
    checklist: Joi.object({
      titleVerified: Joi.boolean(),
      categoryVerified: Joi.boolean(),
      complianceVerified: Joi.boolean(),
      mediaVerified: Joi.boolean(),
    }).default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    productId: Joi.string().required(),
  }).required(),
});

const rejectProductSchema = Joi.object({
  body: Joi.object({
    rejectionReason: Joi.string().max(500).allow("", null),
    checklist: Joi.object({
      titleVerified: Joi.boolean(),
      categoryVerified: Joi.boolean(),
      complianceVerified: Joi.boolean(),
      mediaVerified: Joi.boolean(),
    }).default({}),
  }).default({}),
  query: Joi.object({}).required(),
  params: Joi.object({
    productId: Joi.string().required(),
  }).required(),
});

const productParamSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    productId: Joi.string().required(),
  }).required(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductSchema,
  searchProductSchema,
  reviewProductSchema,
  rejectProductSchema,
  productParamSchema,
};
