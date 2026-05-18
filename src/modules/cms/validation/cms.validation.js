const Joi = require("joi");

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const slugParam = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    slug: Joi.string().required(),
  }).required(),
});

const pointSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow("").default(""),
  image: Joi.string().allow("").default(""),
});

const createPageSchema = Joi.object({
  body: Joi.object({
    slug: Joi.string().trim().required(),
    pageType: Joi.string().trim().required(),
    title: Joi.string().trim().required(),
    body: Joi.string().allow("").default(""),
    description: Joi.string().allow("").default(""),
    coverImage: Joi.string().allow("").default(""),
    points: Joi.array().items(pointSchema).default([]),
    language: Joi.string().trim().default("en"),
    published: Joi.boolean().default(false),
    publishedAt: Joi.date().optional(),
    metadata: Joi.object().default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updatePageSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim(),
    pageType: Joi.string().trim(),
    body: Joi.string().allow(""),
    description: Joi.string().allow(""),
    coverImage: Joi.string().allow(""),
    points: Joi.array().items(pointSchema),
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

const listPagesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: paginationQuery.concat(
    Joi.object({
      q: Joi.string().allow(""),
      search: Joi.string().allow(""),
      pageType: Joi.string(),
      language: Joi.string(),
      published: Joi.boolean(),
    }),
  ),
  params: Joi.object({}).required(),
});

module.exports = {
  slugParam,
  createPageSchema,
  updatePageSchema,
  listPagesSchema,
};
