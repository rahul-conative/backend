const { env } = require("../../../config/env");
const { randomBytes } = require("crypto");
const { AppError } = require("../../../shared/errors/app-error");
const { hashText } = require("../../../shared/tools/hash");
const { makeEvent } = require("../../../contracts/events/event");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { eventPublisher } = require("../../../infrastructure/events/event-publisher");
const { ReferralRepository } = require("../repositories/referral.repository");
const { WalletService } = require("../../wallet/services/wallet.service");

class ReferralService {
  constructor({
    referralRepository = new ReferralRepository(),
    walletService = new WalletService(),
  } = {}) {
    this.referralRepository = referralRepository;
    this.walletService = walletService;
  }

  async getReferrerByCode(referralCode) {
    if (!referralCode) {
      return null;
    }

    const referrer = await this.referralRepository.findReferrerByCode(referralCode);
    if (!referrer) {
      throw new AppError("Invalid referral code", 400);
    }

    return referrer;
  }

  async rewardReferral(referralCode, refereeUser) {
    if (!referralCode) {
      return null;
    }

    const existingReferral = await this.referralRepository.findByRefereeUserId(refereeUser.id);
    if (existingReferral) {
      return existingReferral;
    }

    const referrer = await this.getReferrerByCode(referralCode);

    if (String(referrer.id) === String(refereeUser.id)) {
      throw new AppError("You cannot refer yourself", 400);
    }

    await this.walletService.credit(referrer.id, env.commerce.referralReferrerBonus, {
      referenceType: "referral",
      referenceId: refereeUser.id,
      metadata: { role: "referrer" },
    });
    await this.walletService.credit(refereeUser.id, env.commerce.referralRefereeBonus, {
      referenceType: "referral",
      referenceId: referrer.id,
      metadata: { role: "referee" },
    });

    const referral = await this.referralRepository.createReward({
      referrerUserId: referrer.id,
      refereeUserId: refereeUser.id,
      referralCode,
      referrerRewardAmount: env.commerce.referralReferrerBonus,
      refereeRewardAmount: env.commerce.referralRefereeBonus,
    });

    await eventPublisher.publish(
      makeEvent(
        DOMAIN_EVENTS.REFERRAL_REWARDED_V1,
        {
          referrerUserId: referrer.id,
          refereeUserId: refereeUser.id,
          referralCode,
        },
        { source: "referral-module", aggregateId: refereeUser.id },
      ),
    );

    return referral;
  }

  toPlainObject(value = {}) {
    if (!value) return {};
    if (typeof value.toObject === "function") {
      return value.toObject({ depopulate: true });
    }
    return { ...value };
  }

  getRecordId(value = {}) {
    return String(value._id || value.id || "");
  }

