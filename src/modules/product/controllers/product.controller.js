const { okResponse } = require("../../../shared/http/reply");
const { ProductService } = require("../services/product.service");
const { getCurrentUser } = require("../../../shared/auth/current-user");

class ProductController {
  constructor({ productService = new ProductService() } = {}) {
    this.productService = productService;
  }

  create = async (req, res) => {
    const actor = getCurrentUser(req);
    const product = await this.productService.createProduct(req.body, actor);
    res.status(201).json(okResponse(product));
  };

  list = async (req, res) => {
    const result = await this.productService.listProducts(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  listMine = async (req, res) => {
    const actor = getCurrentUser(req);
    const result = await this.productService.listSellerProducts(req.query, actor);
    res.json(okResponse(result.items, { total: result.total }));
  };

  getOne = async (req, res) => {
    const product = await this.productService.getProduct(req.params.productId);
    res.json(okResponse(product));
  };

  search = async (req, res) => {
    const products = await this.productService.searchProducts(req.query);
    res.json(okResponse(products));
  };

  update = async (req, res) => {
    const actor = getCurrentUser(req);
    const product = await this.productService.updateProduct(req.params.productId, req.body, actor);
    res.json(okResponse(product));
  };

  review = async (req, res) => {
    const actor = getCurrentUser(req);
    const product = await this.productService.reviewProduct(req.params.productId, req.body, actor);
    res.json(okResponse(product));
  };

  delete = async (req, res) => {
    const actor = getCurrentUser(req);
    const product = await this.productService.deleteProduct(req.params.productId, actor);
    res.json(okResponse(product));
  };
}

module.exports = { ProductController };
