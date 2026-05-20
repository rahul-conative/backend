const Joi = require("joi");

const upsertCartSchema = Joi.object({
  body: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          variantId: Joi.string().allow("", null),
          variantSku: Joi.string().allow("", null),
          variantTitle: Joi.string().allow("", null),
          attributes: Joi.object().default({}),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().min(0).required(),
        }),
      )
      .required(),
    wishlist: Joi.array().items(Joi.string()).default([]),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

module.exports = { upsertCartSchema };
