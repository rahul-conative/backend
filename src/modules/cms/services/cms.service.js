const { getPage } = require("../../../shared/tools/page");
const { AppError } = require("../../../shared/errors/app-error");
const { CmsRepository } = require("../repositories/cms.repository");

class CmsService {
  constructor({ cmsRepository = new CmsRepository() } = {}) {
    this.cmsRepository = cmsRepository;
  }

  async createPage(payload) {
    const existing = await this.cmsRepository.findBySlug(payload.slug);
    if (existing) {
      throw new AppError("A page with this slug already exists", 409);
    }
    if (payload.published && !payload.publishedAt) {
      payload.publishedAt = new Date();
    }
    return this.cmsRepository.create(payload);
  }

  async updatePage(slug, payload) {
    const page = await this.cmsRepository.findBySlug(slug);
    if (!page) {
      throw new AppError("Page not found", 404);
    }
    if (payload.published && !page.publishedAt && !payload.publishedAt) {
      payload.publishedAt = new Date();
    }
    return this.cmsRepository.update(slug, payload);
  }

  async getPage(slug) {
    const page = await this.cmsRepository.findBySlug(slug);
    if (!page) {
      throw new AppError("Page not found", 404);
    }
    return page;
  }

  async getPublishedPage(slug) {
    const page = await this.cmsRepository.findBySlug(slug);
    if (!page || !page.published) {
      throw new AppError("Page not found", 404);
    }
    return page;
  }

  async listPages(query) {
    const pagination = getPage(query);
    const filter = {};
    if (query.pageType) filter.pageType = query.pageType;
    if (query.language) filter.language = query.language;
    if (query.published !== undefined) {
      filter.published = query.published === true || query.published === "true";
    }
    const q = query.q || query.search;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { body: { $regex: q, $options: "i" } },
      ];
    }
    return this.cmsRepository.list(filter, pagination);
  }

  async listPublishedPages(query) {
    return this.listPages({ ...query, published: true });
  }

  async deletePage(slug) {
    const page = await this.cmsRepository.findBySlug(slug);
    if (!page) {
      throw new AppError("Page not found", 404);
    }
    return this.cmsRepository.delete(slug);
  }
}

module.exports = { CmsService };
