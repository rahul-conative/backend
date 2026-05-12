const Joi = require("joi");

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
});

const createCategorySchema = Joi.object({
  body: Joi.object({
    categoryKey: Joi.string().trim().required(),
    title: Joi.string().trim().required(),
    parentKey: Joi.string().allow(null, ""),
    level: Joi.number().integer().min(0).default(0),
    attributesSchema: Joi.object().default({}),
    attributeSchema: Joi.array()
      .items(
        Joi.object({
          key: Joi.string().trim().required(),
          label: Joi.string().trim().required(),
          type: Joi.string()
            .valid("text", "number", "select", "multi_select", "boolean", "date")
            .default("text"),
          required: Joi.boolean().default(false),
          options: Joi.array().items(Joi.string().trim()).default([]),
          unit: Joi.string().allow("", null),
          isVariantAttribute: Joi.boolean().default(false),
          isFilterable: Joi.boolean().default(false),
          isSearchable: Joi.boolean().default(false),
        }),
      )
      .default([]),
    active: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().default(0),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateCategorySchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim(),
    parentKey: Joi.string().allow(null, ""),
    level: Joi.number().integer().min(0),
    attributesSchema: Joi.object(),
    attributeSchema: Joi.array().items(
      Joi.object({
        key: Joi.string().trim().required(),
        label: Joi.string().trim().required(),
        type: Joi.string().valid("text", "number", "select", "multi_select", "boolean", "date"),
        required: Joi.boolean(),
        options: Joi.array().items(Joi.string().trim()),
        unit: Joi.string().allow("", null),
        isVariantAttribute: Joi.boolean(),
        isFilterable: Joi.boolean(),
        isSearchable: Joi.boolean(),
      }),
    ),
    active: Joi.boolean(),
    sortOrder: Joi.number().integer(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    categoryKey: Joi.string().required(),
  }).required(),
});

const listCategoriesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(
    Joi.object({
      parentKey: Joi.string(),
      active: Joi.boolean(),
      categoryKey: Joi.string(),
    }),
  ),
  params: Joi.object({}).required(),
});

const categoryKeySchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    categoryKey: Joi.string().required(),
  }).required(),
});

const createProductFamilySchema = Joi.object({
  body: Joi.object({
    familyCode: Joi.string().trim().required(),
    sellerId: Joi.string().required(),
    title: Joi.string().trim().required(),
    category: Joi.string().required(),
    baseAttributes: Joi.object().default({}),
    variantAxes: Joi.array().items(Joi.string()).default([]),
    status: Joi.string().default("active"),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateProductFamilySchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim(),
    category: Joi.string(),
    baseAttributes: Joi.object(),
    variantAxes: Joi.array().items(Joi.string()),
    status: Joi.string(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    familyCode: Joi.string().required(),
  }).required(),
});

const listProductFamiliesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(
    Joi.object({
      category: Joi.string(),
      sellerId: Joi.string(),
      status: Joi.string(),
    }),
  ),
  params: Joi.object({}).required(),
});

const productFamilyCodeSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    familyCode: Joi.string().required(),
  }).required(),
});

const createProductVariantSchema = Joi.object({
  body: Joi.object({
    familyCode: Joi.string().trim().required(),
    productId: Joi.string().required(),
    sellerId: Joi.string().required(),
    sku: Joi.string().trim().required(),
    attributes: Joi.object().default({}),
    stock: Joi.number().integer().min(0).default(0),
    reservedStock: Joi.number().integer().min(0).default(0),
    status: Joi.string().default("active"),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateProductVariantSchema = Joi.object({
  body: Joi.object({
    familyCode: Joi.string().trim(),
    productId: Joi.string(),
    sellerId: Joi.string(),
    sku: Joi.string().trim(),
    attributes: Joi.object(),
    stock: Joi.number().integer().min(0),
    reservedStock: Joi.number().integer().min(0),
    status: Joi.string(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    variantId: Joi.string().required(),
  }).required(),
});

const listProductVariantsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(
    Joi.object({
      q: Joi.string().allow(""),
      keyWord: Joi.string().allow(""),
      search: Joi.string().allow(""),
      productId: Joi.string(),
      familyCode: Joi.string(),
      sellerId: Joi.string(),
      sku: Joi.string(),
      status: Joi.string(),
    }),
  ),
  params: Joi.object({}).required(),
});

const productVariantIdSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    variantId: Joi.string().required(),
  }).required(),
});

