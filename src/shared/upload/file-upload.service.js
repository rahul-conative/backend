const fs = require("fs/promises");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { env } = require("../../config/env");
const { AppError } = require("../errors/app-error");
const { storageService } = require("../storage/storage-service");

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_EXTENSION_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function sanitizeSegment(value, fallback = "default") {
  const sanitized = String(value || fallback)
    .trim()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return sanitized || fallback;
}

function hasCloudinaryConfig() {
  return Boolean(
    env.cloudinary.cloudName &&
      env.cloudinary.apiKey &&
      env.cloudinary.apiSecret,
  );
}

function getRequestBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

async function moveFile(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  try {
    await fs.rename(source, destination);
  } catch (error) {
    await fs.copyFile(source, destination);
    await fs.unlink(source).catch(() => {});
  }
}

class FileUploadService {
  validateImage(file) {
    if (!file) {
      throw new AppError("Image file is required", 400);
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new AppError("Unsupported image type", 400, {
        allowedMimeTypes: Array.from(ALLOWED_IMAGE_MIME_TYPES),
      });
    }
  }

  async uploadImage(file, options = {}) {
    this.validateImage(file);

    const moduleName = sanitizeSegment(options.moduleName, "default");
    const imageType = sanitizeSegment(options.imageType, "image");
    const publicId = `${imageType}-${uuidv4()}`;

    if (hasCloudinaryConfig()) {
      try {
        const upload = await storageService.upload(file.path, {
          resource_type: "image",
          folder: `ecommerce/uploads/${moduleName}`,
          public_id: publicId,
          overwrite: false,
          use_filename: false,
          unique_filename: false,
          context: {
            module: moduleName,
            image_type: imageType,
            original_name: file.originalname || "",
          },
        });

        const url = upload.secure_url || upload.url;
        return {
          imageURL: url,
          url,
          publicId: upload.public_id,
          assetId: upload.asset_id,
          storage: "cloudinary",
          folder: `ecommerce/uploads/${moduleName}`,
          module: moduleName,
          imageType,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        };
      } finally {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    const extension =
      path.extname(file.originalname || "").toLowerCase() ||
      MIME_EXTENSION_MAP[file.mimetype] ||
      ".jpg";
    const fileName = `${publicId}${extension}`;
    const uploadRoot = path.resolve(__dirname, "../../../uploads");
    const destination = path.join(uploadRoot, moduleName, fileName);
    await moveFile(file.path, destination);

    const url = `${getRequestBaseUrl(options.req)}/uploads/${moduleName}/${fileName}`;
    return {
      imageURL: url,
      url,
      publicId: `local/${moduleName}/${fileName}`,
      storage: "local",
      folder: `uploads/${moduleName}`,
      module: moduleName,
      imageType,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}

const fileUploadService = new FileUploadService();

module.exports = {
  ALLOWED_IMAGE_MIME_TYPES,
  fileUploadService,
};
