const { AppError } = require("../errors/app-error");
const Joi = require("joi");

function getSchema(schema) {
  if (schema && typeof schema.validate === "function") {
    return schema;
  }

  if (!schema || typeof schema !== "object") {
    throw new AppError("Invalid request schema", 500);
  }

  return Joi.object({
    body: schema.body || Joi.object({}).default({}),
    query: schema.query || Joi.object({}).default({}),
    params: schema.params || Joi.object({}).default({}),
  });
}

function checkInput(schema) {
  return (req, res, next) => {
    const schemaToCheck = getSchema(schema);
    const { error, value } = schemaToCheck.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      },
    );

    if (error) {
      return next(new AppError("Validation failed", 400, error.details));
    }

    req.body = value.body || {};
    req.query = value.query || {};
    req.params = value.params || {};

    return next();
  };
}

module.exports = { checkInput };