  normalizeCode(code) {
    return String(code || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");
  }

  async makeUniqueCode(seed = "REF") {
    const cleanSeed = this.normalizeCode(seed).replace(/[_-]/g, "").slice(0, 8) || "REF";
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = `${cleanSeed}${randomBytes(3).toString("hex").toUpperCase()}`;
      const existingCode = await this.referralRepository.getReferralCodeByCode(code);
      const existingUser = await this.referralRepository.findReferrerByCode(code);
      if (!existingCode && !existingUser) return code;
    }
    return `REF${Date.now().toString(36).toUpperCase()}${randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;
  }

  makeInfluencerSnapshot(profile) {
    const plain = this.toPlainObject(profile);
    const influencerId = this.getRecordId(plain);
    return {
      influencerId,
      influencerType: plain.influencerType,
      parentInfluencerId: plain.parentInfluencerId || null,
      rootInfluencerId: plain.rootInfluencerId || null,
      originalParentInfluencerId: plain.originalParentInfluencerId || null,
      level: plain.level,
      path: plain.path || [],
      status: plain.status,
      canCreateChildren: Boolean(plain.canCreateChildren),
      promotedAt: plain.promotedAt || null,
      onboardingStatus: plain.onboardingStatus || "approved",
      kycStatus: plain.kycStatus || "pending",
      payoutProfileStatus: plain.payoutProfileStatus || "pending",
    };
  }

  async syncUserInfluencerProfile(profile) {
    const snapshot = this.makeInfluencerSnapshot(profile);
    await this.referralRepository.updateUserInfluencerSnapshot(
      profile.userId,
      snapshot,
    );
    return snapshot;
  }

  async enrichInfluencer(profile) {
    const plainProfile = this.toPlainObject(profile);
    const influencerId = this.getRecordId(plainProfile);
    const [user, primaryCode, wallet] = await Promise.all([
      this.referralRepository.getUserById(plainProfile.userId),
      this.referralRepository.getPrimaryReferralCode(influencerId),
      this.referralRepository.ensureWallet(influencerId),
    ]);

    return {
      ...plainProfile,
      id: influencerId,
      user: this.toPlainObject(user),
      primaryCode: primaryCode ? this.toPlainObject(primaryCode) : null,
      wallet: wallet ? this.toPlainObject(wallet) : null,
    };
  }

  async getInfluencerOrThrow(influencerId) {
    const influencer = await this.referralRepository.getInfluencerProfileById(
      influencerId,
    );
    if (!influencer) {
      throw new AppError("Influencer not found", 404);
    }
    return influencer;
  }

  async ensureInfluencerUser(payload = {}) {
    if (payload.userId) {
      const existingUser = await this.referralRepository.getUserById(payload.userId);
      if (!existingUser) {
        throw new AppError("User not found", 404);
      }
      const existingProfile =
        await this.referralRepository.getInfluencerProfileByUserId(payload.userId);
      if (existingProfile) {
        throw new AppError("User is already an influencer", 409);
      }
      if (["admin", "sub-admin", "super-admin", "seller", "seller-sub-admin"].includes(existingUser.role)) {
        throw new AppError("Influencers must be normal customer users", 400);
      }
      return { user: existingUser, temporaryPassword: null };
    }

    const email = String(payload.email || "").trim().toLowerCase();
    if (!email) {
      throw new AppError("Email is required for a new influencer user", 400);
    }

    const temporaryPassword =
      payload.password || `Influencer@${randomBytes(4).toString("hex")}1`;
    const user = await this.referralRepository.createUser({
      email,
      phone: payload.phone || null,
      passwordHash: await hashText(temporaryPassword),
      role: "buyer",
      profile: {
        firstName: payload.firstName || payload.profile?.firstName || "Influencer",
        lastName: payload.lastName || payload.profile?.lastName || "",
      },
      accountStatus: payload.accountStatus || "active",
      referralCode: await this.makeUniqueCode(payload.firstName || email),
    });

    return {
      user,
      temporaryPassword: payload.password ? null : temporaryPassword,
    };
  }

  async ensureDefaultCode(profile, actor, payload = {}) {
    const influencerId = this.getRecordId(profile);
    const existing = await this.referralRepository.getPrimaryReferralCode(influencerId);
    if (existing) return existing;

    const user = await this.referralRepository.getUserById(profile.userId);
    const code = payload.code
      ? this.normalizeCode(payload.code)
      : await this.makeUniqueCode(
          `${user?.profile?.firstName || user?.email || "REF"}${profile.level || 1}`,
        );
    const existingUserCodeOwner =
      await this.referralRepository.findReferrerByCode(code);
    if (
      existingUserCodeOwner &&
      this.getRecordId(existingUserCodeOwner) !== String(profile.userId)
    ) {
      throw new AppError("Referral code already exists", 409);
    }

    const referralCode = await this.referralRepository.createReferralCode({
      influencerId,
      userId: profile.userId,
      code,
      discountPercent: Number(payload.discountPercent ?? 5),
      maxDiscountAmount: Number(payload.maxDiscountAmount || 0),
      status: payload.codeStatus || "active",
      startsAt: payload.startsAt || null,
      expiresAt: payload.expiresAt || null,
      usageLimit: payload.usageLimit || null,
      createdBy: actor?.userId || null,
    });
    await this.referralRepository.updateUserReferralCode(profile.userId, code);
    return referralCode;
  }

  async listInfluencers(query = {}) {
    const result = await this.referralRepository.listInfluencerProfiles({
      ...query,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
      canCreateChildren:
        query.canCreateChildren === undefined
          ? null
          : String(query.canCreateChildren).toLowerCase() === "true",
    });

    return {
      items: await Promise.all(result.items.map((item) => this.enrichInfluencer(item))),
      total: result.total,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    };
  }

  async createParentInfluencer(payload = {}, actor = {}) {
    const { user, temporaryPassword } = await this.ensureInfluencerUser(payload);
    const created = await this.referralRepository.createInfluencerProfile({
      userId: this.getRecordId(user),
      influencerType: "parent",
      level: 1,
      path: [],
      status: payload.status || "active",
      canCreateChildren: payload.canCreateChildren ?? true,
      onboardingStatus: payload.onboardingStatus || "approved",
      kycStatus: payload.kycStatus || "pending",
      payoutProfileStatus: payload.payoutProfileStatus || "pending",
      yearlySalesAmount: Number(payload.yearlySalesAmount || 0),
      createdBy: actor?.userId || null,
      metadata: payload.metadata || {},
    });
    const influencerId = this.getRecordId(created);
    const profile = await this.referralRepository.updateInfluencerProfile(
      influencerId,
      {
        rootInfluencerId: influencerId,
        path: [influencerId],
      },
    );

    await this.referralRepository.ensureWallet(influencerId);
    await this.ensureDefaultCode(profile, actor, payload);
    await this.syncUserInfluencerProfile(profile);

    return {
      ...(await this.enrichInfluencer(profile)),
      temporaryPassword,
    };
  }

  async createChildInfluencer(parentId, payload = {}, actor = {}) {
    const parent = await this.getInfluencerOrThrow(parentId);
    if (parent.status !== "active") {
      throw new AppError("Parent influencer must be active", 400);
    }
    if (!parent.canCreateChildren) {
      throw new AppError("Parent influencer cannot create children", 400);
    }

    const { user, temporaryPassword } = await this.ensureInfluencerUser(payload);
    const parentIdString = this.getRecordId(parent);
    const rootInfluencerId = parent.rootInfluencerId || parentIdString;
    const parentPath = Array.isArray(parent.path) && parent.path.length
      ? parent.path.map(String)
      : [parentIdString];

    const created = await this.referralRepository.createInfluencerProfile({
      userId: this.getRecordId(user),
      influencerType: "child",
      parentInfluencerId: parentIdString,
      rootInfluencerId,
      originalParentInfluencerId: parent.originalParentInfluencerId || null,
      level: Number(parent.level || 1) + 1,
      path: parentPath,
      status: payload.status || "active",
      canCreateChildren: payload.canCreateChildren ?? false,
      onboardingStatus: payload.onboardingStatus || "approved",
      kycStatus: payload.kycStatus || "pending",
      payoutProfileStatus: payload.payoutProfileStatus || "pending",
      yearlySalesAmount: Number(payload.yearlySalesAmount || 0),
      createdBy: actor?.userId || null,
      metadata: payload.metadata || {},
    });
    const childId = this.getRecordId(created);
    const profile = await this.referralRepository.updateInfluencerProfile(childId, {
      path: [...parentPath, childId],
    });

    await this.referralRepository.ensureWallet(childId);
    await this.ensureDefaultCode(profile, actor, payload);
    await this.syncUserInfluencerProfile(profile);

    return {
      ...(await this.enrichInfluencer(profile)),
      temporaryPassword,
    };
  }

  async updateInfluencerStatus(influencerId, payload = {}) {
    const influencer = await this.getInfluencerOrThrow(influencerId);
    const profile = await this.referralRepository.updateInfluencerProfile(
      this.getRecordId(influencer),
      {
        status: payload.status,
        ...(payload.reason ? { "metadata.statusReason": payload.reason } : {}),
      },
    );

    if (["suspended", "rejected"].includes(payload.status)) {
      await this.referralRepository.updateReferralCodesByInfluencer(
        this.getRecordId(profile),
        { status: "suspended" },
      );
    }

    await this.syncUserInfluencerProfile(profile);
    return this.enrichInfluencer(profile);
  }

  async promoteInfluencer(influencerId, payload = {}) {
    const influencer = await this.getInfluencerOrThrow(influencerId);
    const parentId = influencer.parentInfluencerId || null;
    const profile = await this.referralRepository.updateInfluencerProfile(
      this.getRecordId(influencer),
      {
        influencerType: "parent",
        canCreateChildren: payload.canCreateChildren ?? true,
        originalParentInfluencerId:
          influencer.originalParentInfluencerId || parentId,
        promotedAt: payload.promotedAt || new Date(),
        status: "active",
        ...(payload.note ? { "metadata.promotionNote": payload.note } : {}),
      },
    );

    await this.syncUserInfluencerProfile(profile);
    await this.ensureDefaultCode(profile, {}, payload);
    return this.enrichInfluencer(profile);
  }

  async listReferralCodes(query = {}) {
    const result = await this.referralRepository.listReferralCodes({
      ...query,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    });
    return {
      items: result.items.map((item) => this.toPlainObject(item)),
      total: result.total,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    };
  }

  async createReferralCode(payload = {}, actor = {}) {
    const influencer = await this.getInfluencerOrThrow(payload.influencerId);
    if (influencer.status !== "active") {
      throw new AppError("Influencer must be active before creating a code", 400);
    }

    const code = payload.code
      ? this.normalizeCode(payload.code)
      : await this.makeUniqueCode(payload.influencerId);
    if (!code) throw new AppError("Referral code is required", 400);

    const existing = await this.referralRepository.getReferralCodeByCode(code);
    if (existing) {
      throw new AppError("Referral code already exists", 409);
    }
    const existingUserCodeOwner =
      await this.referralRepository.findReferrerByCode(code);
    if (
      existingUserCodeOwner &&
      this.getRecordId(existingUserCodeOwner) !== String(influencer.userId)
    ) {
      throw new AppError("Referral code already exists", 409);
    }

    const primaryCodeBeforeCreate =
      await this.referralRepository.getPrimaryReferralCode(
        this.getRecordId(influencer),
      );
    const referralCode = await this.referralRepository.createReferralCode({
      influencerId: this.getRecordId(influencer),
      userId: influencer.userId,
      code,
      discountPercent: Number(payload.discountPercent ?? 5),
      maxDiscountAmount: Number(payload.maxDiscountAmount || 0),
      status: payload.status || "active",
      startsAt: payload.startsAt || null,
      expiresAt: payload.expiresAt || null,
      usageLimit: payload.usageLimit || null,
      createdBy: actor?.userId || null,
      metadata: payload.metadata || {},
    });
    if (!primaryCodeBeforeCreate) {
      await this.referralRepository.updateUserReferralCode(influencer.userId, code);
    }
    return referralCode;
  }

  async updateReferralCode(codeId, payload = {}) {
    const existing = await this.referralRepository.getReferralCodeById(codeId);
    if (!existing) {
      throw new AppError("Referral code not found", 404);
    }

    const update = { ...payload };
    delete update.codeId;
    if (update.code) {
      update.code = this.normalizeCode(update.code);
      const duplicate = await this.referralRepository.getReferralCodeByCode(
        update.code,
      );
      if (duplicate && this.getRecordId(duplicate) !== this.getRecordId(existing)) {
        throw new AppError("Referral code already exists", 409);
      }
      const duplicateUser = await this.referralRepository.findReferrerByCode(
        update.code,
      );
      if (
        duplicateUser &&
        this.getRecordId(duplicateUser) !== String(existing.userId)
      ) {
        throw new AppError("Referral code already exists", 409);
      }
    }

    const updated = await this.referralRepository.updateReferralCode(codeId, update);
    if (update.code) {
      const currentUserCodeOwner =
        await this.referralRepository.findReferrerByCode(existing.code);
      if (
        currentUserCodeOwner &&
        this.getRecordId(currentUserCodeOwner) === String(existing.userId)
      ) {
        await this.referralRepository.updateUserReferralCode(
          existing.userId,
          update.code,
        );
      }
    }
    return updated;
  }

  async listReferralOrders(query = {}) {
    const result = await this.referralRepository.listReferralOrders({
      ...query,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    });
    return {
      items: result.items.map((item) => this.toPlainObject(item)),
      total: result.total,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    };
  }

  async listReferralCommissions(query = {}) {
    const result = await this.referralRepository.listCommissionLedger({
      ...query,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    });
    return {
      items: result.items.map((item) => this.toPlainObject(item)),
      total: result.total,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    };
  }

  async listPayouts(query = {}) {
    const result = await this.referralRepository.listPayoutRequests({
      ...query,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    });
    return {
      items: result.items.map((item) => this.toPlainObject(item)),
      total: result.total,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    };
  }

  async approvePayout(payoutId, payload = {}) {
    const payout = await this.referralRepository.getPayoutRequestById(payoutId);
    if (!payout) throw new AppError("Payout request not found", 404);
    if (payout.status !== "pending") {
      throw new AppError("Only pending payouts can be approved", 400);
    }

    const wallet = await this.referralRepository.getWallet(payout.influencerId);
    if (Number(wallet?.availableBalance || 0) < Number(payout.amount || 0)) {
      throw new AppError("Insufficient available influencer wallet balance", 400);
    }

    return this.referralRepository.updatePayoutRequest(payoutId, {
      status: "approved",
      approvedAt: new Date(),
      adminNote: payload.adminNote || payout.adminNote || null,
    });
  }

  async rejectPayout(payoutId, payload = {}) {
    const payout = await this.referralRepository.getPayoutRequestById(payoutId);
    if (!payout) throw new AppError("Payout request not found", 404);
    if (payout.status === "paid") {
      throw new AppError("Paid payouts cannot be rejected", 400);
    }

    return this.referralRepository.updatePayoutRequest(payoutId, {
      status: "rejected",
      adminNote: payload.adminNote || payload.reason || null,
    });
  }

  async markPayoutPaid(payoutId, payload = {}) {
    const payout = await this.referralRepository.getPayoutRequestById(payoutId);
    if (!payout) throw new AppError("Payout request not found", 404);
    if (!["approved", "processing"].includes(payout.status)) {
      throw new AppError("Only approved or processing payouts can be marked paid", 400);
    }

    const wallet = await this.referralRepository.getWallet(payout.influencerId);
    if (Number(wallet?.availableBalance || 0) < Number(payout.amount || 0)) {
      throw new AppError("Insufficient available influencer wallet balance", 400);
    }

    await this.referralRepository.updateWallet(payout.influencerId, {
      $inc: {
        availableBalance: -Number(payout.amount),
        paidBalance: Number(payout.amount),
      },
    });

    return this.referralRepository.updatePayoutRequest(payoutId, {
      status: "paid",
      paidAt: payload.paidAt || new Date(),
      adminNote: payload.adminNote || payout.adminNote || null,
    });
  }

  async getCommissionRules(query = {}) {
    let current = await this.referralRepository.getActiveCommissionRule();
    if (!current) {
      current = await this.referralRepository.createCommissionRule({
        active: true,
        effectiveFrom: new Date(),
      });
    }
    const history = await this.referralRepository.listCommissionRules({
      active:
        query.active === undefined
          ? null
          : String(query.active).toLowerCase() === "true",
      page: Number(query.page || 1),
      limit: Number(query.limit || 20),
    });

    return {
      current: this.toPlainObject(current),
      history: history.items.map((item) => this.toPlainObject(item)),
      total: history.total,
    };
  }

  async upsertCommissionRules(payload = {}) {
    const current = await this.referralRepository.getActiveCommissionRule();
    const currentPlain = current ? this.toPlainObject(current) : {};
    const ignoredKeys = ["_id", "id", "createdAt", "updatedAt", "__v"];
    const base = Object.entries(currentPlain).reduce((acc, [key, value]) => {
      if (!ignoredKeys.includes(key)) acc[key] = value;
      return acc;
    }, {});

    return this.referralRepository.createCommissionRule({
      ...base,
      ...payload,
      active: payload.active ?? true,
      effectiveFrom: payload.effectiveFrom || new Date(),
      effectiveTo: payload.effectiveTo || null,
    });
  }

  async getSummaryReport() {
    const [
      totalInfluencers,
      activeInfluencers,
      parentInfluencers,
      totalCodes,
      activeCodes,
      orderTotals,
      ledgerTotals,
      walletTotals,
      pendingPayouts,
    ] = await Promise.all([
      this.referralRepository.countInfluencers(),
      this.referralRepository.countInfluencers({ status: "active" }),
      this.referralRepository.countInfluencers({ influencerType: "parent" }),
      this.referralRepository.countCodes(),
      this.referralRepository.countCodes({ status: "active" }),
      this.referralRepository.aggregateOrderTotals(),
      this.referralRepository.aggregateLedgerTotals(),
      this.referralRepository.aggregateWalletTotals(),
      this.referralRepository.listPayoutRequests({ status: "pending", limit: 1 }),
    ]);

    return {
      influencers: {
        total: totalInfluencers,
        active: activeInfluencers,
        parents: parentInfluencers,
        children: Math.max(totalInfluencers - parentInfluencers, 0),
      },
      codes: {
        total: totalCodes,
        active: activeCodes,
      },
      orders: {
        total: Number(orderTotals.orderCount || 0),
        eligibleAmount: Number(orderTotals.eligibleAmount || 0),
        discountAmount: Number(orderTotals.discountAmount || 0),
      },
      commissions: {
        totalEntries: Number(ledgerTotals.ledgerCount || 0),
        amount: Number(ledgerTotals.commissionAmount || 0),
      },
      wallets: {
        pendingBalance: Number(walletTotals.pendingBalance || 0),
        availableBalance: Number(walletTotals.availableBalance || 0),
        paidBalance: Number(walletTotals.paidBalance || 0),
        reversedBalance: Number(walletTotals.reversedBalance || 0),
      },
      payouts: {
        pending: pendingPayouts.total || 0,
      },
    };
  }

  async getHierarchyReport() {
    const profiles = await this.referralRepository.listAllInfluencerProfiles();
    const enriched = await Promise.all(
      profiles.map((profile) => this.enrichInfluencer(profile)),
    );
    const byId = new Map(
      enriched.map((profile) => [
        profile.id,
        {
          ...profile,
          children: [],
        },
      ]),
    );

    const roots = [];
    byId.forEach((node) => {
      const parentId = node.parentInfluencerId;
      if (parentId && byId.has(parentId)) {
        byId.get(parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return {
      roots,
      total: enriched.length,
      maxLevel: enriched.reduce(
        (max, item) => Math.max(max, Number(item.level || 1)),
        1,
      ),
    };
  }

  async listFraudReviews(query = {}) {
    const result = await this.referralRepository.listFraudReviews({
      ...query,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    });
    return {
      items: result.items.map((item) => this.toPlainObject(item)),
      total: result.total,
      page: Number(query.page || 1),
      limit: Number(query.limit || 50),
    };
  }
}

module.exports = { ReferralService };
