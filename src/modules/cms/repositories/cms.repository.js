const { StaticPageModel } = require("../models/static-page.model");

class CmsRepository {
  async create(payload) {
    return StaticPageModel.create(payload);
  }

  async update(slug, payload) {
    return StaticPageModel.findOneAndUpdate({ slug }, payload, { new: true });
  }

  async findBySlug(slug) {
    return StaticPageModel.findOne({ slug });
  }

  async list(filter = {}, pagination = {}) {
    const [items, total] = await Promise.all([
      StaticPageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      StaticPageModel.countDocuments(filter),
    ]);
    return { items, total };
  }

  async delete(slug) {
    return StaticPageModel.findOneAndDelete({ slug });
  }
}

module.exports = { CmsRepository };
