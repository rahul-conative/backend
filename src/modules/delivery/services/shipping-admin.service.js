const { AppError } = require("../../../shared/errors/app-error");
const { ShippingPackageModel, PickupAddressModel } = require("../models/shipping-admin.model");
const {
  AdminStateModel,
  AdminCityModel,
  AdminZipCodeModel,
} = require("../../admin/models/common-management.model");

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

class ShippingAdminService {
  toResponse(record = {}) {
    const item = typeof record.toObject === "function" ? record.toObject() : record;
    return {
      ...item,
      _id: String(item._id),
      id: String(item._id),
      isDisable: item.active === false,
    };
  }

  async listPackages(query = {}) {
    const page = toPage(query);
    const filter = {};
    const q = query.q || query.search || query.keyWord || "";
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    if (q) {
      filter.$or = [{ name: regex(q) }, { code: regex(q) }, { unit: regex(q) }];
    }
    const [items, total] = await Promise.all([
      ShippingPackageModel.find(filter).sort({ createdAt: -1 }).skip(page.skip).limit(page.limit),
      ShippingPackageModel.countDocuments(filter),
    ]);
    return { items: items.map((item) => this.toResponse(item)), total, page: page.page, limit: page.limit };
  }

  async createPackage(payload) {
    const doc = await ShippingPackageModel.create({
      name: payload.name,
      code: payload.code ? String(payload.code).toUpperCase() : "",
      length: Number(payload.length || 0),
      width: Number(payload.width || 0),
      height: Number(payload.height || 0),
      unit: payload.unit || "cm",
      maxWeight: Number(payload.maxWeight || 0),
      active: payload.active ?? payload.isDisable !== true,
    });
    return this.toResponse(doc);
  }

  async updatePackage(id, payload) {
    const updates = {};
    ["name", "length", "width", "height", "unit", "maxWeight", "active"].forEach((field) => {
      if (payload[field] !== undefined) updates[field] = payload[field];
    });
    if (payload.code !== undefined) updates.code = String(payload.code || "").toUpperCase();
    if (payload.isDisable !== undefined) updates.active = !payload.isDisable;
    const doc = await ShippingPackageModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!doc) throw new AppError("Shipping package not found", 404);
    return this.toResponse(doc);
  }

  async setPackageStatus(ids = [], isDisable = false) {
    return this.setStatus(ShippingPackageModel, ids, isDisable);
  }

  async deletePackages(ids = []) {
    return this.deleteMany(ShippingPackageModel, ids);
  }

  async assertLocation({ countryId, stateId, cityId, zipCodeId }) {
    const state = await AdminStateModel.findOne({ _id: stateId, countryId }).select("_id").lean();
    if (!state) throw new AppError("State does not belong to selected country", 400);

    const city = await AdminCityModel.findOne({ _id: cityId, stateId }).select("_id").lean();
    if (!city) throw new AppError("City does not belong to selected state", 400);

    if (zipCodeId) {
      const zip = await AdminZipCodeModel.findOne({ _id: zipCodeId, countryId, stateId, cityId })
        .select("_id zipCode")
        .lean();
      if (!zip) throw new AppError("Zip code does not belong to selected city", 400);
      return { pincode: zip.zipCode };
    }

    return {};
  }

  async listPickupAddresses(query = {}) {
    const page = toPage(query);
    const filter = {};
    const q = query.q || query.search || query.keyWord || "";
    if (query.active !== undefined) filter.active = query.active === true || query.active === "true";
    if (query.countryId) filter.countryId = query.countryId;
    if (query.stateId) filter.stateId = query.stateId;
    if (query.cityId) filter.cityId = query.cityId;
    if (q) {
      filter.$or = [
        { label: regex(q) },
        { contactName: regex(q) },
        { phone: regex(q) },
        { pincode: regex(q) },
      ];
    }
    const populate = [
      { path: "countryId", select: "name code" },
      { path: "stateId", select: "name countryId" },
      { path: "cityId", select: "name stateId" },
      { path: "zipCodeId", select: "zipCode areaName" },
    ];
    const [items, total] = await Promise.all([
      PickupAddressModel.find(filter).sort({ createdAt: -1 }).skip(page.skip).limit(page.limit).populate(populate),
      PickupAddressModel.countDocuments(filter),
    ]);
    return { items: items.map((item) => this.toResponse(item)), total, page: page.page, limit: page.limit };
  }

  async createPickupAddress(payload) {
    const derived = await this.assertLocation(payload);
    const doc = await PickupAddressModel.create({
      label: payload.label,
      contactName: payload.contactName,
      phone: payload.phone,
      email: payload.email || "",
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2 || "",
      countryId: payload.countryId,
      stateId: payload.stateId,
      cityId: payload.cityId,
      zipCodeId: payload.zipCodeId || null,
      pincode: payload.pincode || derived.pincode,
      pickupInstructions: payload.pickupInstructions || "",
      schedule: payload.schedule || [],
      active: payload.active ?? payload.isDisable !== true,
    });
    return this.getPickupAddress(doc._id);
  }

  async getPickupAddress(id) {
    const doc = await PickupAddressModel.findById(id).populate([
      { path: "countryId", select: "name code" },
      { path: "stateId", select: "name countryId" },
      { path: "cityId", select: "name stateId" },
      { path: "zipCodeId", select: "zipCode areaName" },
    ]);
    if (!doc) throw new AppError("Pickup address not found", 404);
    return this.toResponse(doc);
  }

  async updatePickupAddress(id, payload) {
    const existing = await PickupAddressModel.findById(id);
    if (!existing) throw new AppError("Pickup address not found", 404);
    const nextLocation = {
      countryId: payload.countryId || existing.countryId,
      stateId: payload.stateId || existing.stateId,
      cityId: payload.cityId || existing.cityId,
      zipCodeId: payload.zipCodeId !== undefined ? payload.zipCodeId : existing.zipCodeId,
    };
    const derived = await this.assertLocation(nextLocation);
    const updates = {};
    [
      "label",
      "contactName",
      "phone",
      "email",
      "addressLine1",
      "addressLine2",
      "countryId",
      "stateId",
      "cityId",
      "zipCodeId",
      "pincode",
      "pickupInstructions",
      "schedule",
      "active",
    ].forEach((field) => {
      if (payload[field] !== undefined) updates[field] = payload[field];
    });
    if (payload.isDisable !== undefined) updates.active = !payload.isDisable;
    if (!updates.pincode && payload.zipCodeId) updates.pincode = derived.pincode;
    await PickupAddressModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return this.getPickupAddress(id);
  }

  async setPickupAddressStatus(ids = [], isDisable = false) {
    return this.setStatus(PickupAddressModel, ids, isDisable);
  }

  async deletePickupAddresses(ids = []) {
    return this.deleteMany(PickupAddressModel, ids);
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
}

module.exports = { ShippingAdminService };
