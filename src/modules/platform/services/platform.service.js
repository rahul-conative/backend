const { getPage } = require("../../../shared/tools/page");
const { PlatformRepository } = require("../repositories/platform.repository");
const { AppError } = require("../../../shared/errors/app-error");

class PlatformService {
  constructor({ platformRepository = new PlatformRepository() } = {}) {
    this.platformRepository = platformRepository;
  }

  async createCategory(payload) {
    return this.platformRepository.createCategory(payload);
  }

  async updateCategory(categoryKey, payload) {
    const category = await this.platformRepository.getCategory(categoryKey);
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    return this.platformRepository.updateCategory(categoryKey, payload);
  }

  async getCategory(categoryKey) {
    const category = await this.platformRepository.getCategory(categoryKey);
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    return category;
  }

  normalizeCategoryAttributes(category = {}) {
    if (Array.isArray(category.attributeSchema) && category.attributeSchema.length) {
      return category.attributeSchema;
    }
    const legacy = category.attributesSchema || {};
    return Object.keys(legacy).map((key) => ({
      key,
      label: key,
      type: Array.isArray(legacy[key]) ? "multi_select" : "text",
      required: false,
      options: Array.isArray(legacy[key]) ? legacy[key] : [],
      isVariantAttribute: false,
      isFilterable: false,
      isSearchable: false,
    }));
  }

  async getCategoryAttributes(categoryKey) {
    const category = await this.getCategory(categoryKey);
    return {
      categoryKey: category.categoryKey,
      title: category.title,
      attributeSchema: this.normalizeCategoryAttributes(category),
    };
  }

