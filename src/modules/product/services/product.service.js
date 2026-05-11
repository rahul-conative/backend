const slugify = require("slugify");
const { getPage } = require("../../../shared/tools/page");
const { ProductRepository } = require("../repositories/product.repository");
const { elasticsearchClient } = require("../../../shared/search/elasticsearch-client");
const { remember } = require("../../../shared/tools/cache");
const { AppError } = require("../../../shared/errors/app-error");
const { PRODUCT_STATUS } = require("../../../shared/domain/commerce-constants");
const { logger } = require("../../../shared/logger/logger");
const { PlatformRepository } = require("../../platform/repositories/platform.repository");

class ProductService {
  constructor({
    productRepository = new ProductRepository(),
    platformRepository = new PlatformRepository(),
  } = {}) {
    this.productRepository = productRepository;
    this.platformRepository = platformRepository;
  }

  normalizeCategoryAttributes(category = {}) {
    if (Array.isArray(category.attributeSchema) && category.attributeSchema.length) {
      return category.attributeSchema;
    }
    const legacy = category.attributesSchema || {};
    return Object.keys(legacy).map((key) => ({
      key,
      type: Array.isArray(legacy[key]) ? "multi_select" : "text",
      required: false,
      options: Array.isArray(legacy[key]) ? legacy[key] : [],
    }));
  }

  validateDynamicAttributes(attributeSchema = [], attributes = {}) {
    const normalizedAttributes =
      attributes instanceof Map ? Object.fromEntries(attributes) : attributes;
    for (const field of attributeSchema) {
      const value = normalizedAttributes?.[field.key];
      if (field.required && (value === undefined || value === null || value === "")) {
        throw new AppError(`Attribute '${field.key}' is required`, 400);
      }
      if (value === undefined || value === null) continue;
      if (field.type === "number" && Number.isNaN(Number(value))) {
        throw new AppError(`Attribute '${field.key}' must be a number`, 400);
      }
      if (field.type === "boolean" && typeof value !== "boolean") {
        throw new AppError(`Attribute '${field.key}' must be boolean`, 400);
      }
      if (field.type === "select" && Array.isArray(field.options) && field.options.length && !field.options.includes(String(value))) {
        throw new AppError(`Attribute '${field.key}' has invalid option`, 400);
      }
      if (field.type === "multi_select") {
        if (!Array.isArray(value)) {
          throw new AppError(`Attribute '${field.key}' must be an array`, 400);
        }
        if (Array.isArray(field.options) && field.options.length) {
          const badValue = value.find((item) => !field.options.includes(String(item)));
          if (badValue !== undefined) {
            throw new AppError(`Attribute '${field.key}' has invalid option`, 400);
          }
        }
      }
    }
  }

  validateVariants(variants = []) {
    const skus = new Set();
    for (const variant of variants) {
      if (!variant?.sku) continue;
      if (skus.has(variant.sku)) {
        throw new AppError("Variant SKU must be unique", 400);
      }
      skus.add(variant.sku);
      if (variant.stock !== undefined && Number(variant.stock) < 0) {
        throw new AppError("Variant stock must be non-negative", 400);
      }
    }
  }

  normalizeImages(images = []) {
    if (!Array.isArray(images)) {
      return [];
    }

    return Array.from(
      new Set(
        images
          .map((image) => (typeof image === "string" ? image.trim() : ""))
          .filter(Boolean),
      ),
    );
  }

  normalizeProductMedia(payload = {}) {
    const normalized = { ...payload };

    if (Object.prototype.hasOwnProperty.call(payload, "images")) {
      normalized.images = this.normalizeImages(payload.images);
    }

    if (Object.prototype.hasOwnProperty.call(payload, "variants")) {
      normalized.variants = (payload.variants || []).map((variant) => ({
        ...variant,
        images: this.normalizeImages(variant.images),
      }));
    }

    return normalized;
  }

  async createProduct(payload, actor) {
    payload = this.normalizeProductMedia(payload);
    const categoryKey = payload.categoryId || payload.category;
    const category = await this.platformRepository.getCategory(categoryKey);
    if (!category) {
      throw new AppError("Category not found", 400);
    }
    this.validateDynamicAttributes(
      this.normalizeCategoryAttributes(category),
      payload.attributes || {},
    );
    this.validateVariants(payload.variants || []);

    const isSeller = actor.role === "seller" || actor.role === "seller-sub-admin";
    const status = isSeller ? PRODUCT_STATUS.PENDING_APPROVAL : payload.status || PRODUCT_STATUS.DRAFT;
    const sellerId = isSeller ? actor.ownerSellerId || actor.userId : payload.sellerId || actor.userId;
    const product = await this.productRepository.create({
      ...payload,
      categoryId: payload.categoryId || payload.category,
      status,
      sellerId,
      slug: slugify(`${payload.title}-${Date.now()}`, { lower: true, strict: true }),
      moderation: {
        submittedAt: new Date(),
        checklist: payload.moderationChecklist || {
          titleVerified: false,
          categoryVerified: false,
          complianceVerified: false,
          mediaVerified: false,
        },
      },
    });

    if (product.status === PRODUCT_STATUS.ACTIVE) {
      try {
        await elasticsearchClient.index({
          index: "products",
          document: {
            id: product.id,
            title: product.title,
            category: product.category,
            description: product.description,
            price: product.price,
            hsnCode: product.hsnCode,
            color: product.color,
            origin: product.origin,
          },
        });
      } catch (error) {
        logger.error(
          { err: error, productId: product.id },
          "Elasticsearch index failed during product creation",
        );
      }
    }

    return product;
  }

