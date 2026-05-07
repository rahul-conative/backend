const { AppError } = require("../../../shared/errors/app-error");
const {
  AdminCountryModel,
  AdminStateModel,
  AdminCityModel,
  AdminTaxModel,
  AdminSubTaxModel,
  AdminTaxRuleModel,
} = require("../models/common-management.model");

const toPage = ({ page = 1, limit = 20, size } = {}) => {
  const pageNumber = Math.max(Number(page || 1), 1);
  const limitNumber = Math.min(Math.max(Number(limit || size || 20), 1), 100);
  return {
    page: pageNumber,
    limit: limitNumber,
    skip: (pageNumber - 1) * limitNumber,
  };
};

const regex = (value = "") => ({ $regex: String(value || ""), $options: "i" });

class CommonManagementService {
  toLegacy(record = {}, extras = {}) {
    const item = typeof record.toObject === "function" ? record.toObject() : record;
    return {
      ...item,
      ...extras,
      _id: String(item._id),
      id: String(item._id),
      isDisable: item.active === false,
    };
  }

  async list(model, query = {}, filter = {}, sort = { createdAt: -1 }, populate = null) {
    const page = toPage(query);
    const q = query.q || query.keyWord || query.search || "";
    const finalFilter = { ...filter };
    if (query.active !== undefined) {
      finalFilter.active = query.active === true || query.active === "true";
    }
    if (q) {
      finalFilter.$or = [
        { name: regex(q) },
        { code: regex(q) },
        { description: regex(q) },
      ];
    }

    let findQuery = model.find(finalFilter).sort(sort).skip(page.skip).limit(page.limit);
    if (populate) findQuery = findQuery.populate(populate);
    const [items, total] = await Promise.all([
      findQuery,
      model.countDocuments(finalFilter),
    ]);

    return {
      items: items.map((item) => this.toLegacy(item)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async setStatus(model, ids = [], isDisable = false) {
    const normalizedIds = Array.isArray(ids) ? ids : [ids];
    await model.updateMany(
      { _id: { $in: normalizedIds.filter(Boolean) } },
      { $set: { active: !isDisable } },
    );
    return { updated: normalizedIds.length, active: !isDisable };
  }

  async deleteMany(model, ids = []) {
    const normalizedIds = Array.isArray(ids) ? ids : [ids];
    await model.deleteMany({ _id: { $in: normalizedIds.filter(Boolean) } });
    return { deleted: normalizedIds.length };
  }

  async listCountries(query) {
    return this.list(AdminCountryModel, query, {}, { name: 1 });
  }

  async createCountry(payload) {
    const country = await AdminCountryModel.create({
      name: payload.name,
      code: String(payload.code || "").toUpperCase(),
      dialCode: payload.dialCode || "",
      active: payload.active ?? payload.isDisable !== true,
    });
    return this.toLegacy(country);
  }

  async updateCountry(id, payload) {
    const country = await AdminCountryModel.findByIdAndUpdate(
      id,
      {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.code !== undefined ? { code: String(payload.code).toUpperCase() } : {}),
        ...(payload.dialCode !== undefined ? { dialCode: payload.dialCode } : {}),
        ...(payload.active !== undefined ? { active: payload.active } : {}),
        ...(payload.isDisable !== undefined ? { active: !payload.isDisable } : {}),
      },
      { new: true },
    );
    if (!country) throw new AppError("Country not found", 404);
    return this.toLegacy(country);
  }

  async listStates(query = {}) {
    const filter = {};
    const countryId = query.countryId || query.country_code;
    if (countryId) filter.countryId = countryId;
    const result = await this.list(AdminStateModel, query, filter, { name: 1 }, "countryId");
    result.items = result.items.map((item) =>
      this.toLegacy(item, {
        country_code: item.countryId
          ? {
              _id: String(item.countryId._id || item.countryId),
              name: item.countryId.name,
              code: item.countryId.code,
            }
          : null,
      }),
    );
    return result;
  }

  async createState(payload) {
    const state = await AdminStateModel.create({
      name: payload.name,
      countryId: payload.countryId || payload.country_code,
      active: payload.active ?? payload.isDisable !== true,
    });
    return this.toLegacy(await state.populate("countryId"));
  }

  async updateState(id, payload) {
    const state = await AdminStateModel.findByIdAndUpdate(
      id,
      {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.countryId || payload.country_code
          ? { countryId: payload.countryId || payload.country_code }
          : {}),
        ...(payload.active !== undefined ? { active: payload.active } : {}),
        ...(payload.isDisable !== undefined ? { active: !payload.isDisable } : {}),
      },
      { new: true },
    ).populate("countryId");
    if (!state) throw new AppError("State not found", 404);
    return this.toLegacy(state);
  }

  async listCities(query = {}) {
    const filter = {};
    const stateId = query.stateId || query.state_code;
    if (stateId) filter.stateId = stateId;
    const result = await this.list(AdminCityModel, query, filter, { name: 1 }, "stateId");
    result.items = result.items.map((item) =>
      this.toLegacy(item, {
        state_code: item.stateId
          ? {
              _id: String(item.stateId._id || item.stateId),
              name: item.stateId.name,
            }
          : null,
      }),
    );
    return result;
  }

  async createCity(payload) {
    const city = await AdminCityModel.create({
      name: payload.name,
      stateId: payload.stateId || payload.state_code,
      active: payload.active ?? payload.isDisable !== true,
    });
    return this.toLegacy(await city.populate("stateId"));
  }

  async updateCity(id, payload) {
    const city = await AdminCityModel.findByIdAndUpdate(
      id,
      {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.stateId || payload.state_code
          ? { stateId: payload.stateId || payload.state_code }
          : {}),
        ...(payload.active !== undefined ? { active: payload.active } : {}),
        ...(payload.isDisable !== undefined ? { active: !payload.isDisable } : {}),
      },
      { new: true },
    ).populate("stateId");
    if (!city) throw new AppError("City not found", 404);
    return this.toLegacy(city);
  }

