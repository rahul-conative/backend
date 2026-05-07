const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const referralSchema = new mongoose.Schema(
  {
    referrerUserId: { type: String, required: true, index: true },
    refereeUserId: { type: String, required: true, unique: true, index: true },
    referralCode: { type: String, required: true, index: true },
    referrerRewardAmount: { type: Number, required: true },
    refereeRewardAmount: { type: Number, required: true },
    status: { type: String, default: "rewarded", index: true },
  },
  { timestamps: true },
);

const ReferralModel = mongoose.model("Referral", referralSchema);

const influencerProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    influencerType: {
      type: String,
      enum: ["parent", "child"],
      default: "child",
      index: true,
    },
    parentInfluencerId: { type: String, default: null, index: true },
    rootInfluencerId: { type: String, default: null, index: true },
    originalParentInfluencerId: { type: String, default: null, index: true },
    level: { type: Number, default: 1, min: 1 },
    path: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected"],
      default: "active",
      index: true,
    },
    canCreateChildren: { type: Boolean, default: false, index: true },
    promotedAt: { type: Date, default: null },
    onboardingStatus: { type: String, default: "approved", index: true },
    kycStatus: { type: String, default: "pending", index: true },
    payoutProfileStatus: { type: String, default: "pending", index: true },
    yearlySalesAmount: { type: Number, default: 0, min: 0 },
    createdBy: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

influencerProfileSchema.index({ parentInfluencerId: 1, status: 1 });
influencerProfileSchema.index({ rootInfluencerId: 1, level: 1 });

const referralCodeSchema = new mongoose.Schema(
  {
    influencerId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountPercent: { type: Number, default: 5, min: 0, max: 100 },
    maxDiscountAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "expired", "suspended"],
      default: "active",
      index: true,
    },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

referralCodeSchema.index({ influencerId: 1, status: 1 });

const referralOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    referralCodeId: { type: String, required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true, index: true },
    codeOwnerInfluencerId: { type: String, required: true, index: true },
    directParentInfluencerId: { type: String, default: null, index: true },
    overrideInfluencerId: { type: String, default: null, index: true },
    eligibleAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded", "reversed"],
      default: "pending",
      index: true,
    },
    orderStatus: { type: String, default: null, index: true },
    paymentStatus: { type: String, default: null, index: true },
    completedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

referralOrderSchema.index({ codeOwnerInfluencerId: 1, createdAt: -1 });

const referralCommissionLedgerSchema = new mongoose.Schema(
  {
    referralOrderId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    influencerId: { type: String, required: true, index: true },
    commissionType: {
      type: String,
      enum: [
        "code_owner_base",
        "code_owner_bonus",
        "direct_parent",
        "lifetime_override",
        "reversal",
        "manual_adjustment",
      ],
      required: true,
      index: true,
    },
    basisAmount: { type: Number, default: 0, min: 0 },
    percent: { type: Number, default: 0, min: 0, max: 100 },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "locked",
        "available",
        "payout_requested",
        "paid",
        "reversed",
      ],
      default: "pending",
      index: true,
    },
    releaseAt: { type: Date, default: null, index: true },
    paidAt: { type: Date, default: null },
    reversedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

referralCommissionLedgerSchema.index({ influencerId: 1, status: 1 });

const influencerWalletSchema = new mongoose.Schema(
  {
    influencerId: { type: String, required: true, unique: true, index: true },
    pendingBalance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    paidBalance: { type: Number, default: 0 },
    reversedBalance: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const influencerPayoutRequestSchema = new mongoose.Schema(
  {
    influencerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing", "paid", "failed"],
      default: "pending",
      index: true,
    },
    payoutMethod: {
      type: String,
      enum: ["bank", "upi", "manual"],
      default: "manual",
    },
    bankAccountId: { type: String, default: null },
    upiId: { type: String, default: null },
    adminNote: { type: String, default: null },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

influencerPayoutRequestSchema.index({ influencerId: 1, status: 1 });

const monthlyBonusTierSchema = new mongoose.Schema(
  {
    fromAmount: { type: Number, default: 0, min: 0 },
    toAmount: { type: Number, default: null, min: 0 },
    bonusPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false },
);

const referralCommissionRuleSchema = new mongoose.Schema(
  {
    customerDiscountPercent: { type: Number, default: 5, min: 0, max: 100 },
    codeOwnerBasePercent: { type: Number, default: 3, min: 0, max: 100 },
    directParentPercent: { type: Number, default: 2, min: 0, max: 100 },
    lifetimeOverridePercent: { type: Number, default: 0.5, min: 0, max: 100 },
    releaseDelayDays: { type: Number, default: 7, min: 0 },
    yearlyPromotionThreshold: { type: Number, default: 10000000, min: 0 },
    overrideMode: {
      type: String,
      enum: ["nearest_only", "stacked"],
      default: "nearest_only",
    },
    overrideScope: {
      type: String,
      enum: ["promoted_subtree", "direct_sales_only"],
      default: "promoted_subtree",
    },
    couponStackAllowed: { type: Boolean, default: false },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true, index: true },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveTo: { type: Date, default: null },
    monthlyBonusTiers: {
      type: [monthlyBonusTierSchema],
      default: [
        { fromAmount: 0, toAmount: 100000, bonusPercent: 0 },
        { fromAmount: 100000, toAmount: 500000, bonusPercent: 0.5 },
        { fromAmount: 500000, toAmount: 1000000, bonusPercent: 1 },
        { fromAmount: 1000000, toAmount: null, bonusPercent: 2 },
      ],
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const referralFraudReviewSchema = new mongoose.Schema(
  {
    influencerId: { type: String, default: null, index: true },
    referralOrderId: { type: String, default: null, index: true },
    code: { type: String, default: null, uppercase: true, trim: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "reviewing", "resolved", "dismissed"],
      default: "open",
      index: true,
    },
    reason: { type: String, required: true },
    evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const InfluencerProfileModel = mongoose.model(
  "InfluencerProfile",
  influencerProfileSchema,
);
const ReferralCodeModel = mongoose.model("ReferralCode", referralCodeSchema);
const ReferralOrderModel = mongoose.model("ReferralOrder", referralOrderSchema);
const ReferralCommissionLedgerModel = mongoose.model(
  "ReferralCommissionLedger",
  referralCommissionLedgerSchema,
);
const InfluencerWalletModel = mongoose.model(
  "InfluencerWallet",
  influencerWalletSchema,
);
const InfluencerPayoutRequestModel = mongoose.model(
  "InfluencerPayoutRequest",
  influencerPayoutRequestSchema,
);
const ReferralCommissionRuleModel = mongoose.model(
  "ReferralCommissionRule",
  referralCommissionRuleSchema,
);
const ReferralFraudReviewModel = mongoose.model(
  "ReferralFraudReview",
  referralFraudReviewSchema,
);

module.exports = {
  ReferralModel,
  InfluencerProfileModel,
  ReferralCodeModel,
  ReferralOrderModel,
  ReferralCommissionLedgerModel,
  InfluencerWalletModel,
  InfluencerPayoutRequestModel,
  ReferralCommissionRuleModel,
  ReferralFraudReviewModel,
};