const createHsnCodeSchema = Joi.object({
  body: Joi.object({
    code: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    gstRate: Joi.number().min(0).required(),
    cessRate: Joi.number().min(0).default(0),
    taxType: Joi.string().valid("gst", "igst", "sgst", "cgst", "exempt").default("gst"),
    exempt: Joi.boolean().default(false),
    category: Joi.string().allow(null, ""),
    active: Joi.boolean().default(true),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateHsnCodeSchema = Joi.object({
  body: Joi.object({
    description: Joi.string().trim(),
    gstRate: Joi.number().min(0),
    cessRate: Joi.number().min(0),
    taxType: Joi.string().valid("gst", "igst", "sgst", "cgst", "exempt"),
    exempt: Joi.boolean(),
    category: Joi.string().allow(null, ""),
    active: Joi.boolean(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    hsnCode: Joi.string().required(),
  }).required(),
});

const listHsnCodesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(
    Joi.object({
      q: Joi.string().allow(""),
      keyWord: Joi.string().allow(""),
      search: Joi.string().allow(""),
      category: Joi.string(),
      active: Joi.boolean(),
    }),
  ),
  params: Joi.object({}).required(),
});

const hsnCodeParamSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    hsnCode: Joi.string().required(),
  }).required(),
});

const createGeographySchema = Joi.object({
  body: Joi.object({
    countryCode: Joi.string().trim().required(),
    countryName: Joi.string().trim().required(),
    active: Joi.boolean().default(true),
    states: Joi.array()
      .items(
        Joi.object({
          stateCode: Joi.string().trim().required(),
          stateName: Joi.string().trim().required(),
          cities: Joi.array().items(Joi.string().trim()).default([]),
        }),
      )
      .default([]),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateGeographySchema = Joi.object({
  body: Joi.object({
    countryName: Joi.string().trim(),
    active: Joi.boolean(),
    states: Joi.array().items(
      Joi.object({
        stateCode: Joi.string().trim().required(),
        stateName: Joi.string().trim().required(),
        cities: Joi.array().items(Joi.string().trim()).default([]),
      }),
    ),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    countryCode: Joi.string().required(),
  }).required(),
});

const listGeographiesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(Joi.object({ active: Joi.boolean() })),
  params: Joi.object({}).required(),
});

const geographyParamSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    countryCode: Joi.string().required(),
  }).required(),
});

const createContentPageSchema = Joi.object({
  body: Joi.object({
    slug: Joi.string().trim().required(),
    title: Joi.string().trim().required(),
    pageType: Joi.string().trim().required(),
    body: Joi.string().required(),
    language: Joi.string().trim().default("en"),
    published: Joi.boolean().default(false),
    publishedAt: Joi.date().optional(),
    metadata: Joi.object().default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateContentPageSchema = Joi.object({
  body: Joi.object({
    slug: Joi.string().trim(),
    title: Joi.string().trim(),
    pageType: Joi.string().trim(),
    body: Joi.string(),
    language: Joi.string().trim(),
    published: Joi.boolean(),
    publishedAt: Joi.date().optional(),
    metadata: Joi.object(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    slug: Joi.string().required(),
  }).required(),
});

const listContentPagesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(
    Joi.object({
      q: Joi.string().allow(""),
      keyWord: Joi.string().allow(""),
      search: Joi.string().allow(""),
      pageType: Joi.string(),
      language: Joi.string(),
      published: Joi.boolean(),
    }),
  ),
  params: Joi.object({}).required(),
});

const contentPageSlugSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    slug: Joi.string().required(),
  }).required(),
});

const createBrandSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().required(),
    logo: Joi.string().allow(""),
    thumbnails: Joi.string().allow(""),
    active: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().default(0),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateBrandSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim(),
    logo: Joi.string().allow(""),
    thumbnails: Joi.string().allow(""),
    active: Joi.boolean(),
    sortOrder: Joi.number().integer(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    brandId: Joi.string().required(),
  }).required(),
});

const listBrandsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(
    Joi.object({
      q: Joi.string().allow(""),
      keyWord: Joi.string().allow(""),
      search: Joi.string().allow(""),
      active: Joi.boolean(),
    }),
  ),
  params: Joi.object({}).required(),
});

const brandIdSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    brandId: Joi.string().required(),
  }).required(),
});

const createWarrantyTemplateSchema = Joi.object({
  body: Joi.object({
    period: Joi.string().trim().required(),
    active: Joi.boolean().default(true),
    metadata: Joi.object().default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateWarrantyTemplateSchema = Joi.object({
  body: Joi.object({
    period: Joi.string().trim(),
    active: Joi.boolean(),
    metadata: Joi.object(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    templateId: Joi.string().required(),
  }).required(),
});

const listWarrantyTemplatesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(
    Joi.object({
      q: Joi.string().allow(""),
      keyWord: Joi.string().allow(""),
      search: Joi.string().allow(""),
      active: Joi.boolean(),
    }),
  ),
  params: Joi.object({}).required(),
});

const warrantyTemplateIdSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    templateId: Joi.string().required(),
  }).required(),
});