  async listCategories(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.parentKey) filter.parentKey = query.parentKey;
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    if (query.categoryKey) filter.categoryKey = query.categoryKey;
    return this.platformRepository.listCategories(filter, pagination);
  }

  async deleteCategory(categoryKey) {
    const category = await this.platformRepository.getCategory(categoryKey);
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    return this.platformRepository.deleteCategory(categoryKey);
  }

  async createProductFamily(payload) {
    return this.platformRepository.createProductFamily(payload);
  }

  async updateProductFamily(familyCode, payload) {
    const family = await this.platformRepository.getProductFamily(familyCode);
    if (!family) {
      throw new AppError("Product family not found", 404);
    }
    return this.platformRepository.updateProductFamily(familyCode, payload);
  }

  async getProductFamily(familyCode) {
    const family = await this.platformRepository.getProductFamily(familyCode);
    if (!family) {
      throw new AppError("Product family not found", 404);
    }
    return family;
  }

  async listProductFamilies(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.category) filter.category = query.category;
    if (query.sellerId) filter.sellerId = query.sellerId;
    if (query.status) filter.status = query.status;
    return this.platformRepository.listProductFamilies(filter, pagination);
  }

  async deleteProductFamily(familyCode) {
    const family = await this.platformRepository.getProductFamily(familyCode);
    if (!family) {
      throw new AppError("Product family not found", 404);
    }
    return this.platformRepository.deleteProductFamily(familyCode);
  }

  async createProductVariant(payload) {
    return this.platformRepository.createProductVariant(payload);
  }

  async updateProductVariant(variantId, payload) {
    const variant = await this.platformRepository.getProductVariant(variantId);
    if (!variant) {
      throw new AppError("Product variant not found", 404);
    }
    return this.platformRepository.updateProductVariant(variantId, payload);
  }

  async getProductVariant(variantId) {
    const variant = await this.platformRepository.getProductVariant(variantId);
    if (!variant) {
      throw new AppError("Product variant not found", 404);
    }
    return variant;
  }

  async listProductVariants(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.productId) filter.productId = query.productId;
    if (query.familyCode) filter.familyCode = query.familyCode;
    if (query.sellerId) filter.sellerId = query.sellerId;
    if (query.sku) filter.sku = { $regex: query.sku, $options: "i" };
    if (query.status) filter.status = query.status;
    const q = query.q || query.keyWord || query.search;
    if (q) {
      filter.$or = [
        { sku: { $regex: q, $options: "i" } },
        { familyCode: { $regex: q, $options: "i" } },
      ];
    }
    return this.platformRepository.listProductVariants(filter, pagination);
  }

  async deleteProductVariant(variantId) {
    const variant = await this.platformRepository.getProductVariant(variantId);
    if (!variant) {
      throw new AppError("Product variant not found", 404);
    }
    return this.platformRepository.deleteProductVariant(variantId);
  }

  async createHsnCode(payload) {
    return this.platformRepository.createHsnCode(payload);
  }

  async updateHsnCode(code, payload) {
    const item = await this.platformRepository.getHsnCode(code);
    if (!item) {
      throw new AppError("HSN code not found", 404);
    }
    return this.platformRepository.updateHsnCode(code, payload);
  }

  async getHsnCode(code) {
    const item = await this.platformRepository.getHsnCode(code);
    if (!item) {
      throw new AppError("HSN code not found", 404);
    }
    return item;
  }

  async listHsnCodes(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    if (query.category) filter.category = query.category;
    const q = query.q || query.keyWord || query.search;
    if (q) {
      filter.$or = [
        { code: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }
    return this.platformRepository.listHsnCodes(filter, pagination);
  }

  async deleteHsnCode(code) {
    const item = await this.platformRepository.getHsnCode(code);
    if (!item) {
      throw new AppError("HSN code not found", 404);
    }
    return this.platformRepository.deleteHsnCode(code);
  }

  async createGeography(payload) {
    return this.platformRepository.createGeography(payload);
  }

  async updateGeography(countryCode, payload) {
    const item = await this.platformRepository.getGeography(countryCode);
    if (!item) {
      throw new AppError("Geography record not found", 404);
    }
    return this.platformRepository.updateGeography(countryCode, payload);
  }

  async getGeography(countryCode) {
    const item = await this.platformRepository.getGeography(countryCode);
    if (!item) {
      throw new AppError("Geography record not found", 404);
    }
    return item;
  }

  async listGeographies(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    return this.platformRepository.listGeographies(filter, pagination);
  }

  async deleteGeography(countryCode) {
    const item = await this.platformRepository.getGeography(countryCode);
    if (!item) {
      throw new AppError("Geography record not found", 404);
    }
    return this.platformRepository.deleteGeography(countryCode);
  }

  async createContentPage(payload) {
    if (payload.published && !payload.publishedAt) {
      payload.publishedAt = new Date();
    }
    return this.platformRepository.createContentPage(payload);
  }

  async updateContentPage(slug, payload) {
    const item = await this.platformRepository.getContentPage(slug);
    if (!item) {
      throw new AppError("Content page not found", 404);
    }
    if (payload.published && !payload.publishedAt) {
      payload.publishedAt = new Date();
    }
    return this.platformRepository.updateContentPage(slug, payload);
  }

  async getContentPage(slug) {
    const item = await this.platformRepository.getContentPage(slug);
    if (!item) {
      throw new AppError("Content page not found", 404);
    }
    return item;
  }

  async listContentPages(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.pageType) filter.pageType = query.pageType;
    if (query.language) filter.language = query.language;
    if (query.published !== undefined) filter.published = query.published === true || query.published === "true";
    const q = query.q || query.keyWord || query.search;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { body: { $regex: q, $options: "i" } },
      ];
    }
    return this.platformRepository.listContentPages(filter, pagination);
  }

  async deleteContentPage(slug) {
    const item = await this.platformRepository.getContentPage(slug);
    if (!item) {
      throw new AppError("Content page not found", 404);
    }
    return this.platformRepository.deleteContentPage(slug);
  }

  async createBrand(payload) {
    return this.platformRepository.createBrand(payload);
  }

  async updateBrand(brandId, payload) {
    const item = await this.platformRepository.getBrand(brandId);
    if (!item) {
      throw new AppError("Brand not found", 404);
    }
    return this.platformRepository.updateBrand(brandId, payload);
  }

  async getBrand(brandId) {
    const item = await this.platformRepository.getBrand(brandId);
    if (!item) {
      throw new AppError("Brand not found", 404);
    }
    return item;
  }

  async listBrands(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    const q = query.q || query.keyWord || query.search;
    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }
    return this.platformRepository.listBrands(filter, pagination);
  }

  async deleteBrand(brandId) {
    const item = await this.platformRepository.getBrand(brandId);
    if (!item) {
      throw new AppError("Brand not found", 404);
    }
    return this.platformRepository.deleteBrand(brandId);
  }

  async createWarrantyTemplate(payload) {
    return this.platformRepository.createWarrantyTemplate(payload);
  }

  async updateWarrantyTemplate(templateId, payload) {
    const item = await this.platformRepository.getWarrantyTemplate(templateId);
    if (!item) {
      throw new AppError("Warranty template not found", 404);
    }
    return this.platformRepository.updateWarrantyTemplate(templateId, payload);
  }

  async getWarrantyTemplate(templateId) {
    const item = await this.platformRepository.getWarrantyTemplate(templateId);
    if (!item) {
      throw new AppError("Warranty template not found", 404);
    }
    return item;
  }

  async listWarrantyTemplates(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    const q = query.q || query.keyWord || query.search;
    if (q) {
      filter.period = { $regex: q, $options: "i" };
    }
    return this.platformRepository.listWarrantyTemplates(filter, pagination);
  }

  async deleteWarrantyTemplate(templateId) {
    const item = await this.platformRepository.getWarrantyTemplate(templateId);
    if (!item) {
      throw new AppError("Warranty template not found", 404);
    }
    return this.platformRepository.deleteWarrantyTemplate(templateId);
  }

  async createFinish(payload) {
    return this.platformRepository.createFinish(payload);
  }

  async updateFinish(finishId, payload) {
    const item = await this.platformRepository.getFinish(finishId);
    if (!item) throw new AppError("Finish not found", 404);
    return this.platformRepository.updateFinish(finishId, payload);
  }

  async listFinishes(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    const q = query.q || query.keyWord || query.search;
    if (q) filter.name = { $regex: q, $options: "i" };
    return this.platformRepository.listFinishes(filter, pagination);
  }

  async deleteFinish(finishId) {
    const item = await this.platformRepository.getFinish(finishId);
    if (!item) throw new AppError("Finish not found", 404);
    return this.platformRepository.deleteFinish(finishId);
  }

  async createDimension(payload) {
    return this.platformRepository.createDimension(payload);
  }

  async updateDimension(dimensionId, payload) {
    const item = await this.platformRepository.getDimension(dimensionId);
    if (!item) throw new AppError("Dimension not found", 404);
    return this.platformRepository.updateDimension(dimensionId, payload);
  }

  async listDimensions(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    const q = query.q || query.keyWord || query.search;
    if (q) filter.dimensions_value = { $regex: q, $options: "i" };
    return this.platformRepository.listDimensions(filter, pagination);
  }

  async deleteDimension(dimensionId) {
    const item = await this.platformRepository.getDimension(dimensionId);
    if (!item) throw new AppError("Dimension not found", 404);
    return this.platformRepository.deleteDimension(dimensionId);
  }

  async createBatch(payload) {
    return this.platformRepository.createBatch(payload);
  }

  async updateBatch(batchId, payload) {
    const item = await this.platformRepository.getBatch(batchId);
    if (!item) throw new AppError("Batch not found", 404);
    return this.platformRepository.updateBatch(batchId, payload);
  }

  async listBatches(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    const q = query.q || query.keyWord || query.search;
    if (q) filter.batchCode = { $regex: q, $options: "i" };
    return this.platformRepository.listBatches(filter, pagination);
  }

  async deleteBatch(batchId) {
    const item = await this.platformRepository.getBatch(batchId);
    if (!item) throw new AppError("Batch not found", 404);
    return this.platformRepository.deleteBatch(batchId);
  }

  async createProductOption(payload) {
    return this.platformRepository.createProductOption(payload);
  }

  async updateProductOption(optionId, payload) {
    const item = await this.platformRepository.getProductOption(optionId);
    if (!item) throw new AppError("Product option not found", 404);
    return this.platformRepository.updateProductOption(optionId, payload);
  }

  async listProductOptions(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    const q = query.q || query.keyWord || query.search;
    if (q) filter.name = { $regex: q, $options: "i" };
    return this.platformRepository.listProductOptions(filter, pagination);
  }

  async deleteProductOption(optionId) {
    const item = await this.platformRepository.getProductOption(optionId);
    if (!item) throw new AppError("Product option not found", 404);
    return this.platformRepository.deleteProductOption(optionId);
  }

  async createProductOptionValue(payload) {
    return this.platformRepository.createProductOptionValue(payload);
  }

  async updateProductOptionValue(optionValueId, payload) {
    const item = await this.platformRepository.getProductOptionValue(optionValueId);
    if (!item) throw new AppError("Product option value not found", 404);
    return this.platformRepository.updateProductOptionValue(optionValueId, payload);
  }

  async listProductOptionValues(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.option_id) filter.option_id = query.option_id;
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    const q = query.q || query.keyWord || query.search;
    if (q) filter.name = { $regex: q, $options: "i" };
    return this.platformRepository.listProductOptionValues(filter, pagination);
  }

  async deleteProductOptionValue(optionValueId) {
    const item = await this.platformRepository.getProductOptionValue(optionValueId);
    if (!item) throw new AppError("Product option value not found", 404);
    return this.platformRepository.deleteProductOptionValue(optionValueId);
  }
}

module.exports = { PlatformService };
