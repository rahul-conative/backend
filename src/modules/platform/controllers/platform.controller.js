const { okResponse } = require("../../../shared/http/reply");
const { PlatformService } = require("../services/platform.service");

class PlatformController {
  constructor({ platformService = new PlatformService() } = {}) {
    this.platformService = platformService;
  }

  createCategory = async (req, res) => {
    const category = await this.platformService.createCategory(req.body);
    res.status(201).json(okResponse(category));
  };

  updateCategory = async (req, res) => {
    const category = await this.platformService.updateCategory(req.params.categoryKey, req.body);
    res.json(okResponse(category));
  };

  getCategory = async (req, res) => {
    const category = await this.platformService.getCategory(req.params.categoryKey);
    res.json(okResponse(category));
  };

  getCategoryAttributes = async (req, res) => {
    const category = await this.platformService.getCategoryAttributes(req.params.categoryKey);
    res.json(okResponse(category));
  };

  listCategories = async (req, res) => {
    const result = await this.platformService.listCategories(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteCategory = async (req, res) => {
    const category = await this.platformService.deleteCategory(req.params.categoryKey);
    res.json(okResponse(category));
  };

  createProductFamily = async (req, res) => {
    const family = await this.platformService.createProductFamily(req.body);
    res.status(201).json(okResponse(family));
  };

  updateProductFamily = async (req, res) => {
    const family = await this.platformService.updateProductFamily(req.params.familyCode, req.body);
    res.json(okResponse(family));
  };

  getProductFamily = async (req, res) => {
    const family = await this.platformService.getProductFamily(req.params.familyCode);
    res.json(okResponse(family));
  };

  listProductFamilies = async (req, res) => {
    const result = await this.platformService.listProductFamilies(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteProductFamily = async (req, res) => {
    const family = await this.platformService.deleteProductFamily(req.params.familyCode);
    res.json(okResponse(family));
  };

  createProductVariant = async (req, res) => {
    const variant = await this.platformService.createProductVariant(req.body);
    res.status(201).json(okResponse(variant));
  };

  updateProductVariant = async (req, res) => {
    const variant = await this.platformService.updateProductVariant(req.params.variantId, req.body);
    res.json(okResponse(variant));
  };

  getProductVariant = async (req, res) => {
    const variant = await this.platformService.getProductVariant(req.params.variantId);
    res.json(okResponse(variant));
  };

  listProductVariants = async (req, res) => {
    const result = await this.platformService.listProductVariants(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteProductVariant = async (req, res) => {
    const variant = await this.platformService.deleteProductVariant(req.params.variantId);
    res.json(okResponse(variant));
  };

  createHsnCode = async (req, res) => {
    const item = await this.platformService.createHsnCode(req.body);
    res.status(201).json(okResponse(item));
  };

  updateHsnCode = async (req, res) => {
    const item = await this.platformService.updateHsnCode(req.params.hsnCode, req.body);
    res.json(okResponse(item));
  };

  getHsnCode = async (req, res) => {
    const item = await this.platformService.getHsnCode(req.params.hsnCode);
    res.json(okResponse(item));
  };

  listHsnCodes = async (req, res) => {
    const result = await this.platformService.listHsnCodes(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteHsnCode = async (req, res) => {
    const item = await this.platformService.deleteHsnCode(req.params.hsnCode);
    res.json(okResponse(item));
  };

  createGeography = async (req, res) => {
    const item = await this.platformService.createGeography(req.body);
    res.status(201).json(okResponse(item));
  };

  updateGeography = async (req, res) => {
    const item = await this.platformService.updateGeography(req.params.countryCode, req.body);
    res.json(okResponse(item));
  };

  getGeography = async (req, res) => {
    const item = await this.platformService.getGeography(req.params.countryCode);
    res.json(okResponse(item));
  };

  listGeographies = async (req, res) => {
    const result = await this.platformService.listGeographies(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteGeography = async (req, res) => {
    const item = await this.platformService.deleteGeography(req.params.countryCode);
    res.json(okResponse(item));
  };

  createContentPage = async (req, res) => {
    const item = await this.platformService.createContentPage(req.body);
    res.status(201).json(okResponse(item));
  };

  updateContentPage = async (req, res) => {
    const item = await this.platformService.updateContentPage(req.params.slug, req.body);
    res.json(okResponse(item));
  };

  getContentPage = async (req, res) => {
    const item = await this.platformService.getContentPage(req.params.slug);
    res.json(okResponse(item));
  };

  listContentPages = async (req, res) => {
    const result = await this.platformService.listContentPages(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteContentPage = async (req, res) => {
    const item = await this.platformService.deleteContentPage(req.params.slug);
    res.json(okResponse(item));
  };

  createBrand = async (req, res) => {
    const item = await this.platformService.createBrand(req.body);
    res.status(201).json(okResponse(item));
  };

  updateBrand = async (req, res) => {
    const item = await this.platformService.updateBrand(req.params.brandId, req.body);
    res.json(okResponse(item));
  };

  getBrand = async (req, res) => {
    const item = await this.platformService.getBrand(req.params.brandId);
    res.json(okResponse(item));
  };

  listBrands = async (req, res) => {
    const result = await this.platformService.listBrands(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteBrand = async (req, res) => {
    const item = await this.platformService.deleteBrand(req.params.brandId);
    res.json(okResponse(item));
  };

  createWarrantyTemplate = async (req, res) => {
    const item = await this.platformService.createWarrantyTemplate(req.body);
    res.status(201).json(okResponse(item));
  };

  updateWarrantyTemplate = async (req, res) => {
    const item = await this.platformService.updateWarrantyTemplate(req.params.templateId, req.body);
    res.json(okResponse(item));
  };

  getWarrantyTemplate = async (req, res) => {
    const item = await this.platformService.getWarrantyTemplate(req.params.templateId);
    res.json(okResponse(item));
  };

  listWarrantyTemplates = async (req, res) => {
    const result = await this.platformService.listWarrantyTemplates(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteWarrantyTemplate = async (req, res) => {
    const item = await this.platformService.deleteWarrantyTemplate(req.params.templateId);
    res.json(okResponse(item));
  };

  createFinish = async (req, res) => {
    const item = await this.platformService.createFinish(req.body);
    res.status(201).json(okResponse(item));
  };

  updateFinish = async (req, res) => {
    const item = await this.platformService.updateFinish(req.params.finishId, req.body);
    res.json(okResponse(item));
  };

  listFinishes = async (req, res) => {
    const result = await this.platformService.listFinishes(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteFinish = async (req, res) => {
    const item = await this.platformService.deleteFinish(req.params.finishId);
    res.json(okResponse(item));
  };

  createDimension = async (req, res) => {
    const item = await this.platformService.createDimension(req.body);
    res.status(201).json(okResponse(item));
  };

  updateDimension = async (req, res) => {
    const item = await this.platformService.updateDimension(req.params.dimensionId, req.body);
    res.json(okResponse(item));
  };

  listDimensions = async (req, res) => {
    const result = await this.platformService.listDimensions(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteDimension = async (req, res) => {
    const item = await this.platformService.deleteDimension(req.params.dimensionId);
    res.json(okResponse(item));
  };

  createBatch = async (req, res) => {
    const item = await this.platformService.createBatch(req.body);
    res.status(201).json(okResponse(item));
  };

  updateBatch = async (req, res) => {
    const item = await this.platformService.updateBatch(req.params.batchId, req.body);
    res.json(okResponse(item));
  };

  listBatches = async (req, res) => {
    const result = await this.platformService.listBatches(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteBatch = async (req, res) => {
    const item = await this.platformService.deleteBatch(req.params.batchId);
    res.json(okResponse(item));
  };

  createProductOption = async (req, res) => {
    const item = await this.platformService.createProductOption(req.body);
    res.status(201).json(okResponse(item));
  };

  updateProductOption = async (req, res) => {
    const item = await this.platformService.updateProductOption(req.params.optionId, req.body);
    res.json(okResponse(item));
  };

  listProductOptions = async (req, res) => {
    const result = await this.platformService.listProductOptions(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteProductOption = async (req, res) => {
    const item = await this.platformService.deleteProductOption(req.params.optionId);
    res.json(okResponse(item));
  };

  createProductOptionValue = async (req, res) => {
    const item = await this.platformService.createProductOptionValue(req.body);
    res.status(201).json(okResponse(item));
  };

  updateProductOptionValue = async (req, res) => {
    const item = await this.platformService.updateProductOptionValue(req.params.optionValueId, req.body);
    res.json(okResponse(item));
  };

  listProductOptionValues = async (req, res) => {
    const result = await this.platformService.listProductOptionValues(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deleteProductOptionValue = async (req, res) => {
    const item = await this.platformService.deleteProductOptionValue(req.params.optionValueId);
    res.json(okResponse(item));
  };

  getCatalogPrefillData = async (req, res) => {
    const result = await this.platformService.getCatalogPrefillData(req.query);
    res.json(okResponse(result));
  };
}

module.exports = { PlatformController };
