const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid");
const { env } = require("../../config/env");
const { AppError } = require("../errors/app-error");
const {
  SUPPORTED_DOCUMENT_MIME_TYPES,
} = require("../validation/document-upload");

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

const DATA_URI_PATTERN =
  /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([\s\S]+)$/i;
const SUPPORTED_DOCUMENT_MIME_TYPE_SET = new Set(SUPPORTED_DOCUMENT_MIME_TYPES);

function ensureCloudinaryConfigured() {
  if (
    !env.cloudinary.cloudName ||
    !env.cloudinary.apiKey ||
    !env.cloudinary.apiSecret
  ) {
    throw new AppError("Cloudinary storage is not configured", 500);
  }
}

function normalizeBase64(content) {
  return String(content || "").replace(/\s/g, "");
}

function getBase64Size(content) {
  const normalized = normalizeBase64(content);
  const padding = normalized.endsWith("==")
    ? 2
    : normalized.endsWith("=")
      ? 1
      : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

function makeDataUri(mimeType, base64) {
  return `data:${mimeType};base64,${normalizeBase64(base64)}`;
}

function detectDocumentMimeType(base64) {
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "%PDF") {
    return "application/pdf";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function sanitizePathSegment(value, fallback = "document") {
  const sanitized = String(value || fallback)
    .trim()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return sanitized || fallback;
}

function getDocumentStem(documentKey = "document") {
  return String(documentKey).replace(/Url$/, "") || "document";
}

class StorageService {
  async upload(filePath, options = {}) {
    ensureCloudinaryConfigured();
    return cloudinary.uploader.upload(filePath, options);
  }

  isUploadPayload(value) {
    if (!value) {
      return false;
    }

    if (typeof value === "string") {
      return DATA_URI_PATTERN.test(value);
    }

    if (typeof value === "object") {
      return Boolean(value.dataUri || value.contentBase64);
    }

    return false;
  }

  buildDataUri(value) {
    if (typeof value === "string") {
      const match = value.match(DATA_URI_PATTERN);
      if (!match) {
        throw new AppError("Invalid document data URI", 400);
      }
      return {
        dataUri: makeDataUri(match[1].toLowerCase(), match[2]),
        mimeType: match[1].toLowerCase(),
        base64: match[2],
        fileName: null,
      };
    }

    if (value?.dataUri) {
      const parsed = this.buildDataUri(value.dataUri);
      return {
        ...parsed,
        fileName: value.fileName || null,
      };
    }

    const mimeType = String(value?.mimeType || "").toLowerCase();
    const base64 = value?.contentBase64;
    if (!mimeType || !base64) {
      throw new AppError(
        "Document upload requires mimeType and contentBase64",
        400,
      );
    }

    return {
      dataUri: makeDataUri(mimeType, base64),
      mimeType,
      base64,
      fileName: value.fileName || null,
    };
  }

  validateDocumentPayload(document) {
    if (!SUPPORTED_DOCUMENT_MIME_TYPE_SET.has(document.mimeType)) {
      throw new AppError("Unsupported document file type", 400, {
        allowedMimeTypes: SUPPORTED_DOCUMENT_MIME_TYPES,
      });
    }

    const normalizedBase64 = normalizeBase64(document.base64);
    if (!normalizedBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)) {
      throw new AppError("Invalid document base64 content", 400);
    }

    const detectedMimeType = detectDocumentMimeType(normalizedBase64);
    if (!detectedMimeType || detectedMimeType !== document.mimeType) {
      throw new AppError("Document content does not match the declared mimeType", 400, {
        detectedMimeType,
        declaredMimeType: document.mimeType,
      });
    }

    const size = getBase64Size(normalizedBase64);
    if (size > env.upload.maxDocumentBytes) {
      throw new AppError("Document file is too large", 400, {
        maxBytes: env.upload.maxDocumentBytes,
      });
    }
  }

  async uploadDocument(value, options = {}) {
    ensureCloudinaryConfigured();
    const document = this.buildDataUri(value);
    this.validateDocumentPayload(document);

    const documentKey = options.documentKey || "document";
    const publicId = [
      sanitizePathSegment(getDocumentStem(document.fileName || documentKey)),
      uuidv4(),
    ].join("-");

    return cloudinary.uploader.upload(document.dataUri, {
      resource_type: "auto",
      folder: options.folder || "ecommerce/documents",
      public_id: publicId,
      overwrite: false,
      use_filename: false,
      unique_filename: false,
      context: {
        document_key: documentKey,
        owner_type: options.ownerType || "",
        owner_id: options.ownerId || "",
      },
    });
  }

  async uploadKycDocuments(documents = {}, options = {}) {
    const normalized = {};
    const ownerType = sanitizePathSegment(options.ownerType || "kyc");
    const ownerId = sanitizePathSegment(options.ownerId || "anonymous");
    const folder = options.folder || `ecommerce/kyc/${ownerType}/${ownerId}`;

    for (const [documentKey, value] of Object.entries(documents || {})) {
      if (!this.isUploadPayload(value)) {
        normalized[documentKey] = value;
        continue;
      }

      const upload = await this.uploadDocument(value, {
        folder,
        ownerType,
        ownerId,
        documentKey,
      });

      normalized[documentKey] = upload.secure_url || upload.url;
    }

    return normalized;
  }
}

const storageService = new StorageService();

module.exports = { storageService };