  async listTaxes(query = {}) {
    const filter = {};
    const countryId = query.countryId || query.country_code;
    if (countryId) filter.countryId = countryId;
    const result = await this.list(AdminTaxModel, query, filter, { name: 1 }, "countryId");
    result.items = result.items.map((item) =>
      this.toLegacy(item, {
        country_code: item.countryId
          ? {
              _id: String(item.countryId._id || item.countryId),
              name: item.countryId.name,
              code: item.countryId.code,
            }
          : null,
      }),
    );
    return result;
  }

  async createTax(payload) {
    const tax = await AdminTaxModel.create({
      name: payload.name,
      countryId: payload.countryId || payload.country_code || undefined,
      active: payload.active ?? payload.isDisable !== true,
    });
    return this.toLegacy(await tax.populate("countryId"));
  }

  async updateTax(id, payload) {
    const tax = await AdminTaxModel.findByIdAndUpdate(
      id,
      {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.countryId || payload.country_code
          ? { countryId: payload.countryId || payload.country_code }
          : {}),
        ...(payload.active !== undefined ? { active: payload.active } : {}),
        ...(payload.isDisable !== undefined ? { active: !payload.isDisable } : {}),
      },
      { new: true },
    ).populate("countryId");
    if (!tax) throw new AppError("Tax not found", 404);
    return this.toLegacy(tax);
  }

  async listSubTaxes(query = {}) {
    const filter = {};
    const taxId = query.taxId || query.tax_id;
    if (taxId) filter.taxId = taxId;
    const result = await this.list(AdminSubTaxModel, query, filter, { name: 1 }, "taxId");
    result.items = result.items.map((item) =>
      this.toLegacy(item, {
        tax_id: item.taxId
          ? { _id: String(item.taxId._id || item.taxId), name: item.taxId.name }
          : null,
      }),
    );
    return result;
  }

  async createSubTax(payload) {
    const subTax = await AdminSubTaxModel.create({
      name: payload.name,
      percentage: Number(payload.percentage || payload.percent || 0),
      taxId: payload.taxId || payload.tax_id,
      active: payload.active ?? payload.isDisable !== true,
    });
    return this.toLegacy(await subTax.populate("taxId"));
  }

  async updateSubTax(id, payload) {
    const subTax = await AdminSubTaxModel.findByIdAndUpdate(
      id,
      {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.percentage !== undefined || payload.percent !== undefined
          ? { percentage: Number(payload.percentage ?? payload.percent) }
          : {}),
        ...(payload.taxId || payload.tax_id ? { taxId: payload.taxId || payload.tax_id } : {}),
        ...(payload.active !== undefined ? { active: payload.active } : {}),
        ...(payload.isDisable !== undefined ? { active: !payload.isDisable } : {}),
      },
      { new: true },
    ).populate("taxId");
    if (!subTax) throw new AppError("Sub tax not found", 404);
    return this.toLegacy(subTax);
  }

  async listTaxRules(query = {}) {
    const filter = {};
    if (query.taxId || query.tax_id) filter.taxId = query.taxId || query.tax_id;
    const result = await this.list(AdminTaxRuleModel, query, filter, { createdAt: -1 }, [
      "taxId",
      "subTaxIds",
    ]);
    result.items = result.items.map((item) =>
      this.toLegacy(item, {
        tax_id: item.taxId
          ? { _id: String(item.taxId._id || item.taxId), name: item.taxId.name }
          : null,
        subTaxes_id: Array.isArray(item.subTaxIds)
          ? item.subTaxIds.map((subTax) => ({
              _id: String(subTax._id || subTax),
              name: subTax.name,
              percentage: subTax.percentage,
            }))
          : [],
        category_id: item.category
          ? { _id: item.category, name: item.category }
          : null,
      }),
    );
    return result;
  }

  async createTaxRule(payload) {
    const rule = await AdminTaxRuleModel.create({
      description: payload.description,
      taxId: payload.taxId || payload.tax_id,
      subTaxIds: payload.subTaxIds || payload.subTaxes_id || [],
      category: payload.category || payload.category_id || "",
      active: payload.active ?? payload.isDisable !== true,
      metadata: payload.metadata || {},
    });
    return this.toLegacy(await rule.populate(["taxId", "subTaxIds"]));
  }

  async updateTaxRule(id, payload) {
    const rule = await AdminTaxRuleModel.findByIdAndUpdate(
      id,
      {
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.taxId || payload.tax_id ? { taxId: payload.taxId || payload.tax_id } : {}),
        ...(payload.subTaxIds || payload.subTaxes_id
          ? { subTaxIds: payload.subTaxIds || payload.subTaxes_id }
          : {}),
        ...(payload.category !== undefined ? { category: payload.category } : {}),
        ...(payload.category_id !== undefined ? { category: payload.category_id } : {}),
        ...(payload.active !== undefined ? { active: payload.active } : {}),
        ...(payload.isDisable !== undefined ? { active: !payload.isDisable } : {}),
        ...(payload.metadata !== undefined ? { metadata: payload.metadata } : {}),
      },
      { new: true },
    ).populate(["taxId", "subTaxIds"]);
    if (!rule) throw new AppError("Tax rule not found", 404);
    return this.toLegacy(rule);
  }
}

module.exports = { CommonManagementService };
