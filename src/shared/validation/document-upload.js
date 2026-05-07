const Joi = require("joi");

const SUPPORTED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const dataUriPrefixPattern = /^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,/i;

const documentUploadSchema = Joi.object({
  dataUri: Joi.string().trim().pattern(dataUriPrefixPattern),
  contentBase64: Joi.string().trim(),
  mimeType: Joi.string()
    .trim()
    .lowercase()
    .valid(...SUPPORTED_DOCUMENT_MIME_TYPES),
  fileName: Joi.string().trim().max(255).allow("", null),
})
  .xor("dataUri", "contentBase64")
  .with("contentBase64", "mimeType");

const documentReferenceSchema = Joi.alternatives().try(
  Joi.string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .allow("", null),
  Joi.string().trim().pattern(dataUriPrefixPattern),
  documentUploadSchema,
);

function makeKycDocumentsSchema(documentKeys) {
  return Joi.object(
    Object.fromEntries(
      documentKeys.map((key) => [key, documentReferenceSchema]),
    ),
  ).default({});
}

module.exports = {
  SUPPORTED_DOCUMENT_MIME_TYPES,
  documentUploadSchema,
  documentReferenceSchema,
  makeKycDocumentsSchema,
};