const createFinishSchema = Joi.object({
  body: Joi.object({ name: Joi.string().trim().required(), active: Joi.boolean().default(true) }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});
const updateFinishSchema = Joi.object({
  body: Joi.object({ name: Joi.string().trim(), active: Joi.boolean() }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ finishId: Joi.string().required() }).required(),
});
const listFinishesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(Joi.object({ q: Joi.string().allow(""), keyWord: Joi.string().allow(""), search: Joi.string().allow(""), active: Joi.boolean() })),
  params: Joi.object({}).required(),
});
const finishIdSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ finishId: Joi.string().required() }).required(),
});

const createDimensionSchema = Joi.object({
  body: Joi.object({ dimensions_value: Joi.string().trim().required(), active: Joi.boolean().default(true) }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});
const updateDimensionSchema = Joi.object({
  body: Joi.object({ dimensions_value: Joi.string().trim(), active: Joi.boolean() }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ dimensionId: Joi.string().required() }).required(),
});
const listDimensionsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(Joi.object({ q: Joi.string().allow(""), keyWord: Joi.string().allow(""), search: Joi.string().allow(""), active: Joi.boolean() })),
  params: Joi.object({}).required(),
});
const dimensionIdSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ dimensionId: Joi.string().required() }).required(),
});

const createBatchSchema = Joi.object({
  body: Joi.object({
    batchCode: Joi.string().trim().required(),
    manufactureDate: Joi.number().required(),
    expiryDate: Joi.number().required(),
    active: Joi.boolean().default(true),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});
const updateBatchSchema = Joi.object({
  body: Joi.object({
    batchCode: Joi.string().trim(),
    manufactureDate: Joi.number(),
    expiryDate: Joi.number(),
    active: Joi.boolean(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ batchId: Joi.string().required() }).required(),
});
const listBatchesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(Joi.object({ q: Joi.string().allow(""), keyWord: Joi.string().allow(""), search: Joi.string().allow(""), active: Joi.boolean() })),
  params: Joi.object({}).required(),
});
const batchIdSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ batchId: Joi.string().required() }).required(),
});

const createProductOptionSchema = Joi.object({
  body: Joi.object({ name: Joi.string().trim().required(), active: Joi.boolean().default(true) }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});
const updateProductOptionSchema = Joi.object({
  body: Joi.object({ name: Joi.string().trim(), active: Joi.boolean() }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ optionId: Joi.string().required() }).required(),
});
const listProductOptionsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(Joi.object({ q: Joi.string().allow(""), keyWord: Joi.string().allow(""), search: Joi.string().allow(""), active: Joi.boolean() })),
  params: Joi.object({}).required(),
});
const productOptionIdSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ optionId: Joi.string().required() }).required(),
});

const createProductOptionValueSchema = Joi.object({
  body: Joi.object({
    option_id: Joi.string().required(),
    name: Joi.string().trim().required(),
    active: Joi.boolean().default(true),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});
const updateProductOptionValueSchema = Joi.object({
  body: Joi.object({
    option_id: Joi.string(),
    name: Joi.string().trim(),
    active: Joi.boolean(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ optionValueId: Joi.string().required() }).required(),
});
const listProductOptionValuesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(
    Joi.object({ q: Joi.string().allow(""), keyWord: Joi.string().allow(""), search: Joi.string().allow(""), option_id: Joi.string(), active: Joi.boolean() }),
  ),
  params: Joi.object({}).required(),
});
const productOptionValueIdSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({ optionValueId: Joi.string().required() }).required(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesSchema,
  categoryKeySchema,
  createProductFamilySchema,
  updateProductFamilySchema,
  listProductFamiliesSchema,
  productFamilyCodeSchema,
  createProductVariantSchema,
  updateProductVariantSchema,
  listProductVariantsSchema,
  productVariantIdSchema,
  createHsnCodeSchema,
  updateHsnCodeSchema,
  listHsnCodesSchema,
  hsnCodeParamSchema,
  hsnCodeSchema: hsnCodeParamSchema,
  createGeographySchema,
  updateGeographySchema,
  listGeographiesSchema,
  geographyParamSchema,
  geographyCodeSchema: geographyParamSchema,
  createContentPageSchema,
  updateContentPageSchema,
  listContentPagesSchema,
  contentPageSlugSchema,
  createBrandSchema,
  updateBrandSchema,
  listBrandsSchema,
  brandIdSchema,
  createWarrantyTemplateSchema,
  updateWarrantyTemplateSchema,
  listWarrantyTemplatesSchema,
  warrantyTemplateIdSchema,
  createFinishSchema,
  updateFinishSchema,
  listFinishesSchema,
  finishIdSchema,
  createDimensionSchema,
  updateDimensionSchema,
  listDimensionsSchema,
  dimensionIdSchema,
  createBatchSchema,
  updateBatchSchema,
  listBatchesSchema,
  batchIdSchema,
  createProductOptionSchema,
  updateProductOptionSchema,
  listProductOptionsSchema,
  productOptionIdSchema,
  createProductOptionValueSchema,
  updateProductOptionValueSchema,
  listProductOptionValuesSchema,
  productOptionValueIdSchema,
};