  async updateProduct(productId, payload, actor) {
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    if (
      (actor.role === "seller" || actor.role === "seller-sub-admin") &&
      existingProduct.sellerId !== (actor.ownerSellerId || actor.userId)
    ) {
      throw new AppError("Permission denied", 403);
    }

    payload = this.normalizeProductMedia(payload);

    const categoryKey = payload.categoryId || payload.category || existingProduct.categoryId || existingProduct.category;
    const category = await this.platformRepository.getCategory(categoryKey);
    if (!category) {
      throw new AppError("Category not found", 400);
    }
    const nextAttributes = payload.attributes || existingProduct.attributes || {};
    this.validateDynamicAttributes(this.normalizeCategoryAttributes(category), nextAttributes);
    this.validateVariants(payload.variants || existingProduct.variants || []);

    const updatePayload = {
      ...payload,
      ...(payload.categoryId || payload.category
        ? { categoryId: payload.categoryId || payload.category }
        : {}),
    };
    const updatedProduct = await this.productRepository.update(productId, updatePayload);

    if (updatedProduct.status === PRODUCT_STATUS.ACTIVE) {
      try {
        await elasticsearchClient.index({
          index: "products",
          id: String(updatedProduct.id),
          document: {
            id: updatedProduct.id,
            title: updatedProduct.title,
            category: updatedProduct.category,
            description: updatedProduct.description,
            price: updatedProduct.price,
            hsnCode: updatedProduct.hsnCode,
            color: updatedProduct.color,
            origin: updatedProduct.origin,
          },
        });
      } catch (error) {
        logger.error(
          { err: error, productId: updatedProduct.id },
          "Elasticsearch index failed during product update",
        );
      }
    }

    return updatedProduct;
  }

  async listProducts(query) {
    const pagination = getPage(query);
    const filter = {};

    if (query.category) {
      filter.category = query.category;
    }
    if (query.hsnCode) {
      filter.hsnCode = query.hsnCode;
    }
    if (query.color) {
      filter.color = query.color;
    }
    if (query.productFamilyCode) {
      filter.productFamilyCode = query.productFamilyCode;
    }
    if (query.sku) {
      filter.sku = query.sku;
    }
    if (query.sellerId) {
      filter.sellerId = query.sellerId;
    }
    if (query.q || query.keyWord || query.search) {
      const q = query.q || query.keyWord || query.search;
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
      ];
    }
    if (query.country) {
      filter["origin.country"] = query.country;
    }
    if (query.state) {
      filter["origin.state"] = query.state;
    }
    if (query.city) {
      filter["origin.city"] = query.city;
    }

    if (query.includeAllStatuses === true || query.includeAllStatuses === "true") {
      if (query.status) {
        filter.status = query.status;
      }
    } else {
      filter.status = query.status || PRODUCT_STATUS.ACTIVE;
    }

    return remember(`products:${JSON.stringify({ filter, pagination })}`, 60, () =>
      this.productRepository.paginate(filter, pagination),
    );
  }

  async listSellerProducts(query, actor) {
    const pagination = getPage(query);
    const sellerId = actor.ownerSellerId || actor.userId;
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.sku) {
      filter.sku = query.sku;
    }

    return this.productRepository.paginateBySeller(sellerId, filter, pagination);
  }

  async getProduct(productId) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  async searchProducts(query) {
    try {
      const response = await elasticsearchClient.search({
        index: "products",
        query: {
          multi_match: {
            query: query.q,
            fields: ["title^3", "category", "description", "color", "hsnCode"],
          },
        },
      });

      return response.hits.hits.map((item) => item._source);
    } catch (error) {
      logger.warn(
        { err: error, query: query.q },
        "Elasticsearch search failed, falling back to Mongo search",
      );
      return this.productRepository.search(query.q, 50);
    }
  }

  async reviewProduct(productId, payload, actor) {
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    const nextStatus = payload.status;
    const updatedProduct = await this.productRepository.reviewProduct(productId, {
      status: nextStatus,
      approvedBy: nextStatus === PRODUCT_STATUS.ACTIVE ? actor.userId : null,
      approvedAt: nextStatus === PRODUCT_STATUS.ACTIVE ? new Date() : null,
      rejectionReason: nextStatus === PRODUCT_STATUS.REJECTED ? payload.rejectionReason || null : null,
      moderation: {
        ...(existingProduct.moderation || {}),
        reviewedAt: new Date(),
        reviewedBy: actor.userId,
        rejectionReason: payload.rejectionReason || null,
        checklist: payload.checklist || existingProduct.moderation?.checklist || {},
      },
    });

    if (nextStatus === PRODUCT_STATUS.ACTIVE) {
      try {
        await elasticsearchClient.index({
          index: "products",
          id: String(updatedProduct.id),
          document: {
            id: updatedProduct.id,
            title: updatedProduct.title,
            category: updatedProduct.category,
            price: updatedProduct.price,
            description: updatedProduct.description,
          },
        });
      } catch (error) {
        logger.error(
          { err: error, productId: updatedProduct.id },
          "Elasticsearch index failed during product moderation",
        );
      }
    }

    if ([PRODUCT_STATUS.INACTIVE, PRODUCT_STATUS.REJECTED].includes(nextStatus)) {
      try {
        await elasticsearchClient.delete({
          index: "products",
          id: String(existingProduct.id),
        });
      } catch (error) {
        if (error?.meta?.statusCode !== 404) {
          logger.error(
            { err: error, productId: existingProduct.id },
            "Elasticsearch delete failed during product moderation",
          );
        }
      }
    }

    return updatedProduct;
  }

  async deleteProduct(productId, actor) {
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    const sellerId = actor.ownerSellerId || actor.userId;
    if (["seller", "seller-sub-admin"].includes(actor.role) && existingProduct.sellerId !== sellerId) {
      throw new AppError("Permission denied", 403);
    }

    return this.productRepository.delete(productId);
  }
}

module.exports = { ProductService };
