const Joi = require("joi");

const pagingQuery = {
  q: Joi.string().allow(""),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(500),
};

const influencerStatuses = ["pending", "active", "suspended", "rejected"];
const influencerTypes = ["parent", "child"];
const codeStatuses = ["active", "inactive", "expired", "suspended"];
const referralOrderStatuses = [
  "pending",
  "completed",
  "cancelled",
  "refunded",
  "reversed",
];
const ledgerStatuses = [
  "pending",
  "locked",
  "available",
  "payout_requested",
  "paid",
  "reversed",
];
const commissionTypes = [
  "code_owner_base",
  "code_owner_bonus",
  "direct_parent",
  "lifetime_override",
  "reversal",
  "manual_adjustment",
];
const payoutStatuses = [
  "pending",
  "approved",
  "rejected",
  "processing",
  "paid",
  "failed",
];

const newInfluencerBody = {
  userId: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string().allow("", null),
  password: Joi.string().min(8),
  firstName: Joi.string().allow("", null),
  lastName: Joi.string().allow("", null),
  profile: Joi.object({
    firstName: Joi.string().allow("", null),
    lastName: Joi.string().allow("", null),
  }),
  status: Joi.string().valid(...influencerStatuses),
  canCreateChildren: Joi.boolean(),
  onboardingStatus: Joi.string().allow("", null),
  kycStatus: Joi.string().allow("", null),
  payoutProfileStatus: Joi.string().allow("", null),
  yearlySalesAmount: Joi.number().min(0),
  code: Joi.string().trim().uppercase(),
  discountPercent: Joi.number().min(0).max(100),
  maxDiscountAmount: Joi.number().min(0),
  startsAt: Joi.date().iso().allow(null),
  expiresAt: Joi.date().iso().allow(null),
  usageLimit: Joi.number().integer().min(1).allow(null),
  metadata: Joi.object().default({}),
};

const createParentInfluencerSchema = Joi.object({
  body: Joi.object(newInfluencerBody)
    .or("userId", "email")
    .required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const createChildInfluencerSchema = Joi.object({
  body: Joi.object(newInfluencerBody)
    .or("userId", "email")
    .required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    parentId: Joi.string().required(),
  }).required(),
});

const listInfluencersSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    ...pagingQuery,
    status: Joi.string().valid(...influencerStatuses),
    influencerType: Joi.string().valid(...influencerTypes),
    parentInfluencerId: Joi.string(),
    canCreateChildren: Joi.boolean(),
  }).required(),
  params: Joi.object({}).required(),
});

const updateInfluencerStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid(...influencerStatuses).required(),
    reason: Joi.string().allow("", null),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    influencerId: Joi.string().required(),
  }).required(),
});

const promoteInfluencerSchema = Joi.object({
  body: Joi.object({
    canCreateChildren: Joi.boolean().default(true),
    promotedAt: Joi.date().iso(),
    note: Joi.string().allow("", null),
    code: Joi.string().trim().uppercase(),
    discountPercent: Joi.number().min(0).max(100),
    maxDiscountAmount: Joi.number().min(0),
  }).default({}),
  query: Joi.object({}).required(),
  params: Joi.object({
    influencerId: Joi.string().required(),
  }).required(),
});

const listCodesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    ...pagingQuery,
    influencerId: Joi.string(),
    status: Joi.string().valid(...codeStatuses),
  }).required(),
  params: Joi.object({}).required(),
});

