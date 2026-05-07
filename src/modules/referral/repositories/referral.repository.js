const {
  ReferralModel,
  InfluencerProfileModel,
  ReferralCodeModel,
  ReferralOrderModel,
  ReferralCommissionLedgerModel,
  InfluencerWalletModel,
  InfluencerPayoutRequestModel,
  ReferralCommissionRuleModel,
  ReferralFraudReviewModel,
} = require("../models/referral.model");
const { UserModel } = require("../../user/models/user.model");
const { UserRepository } = require("../../user/repositories/user.repository");

class ReferralRepository {
  constructor({ userRepository = new UserRepository() } = {}) {
    this.userRepository = userRepository;
  }

  async findReferrerByCode(referralCode) {
    return this.userRepository.findByReferralCode(referralCode);
  }

  async createReward(payload) {
    return ReferralModel.create(payload);
  }

  async findByRefereeUserId(refereeUserId) {
    return ReferralModel.findOne({ refereeUserId });
  }

  async createUser(payload) {
    return UserModel.create(payload);
  }

  async getUserById(userId) {
    return UserModel.findById(userId).select("-passwordHash -refreshSessions.tokenHash");
  }

  async listUsersByIds(userIds = []) {
    const ids = Array.from(new Set(userIds.map(String).filter(Boolean)));
    if (!ids.length) return [];
    return UserModel.find({ _id: { $in: ids } }).select(
      "email phone role profile accountStatus referralCode influencerProfile createdAt updatedAt",
    );
  }

  async updateUserInfluencerSnapshot(userId, snapshot) {
    return UserModel.findByIdAndUpdate(
      userId,
      { $set: { influencerProfile: snapshot } },
      { new: true },
    ).select("-passwordHash -refreshSessions.tokenHash");
  }

  async updateUserReferralCode(userId, referralCode) {
    return UserModel.findByIdAndUpdate(
      userId,
      { $set: { referralCode } },
      { new: true },
    ).select("-passwordHash -refreshSessions.tokenHash");
  }

  async createInfluencerProfile(payload) {
    return InfluencerProfileModel.create(payload);
  }

  async updateInfluencerProfile(influencerId, payload) {
    return InfluencerProfileModel.findByIdAndUpdate(
      influencerId,
      { $set: payload },
      { new: true },
    );
  }

  async getInfluencerProfileById(influencerId) {
    return InfluencerProfileModel.findById(influencerId);
  }

  async getInfluencerProfileByUserId(userId) {
    return InfluencerProfileModel.findOne({ userId: String(userId) });
  }

