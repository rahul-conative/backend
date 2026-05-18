const { okResponse } = require("../../../shared/http/reply");
const { CmsService } = require("../services/cms.service");

class CmsController {
  constructor({ cmsService = new CmsService() } = {}) {
    this.cmsService = cmsService;
  }

  // Admin: full CRUD
  createPage = async (req, res) => {
    const page = await this.cmsService.createPage(req.body);
    res.status(201).json(okResponse(page));
  };

  updatePage = async (req, res) => {
    const page = await this.cmsService.updatePage(req.params.slug, req.body);
    res.json(okResponse(page));
  };

  getPage = async (req, res) => {
    const page = await this.cmsService.getPage(req.params.slug);
    res.json(okResponse(page));
  };

  listPages = async (req, res) => {
    const result = await this.cmsService.listPages(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };

  deletePage = async (req, res) => {
    const page = await this.cmsService.deletePage(req.params.slug);
    res.json(okResponse(page));
  };

  // Public: published pages only
  getPublishedPage = async (req, res) => {
    const page = await this.cmsService.getPublishedPage(req.params.slug);
    res.json(okResponse(page));
  };

  listPublishedPages = async (req, res) => {
    const result = await this.cmsService.listPublishedPages(req.query);
    res.json(okResponse(result.items, { total: result.total }));
  };
}

module.exports = { CmsController };