const createCodeSchema = Joi.object({
  body: Joi.object({
    influencerId: Joi.string().required(),
    code: Joi.string().trim().uppercase(),
    discountPercent: Joi.number().min(0).max(100),
    maxDiscountAmount: Joi.number().min(0),
    status: Joi.string().valid(...codeStatuses),
    startsAt: Joi.date().iso().allow(null),
    expiresAt: Joi.date().iso().allow(null),
    usageLimit: Joi.number().integer().min(1).allow(null),
    metadata: Joi.object().default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateCodeSchema = Joi.object({
  body: Joi.object({
    code: Joi.string().trim().uppercase(),
    discountPercent: Joi.number().min(0).max(100),
    maxDiscountAmount: Joi.number().min(0),
    status: Joi.string().valid(...codeStatuses),
    startsAt: Joi.date().iso().allow(null),
    expiresAt: Joi.date().iso().allow(null),
    usageLimit: Joi.number().integer().min(1).allow(null),
    metadata: Joi.object(),
  })
    .min(1)
    .required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    codeId: Joi.string().required(),
  }).required(),
});

const listOrdersSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    ...pagingQuery,
    status: Joi.string().valid(...referralOrderStatuses),
    code: Joi.string().trim().uppercase(),
    influencerId: Joi.string(),
    customerId: Joi.string(),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
  }).required(),
  params: Joi.object({}).required(),
});

const listCommissionsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    ...pagingQuery,
    status: Joi.string().valid(...ledgerStatuses),
    commissionType: Joi.string().valid(...commissionTypes),
    influencerId: Joi.string(),
    orderId: Joi.string(),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
  }).required(),
  params: Joi.object({}).required(),
});

const listPayoutsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    ...pagingQuery,
    status: Joi.string().valid(...payoutStatuses),
    influencerId: Joi.string(),
  }).required(),
  params: Joi.object({}).required(),
});

const payoutActionSchema = Joi.object({
  body: Joi.object({
    adminNote: Joi.string().allow("", null),
    reason: Joi.string().allow("", null),
    paidAt: Joi.date().iso(),
  }).default({}),
  query: Joi.object({}).required(),
  params: Joi.object({
    payoutId: Joi.string().required(),
  }).required(),
});

const listRulesSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    active: Joi.boolean(),
  }).required(),
  params: Joi.object({}).required(),
});

const upsertRulesSchema = Joi.object({
  body: Joi.object({
    customerDiscountPercent: Joi.number().min(0).max(100),
    codeOwnerBasePercent: Joi.number().min(0).max(100),
    directParentPercent: Joi.number().min(0).max(100),
    lifetimeOverridePercent: Joi.number().min(0).max(100),
    releaseDelayDays: Joi.number().integer().min(0),
    yearlyPromotionThreshold: Joi.number().min(0),
    overrideMode: Joi.string().valid("nearest_only", "stacked"),
    overrideScope: Joi.string().valid("promoted_subtree", "direct_sales_only"),
    couponStackAllowed: Joi.boolean(),
    minOrderAmount: Joi.number().min(0),
    maxDiscountAmount: Joi.number().min(0),
    active: Joi.boolean(),
    effectiveFrom: Joi.date().iso().allow(null),
    effectiveTo: Joi.date().iso().allow(null),
    monthlyBonusTiers: Joi.array().items(
      Joi.object({
        fromAmount: Joi.number().min(0).required(),
        toAmount: Joi.number().min(0).allow(null),
        bonusPercent: Joi.number().min(0).max(100).required(),
      }),
    ),
    metadata: Joi.object(),
  })
    .min(1)
    .required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const emptySchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const listFraudReviewsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(500),
    status: Joi.string().valid("open", "reviewing", "resolved", "dismissed"),
    severity: Joi.string().valid("low", "medium", "high"),
    influencerId: Joi.string(),
  }).required(),
  params: Joi.object({}).required(),
});

module.exports = {
  listInfluencersSchema,
  createParentInfluencerSchema,
  createChildInfluencerSchema,
  updateInfluencerStatusSchema,
  promoteInfluencerSchema,
  listCodesSchema,
  createCodeSchema,
  updateCodeSchema,
  listOrdersSchema,
  listCommissionsSchema,
  listPayoutsSchema,
  payoutActionSchema,
  listRulesSchema,
  upsertRulesSchema,
  emptySchema,
  listFraudReviewsSchema,
};