  async listInfluencerProfiles({
    q = "",
    status = null,
    influencerType = null,
    parentInfluencerId = null,
    canCreateChildren = null,
    page = 1,
    limit = 50,
  } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (influencerType) filter.influencerType = influencerType;
    if (parentInfluencerId) filter.parentInfluencerId = parentInfluencerId;
    if (canCreateChildren !== null && canCreateChildren !== undefined) {
      filter.canCreateChildren = canCreateChildren;
    }

    if (q) {
      const users = await UserModel.find({
        $or: [
          { email: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
          { "profile.firstName": { $regex: q, $options: "i" } },
          { "profile.lastName": { $regex: q, $options: "i" } },
          { referralCode: { $regex: q, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map((user) => String(user._id));
      filter.$or = [
        { userId: { $in: userIds } },
        { _id: q.match(/^[a-f\d]{24}$/i) ? q : undefined },
      ].filter((entry) => entry._id !== undefined);
      if (!filter.$or.length) {
        filter.userId = { $in: userIds };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      InfluencerProfileModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InfluencerProfileModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async listAllInfluencerProfiles() {
    return InfluencerProfileModel.find({}).sort({ level: 1, createdAt: 1 });
  }

  async createReferralCode(payload) {
    return ReferralCodeModel.create(payload);
  }

  async getReferralCodeById(codeId) {
    return ReferralCodeModel.findById(codeId);
  }

  async getReferralCodeByCode(code) {
    return ReferralCodeModel.findOne({ code: String(code || "").toUpperCase() });
  }

  async getPrimaryReferralCode(influencerId) {
    return ReferralCodeModel.findOne({ influencerId: String(influencerId) }).sort({
      createdAt: 1,
    });
  }

  async listReferralCodes({
    q = "",
    influencerId = null,
    status = null,
    page = 1,
    limit = 50,
  } = {}) {
    const filter = {};
    if (influencerId) filter.influencerId = influencerId;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { code: { $regex: q, $options: "i" } },
        { influencerId: { $regex: q, $options: "i" } },
        { userId: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ReferralCodeModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ReferralCodeModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async updateReferralCode(codeId, payload) {
    return ReferralCodeModel.findByIdAndUpdate(
      codeId,
      { $set: payload },
      { new: true },
    );
  }

  async updateReferralCodesByInfluencer(influencerId, payload) {
    return ReferralCodeModel.updateMany(
      { influencerId: String(influencerId) },
      { $set: payload },
    );
  }

  async ensureWallet(influencerId) {
    return InfluencerWalletModel.findOneAndUpdate(
      { influencerId: String(influencerId) },
      { $setOnInsert: { influencerId: String(influencerId) } },
      { upsert: true, new: true },
    );
  }

  async getWallet(influencerId) {
    return InfluencerWalletModel.findOne({ influencerId: String(influencerId) });
  }

  async updateWallet(influencerId, update) {
    return InfluencerWalletModel.findOneAndUpdate(
      { influencerId: String(influencerId) },
      update,
      { upsert: true, new: true },
    );
  }

  async listReferralOrders({
    q = "",
    status = null,
    code = null,
    influencerId = null,
    customerId = null,
    fromDate = null,
    toDate = null,
    page = 1,
    limit = 50,
  } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (code) filter.code = String(code).toUpperCase();
    if (influencerId) filter.codeOwnerInfluencerId = influencerId;
    if (customerId) filter.customerId = customerId;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }
    if (q) {
      filter.$or = [
        { orderId: { $regex: q, $options: "i" } },
        { customerId: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ReferralOrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ReferralOrderModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async listCommissionLedger({
    q = "",
    status = null,
    commissionType = null,
    influencerId = null,
    orderId = null,
    fromDate = null,
    toDate = null,
    page = 1,
    limit = 50,
  } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (commissionType) filter.commissionType = commissionType;
    if (influencerId) filter.influencerId = influencerId;
    if (orderId) filter.orderId = orderId;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }
    if (q) {
      filter.$or = [
        { orderId: { $regex: q, $options: "i" } },
        { influencerId: { $regex: q, $options: "i" } },
        { commissionType: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ReferralCommissionLedgerModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReferralCommissionLedgerModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async listPayoutRequests({
    q = "",
    status = null,
    influencerId = null,
    page = 1,
    limit = 50,
  } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (influencerId) filter.influencerId = influencerId;
    if (q) {
      filter.$or = [
        { influencerId: { $regex: q, $options: "i" } },
        { payoutMethod: { $regex: q, $options: "i" } },
        { upiId: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      InfluencerPayoutRequestModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InfluencerPayoutRequestModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async getPayoutRequestById(payoutId) {
    return InfluencerPayoutRequestModel.findById(payoutId);
  }

  async updatePayoutRequest(payoutId, payload) {
    return InfluencerPayoutRequestModel.findByIdAndUpdate(
      payoutId,
      { $set: payload },
      { new: true },
    );
  }

  async getActiveCommissionRule() {
    return ReferralCommissionRuleModel.findOne({ active: true }).sort({
      effectiveFrom: -1,
      createdAt: -1,
    });
  }

  async listCommissionRules({ active = null, limit = 20, page = 1 } = {}) {
    const filter = {};
    if (active !== null && active !== undefined) filter.active = active;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ReferralCommissionRuleModel.find(filter)
        .sort({ effectiveFrom: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReferralCommissionRuleModel.countDocuments(filter),
    ]);
    return { items, total };
  }

  async createCommissionRule(payload) {
    if (payload.active !== false) {
      await ReferralCommissionRuleModel.updateMany(
        { active: true },
        { $set: { active: false, effectiveTo: new Date() } },
      );
    }
    return ReferralCommissionRuleModel.create(payload);
  }

  async countInfluencers(filter = {}) {
    return InfluencerProfileModel.countDocuments(filter);
  }

  async countCodes(filter = {}) {
    return ReferralCodeModel.countDocuments(filter);
  }

  async aggregateOrderTotals(filter = {}) {
    const [result] = await ReferralOrderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          eligibleAmount: { $sum: "$eligibleAmount" },
          discountAmount: { $sum: "$discountAmount" },
        },
      },
    ]);
    return result || { orderCount: 0, eligibleAmount: 0, discountAmount: 0 };
  }

  async aggregateLedgerTotals(filter = {}) {
    const [result] = await ReferralCommissionLedgerModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          ledgerCount: { $sum: 1 },
          commissionAmount: { $sum: "$amount" },
        },
      },
    ]);
    return result || { ledgerCount: 0, commissionAmount: 0 };
  }

  async aggregateWalletTotals() {
    const [result] = await InfluencerWalletModel.aggregate([
      {
        $group: {
          _id: null,
          pendingBalance: { $sum: "$pendingBalance" },
          availableBalance: { $sum: "$availableBalance" },
          paidBalance: { $sum: "$paidBalance" },
          reversedBalance: { $sum: "$reversedBalance" },
        },
      },
    ]);
    return (
      result || {
        pendingBalance: 0,
        availableBalance: 0,
        paidBalance: 0,
        reversedBalance: 0,
      }
    );
  }

  async listFraudReviews({
    status = null,
    severity = null,
    influencerId = null,
    page = 1,
    limit = 50,
  } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (influencerId) filter.influencerId = influencerId;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ReferralFraudReviewModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReferralFraudReviewModel.countDocuments(filter),
    ]);

    return { items, total };
  }
}

module.exports = { ReferralRepository };
