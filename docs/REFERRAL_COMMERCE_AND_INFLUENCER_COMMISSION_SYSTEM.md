# Referral Commerce and Influencer Commission System

## 1. Purpose

This document defines the complete referral commerce system for the ecommerce platform.

The goal is to support influencer-driven sales where:

- Customers apply influencer referral codes at checkout.
- Customers receive an instant referral discount.
- Influencers earn commission only from successful product sales.
- Parent influencers can create or manage child influencers.
- Promoted influe>ncers can build their own child network.
- The system can track parent - child -> sub-child -> sub-sub-child hierarchy.
- Commission payout remains controlled and margin-safe.

This system is best described as:

```text
Referral Commerce with Influencer Hierarchy and Performance-Based Incentives
```

It is not the same as seller commission and it is not the same as platform commission.

## 2. Important Separation From Existing Systems

### 2.1 Seller Platform Commission

Seller platform commission is the fee the ecommerce platform earns from sellers.

Example:

```text
Order paid amount: Rs. 10,000
Seller platform commission: 10% = Rs. 1,000
Seller payout: Rs. 9,000 before other adjustments
```

This belongs to seller settlement and seller payout.

### 2.2 Referral Influencer Commission

Referral influencer commission is a marketing expense/reward paid to influencers.

Example:

```text
Order paid amount: Rs. 10,000
Customer referral discount: 5% = Rs. 500
Child influencer commission: 3% = Rs. 300
Parent influencer commission: 2% = Rs. 200
```

This belongs to influencer wallet and influencer payout.

### 2.3 These Ledgers Must Stay Separate

Use separate ledgers:

```text
seller_commission_ledger
- seller payout
- platform seller commission
- seller settlement deductions

referral_commission_ledger
- influencer commission
- parent commission
- override commission
- referral reversals
```

Do not mix seller payout transactions with influencer commission transactions.

### 2.4 Referral Code Is Different From Coupon Code

Referral code:

- Owned by an influencer.
- Gives customer an instant referral discount.
- Creates commission liability.
- Used for attribution.

Coupon code:

- Created by platform/admin/marketing.
- May or may not create commission.
- Used for promotion.

The system must decide whether referral codes and coupon codes can be combined.

Recommended default:

```text
Only one referral code per order.
Referral code can combine with coupon only if admin config allows it.
If both apply, validate margin before accepting checkout.
```

### 2.5 Referral Login Is Different From Admin And Seller Login

Influencers must not login as ecommerce admins.

Recommended login separation:

```text
Admin panel login:
- super-admin
- admin
- sub-admin

Seller panel login:
- seller
- seller-sub-admin

Influencer dashboard login:
- parent influencer
- child influencer
- promoted influencer
```

Implementation recommendation:

- Keep influencers as normal users in the users collection.
- Add an `influencerProfile`.
- Do not add influencers to admin RBAC.
- Provide separate influencer dashboard APIs.

## 3. Core Terms

### Admin

Platform operator who configures and controls the referral commerce system.

### Customer

Buyer who applies a referral code at checkout and receives a discount.

### Seller

Marketplace seller who sells products. Seller payout is separate from referral commission.

### Influencer

User who has an influencer profile and a referral code.

### Parent Influencer

Influencer who can create or manage child influencers.

### Child Influencer

Influencer under a parent. Owns a referral code and earns base commission from own referred sales.

### Sub-child Influencer

Influencer created under a child who has become eligible to create children. This is a deeper hierarchy level.

Example:

```text
Parent A
  Child B
    Sub-child C
      Sub-sub-child D
```

### Code Owner

Influencer whose referral code was used on the order.

### Direct Parent

Immediate parent of the code owner.

### Original Parent

Old parent who gets lifetime override after a child is promoted.

### Override Beneficiary

Influencer who receives lifetime override commission from a promoted influencer's future sales or downline sales, depending on configuration.

## 4. Recommended Default Business Rules

Use these defaults first to keep the business margin-safe:

```text
Customer referral discount: 5%
Code owner base commission: 3%
Direct parent commission: 2%
Lifetime override after promotion: 0.5%
Commission release delay: 7 days after order completion
Yearly promotion threshold: Rs. 1 crore successful referral sales
Maximum referral codes per order: 1
Maximum payable active hierarchy levels per order: 2 plus optional override
```

Important:

The hierarchy can track many levels, but payment should not become unlimited.

Recommended payout model:

```text
Pay code owner.
Pay direct parent if present and eligible.
Pay one lifetime override beneficiary if applicable.
Do not pay every ancestor by default.
```

This avoids becoming a traditional MLM with uncontrolled payout depth.

## 5. Hierarchy Rules

### 5.1 Hierarchy Storage

Every influencer profile should store:

```text
influencerId
userId
parentInfluencerId
rootInfluencerId
level
path
status
type
canCreateChildren
originalParentInfluencerId
promotedAt
```

Example:

```json
{
  "influencerId": "D",
  "parentInfluencerId": "C",
  "rootInfluencerId": "A",
  "level": 4,
  "path": ["A", "B", "C", "D"]
}
```

### 5.2 Parent Creates Child

Parent A creates Child B:

```text
A is parent.
B is child.
B gets own referral code.
A earns parent commission on B's successful referred sales.
```

### 5.3 Child Creates Sub-child

Child B can create Sub-child C only if:

- B is promoted to parent, or
- Admin manually enables `canCreateChildren`, or
- Business rule allows all children to create children.

Recommended default:

```text
Child cannot create child until promoted.
```

After B is promoted:

```text
A
  B promoted to parent
    C child of B
```

### 5.4 Sub-child Creates Sub-sub-child

Sub-child C can create Sub-sub-child D only if C is also promoted or manually enabled.

```text
A
  B promoted parent
    C promoted parent
      D child of C
```

### 5.5 Payable Commission In Deep Hierarchy

Even when hierarchy is deep:

```text
A -> B -> C -> D
```

If D's code is used:

Recommended default payout:

```text
D gets code owner commission.
C gets direct parent commission.
Old override beneficiary gets override if configured.
A and B do not automatically get commission unless they are the override beneficiary.
```

This protects margins.

### 5.6 Override Scope

When Child B reaches yearly sales threshold and becomes a parent:

```text
Original Parent A receives 0.5% lifetime override.
```

There are two possible override modes:

```text
nearest_only:
  Only one override beneficiary is paid per order.
  Recommended.

stacked:
  Multiple old parents can earn override.
  Not recommended because margin cost can grow.
```

Recommended default:

```text
overrideMode = nearest_only
overrideScope = promoted_subtree
```

Meaning:

- A receives 0.5% on future referral sales generated by B and B's downline.
- Only one override is paid per order.

## 6. Commission Structure

### 6.1 Customer Discount

Default:

```text
Customer discount = 5% of eligible product amount
```

Discount should be applied before payment.

### 6.2 Code Owner Commission

Default:

```text
Code owner commission = 3% + monthly bonus
```

This applies to the influencer whose code was used.

### 6.3 Direct Parent Commission

Default:

```text
Direct parent commission = 2%
```

This applies to the code owner's immediate parent, if eligible.

### 6.4 Lifetime Override Commission

Default:

```text
Override commission = 0.5%
```

This applies after promotion, based on override rules.

### 6.5 Monthly Bonus

Monthly sales reset every month.

Example bonus tiers:

```text
Monthly referral sales Rs. 0 to Rs. 1 lakh:
  bonus = 0%

Monthly referral sales Rs. 1 lakh to Rs. 5 lakh:
  bonus = 0.5%

Monthly referral sales Rs. 5 lakh to Rs. 10 lakh:
  bonus = 1%

Monthly referral sales above Rs. 10 lakh:
  bonus = 2%
```

Child commission:

```text
childCommissionPercent = basePercent + monthlyBonusPercent
```

### 6.6 Yearly Promotion

Condition:

```text
Influencer yearly successful referral sales >= Rs. 1 crore
```

Outcome:

```text
Influencer becomes parent.
Influencer can create children.
Original parent receives lifetime override.
```

## 7. Accounting Calculation

### 7.1 Order Example

```text
Product amount: Rs. 10,000
Referral discount: 5% = Rs. 500
Customer paid amount: Rs. 9,500
```

Seller settlement:

```text
Seller platform commission: 10% of applicable seller amount
Seller payout = paid seller amount - platform commission - fees
```

Referral commission:

```text
Code owner commission: 3% = Rs. 300
Direct parent commission: 2% = Rs. 200
Override commission if applicable: 0.5% = Rs. 50
```

Platform net margin:

```text
Platform seller commission
- referral discount cost if platform-funded
- influencer commission
- parent commission
- override commission
- payment gateway fees
- tax/TDS impact
= platform net margin
```

### 7.2 Margin Warning

If all incentives are enabled:

```text
Customer discount: 5%
Code owner commission: 3% to 5%
Direct parent commission: 2%
Override commission: 0.5%
Total referral outflow: 10.5% to 12.5% or more
```

Admin must ensure products have enough margin.

## 8. System Modules

### 8.1 Admin Referral Commerce Module

Add inside existing ecommerce admin:

```text
Admin Panel
  Referral Commerce
    Influencers
    Referral Codes
    Commission Rules
    Referral Orders
    Wallet Ledger
    Payout Requests
    Reports
    Fraud Review
```

This is inside existing admin, not a separate admin system.

### 8.2 Influencer Dashboard

Separate influencer-facing dashboard:

```text
Influencer Dashboard
  My Profile
  My Referral Code
  My Sales
  My Earnings
  My Children
  Payout Requests
  Reports
```

### 8.3 Referral Code Engine

Responsibilities:

- Generate unique referral code.
- Validate code.
- Activate/deactivate code.
- Track owner influencer.
- Prevent self-referral.
- Prevent invalid code use.

### 8.4 Discount Engine

Responsibilities:

- Validate referral code during cart/checkout.
- Apply configured customer discount.
- Check product eligibility.
- Check coupon stacking rules.
- Check maximum discount cap.

### 8.5 Commission Engine

Responsibilities:

- Identify code owner.
- Identify direct parent.
- Identify override beneficiary.
- Calculate commission.
- Create pending ledger entries.
- Release commission after delay.
- Reverse commission on refund/return/cancel.

### 8.6 Wallet System

Responsibilities:

- Track influencer earnings.
- Track pending balance.
- Track available balance.
- Track paid balance.
- Track reversed balance.

### 8.7 Payout System

Responsibilities:

- Influencer payout request.
- Admin approval.
- Bank/UPI payout.
- Status tracking.
- Rejection reason.

### 8.8 Reporting

Reports:

- Sales by referral code.
- Sales by influencer.
- Sales by parent.
- Sales by hierarchy tree.
- Monthly target tracking.
- Yearly promotion tracking.
- Payout reports.
- Fraud reports.

## 9. Data Model Recommendation

### 9.1 Mongo: User Influencer Profile

Add `influencerProfile` to `users`.

```js
influencerProfile: {
  influencerId: String,
  type: "parent" | "child",
  parentInfluencerId: String,
  rootInfluencerId: String,
  originalParentInfluencerId: String,
  level: Number,
  path: [String],
  status: "pending" | "active" | "suspended" | "rejected",
  canCreateChildren: Boolean,
  promotedAt: Date,
  onboardingStatus: String,
  kycStatus: String,
  payoutProfileStatus: String
}
```

Do not use admin role for influencers.

### 9.2 Postgres: Influencer Profiles

Recommended table:

```text
influencer_profiles
- id
- user_id
- influencer_type
- parent_influencer_id
- root_influencer_id
- original_parent_influencer_id
- level
- path jsonb
- status
- can_create_children
- promoted_at
- yearly_sales_amount
- created_at
- updated_at
```

### 9.3 Referral Codes

```text
referral_codes
- id
- influencer_id
- code
- discount_percent
- max_discount_amount
- status
- starts_at
- expires_at
- usage_limit
- usage_count
- created_by
- created_at
- updated_at
```

### 9.4 Referral Orders

```text
referral_orders
- id
- order_id
- customer_id
- referral_code_id
- code
- code_owner_influencer_id
- direct_parent_influencer_id
- override_influencer_id
- eligible_amount
- discount_amount
- status
- order_status
- payment_status
- completed_at
- created_at
- updated_at
```

### 9.5 Referral Commission Ledger

```text
referral_commission_ledger
- id
- referral_order_id
- order_id
- influencer_id
- commission_type
  - code_owner_base
  - code_owner_bonus
  - direct_parent
  - lifetime_override
  - reversal
- basis_amount
- percent
- amount
- status
  - pending
  - locked
  - available
  - payout_requested
  - paid
  - reversed
- release_at
- paid_at
- reversed_at
- metadata
- created_at
- updated_at
```

### 9.6 Monthly Influencer Stats

```text
monthly_influencer_stats
- id
- influencer_id
- year
- month
- sales_amount
- order_count
- return_amount
- bonus_percent
- bonus_locked
- calculated_at
```

### 9.7 Yearly Influencer Stats

```text
yearly_influencer_stats
- id
- influencer_id
- year
- sales_amount
- order_count
- promotion_eligible
- promoted_at
```

### 9.8 Influencer Wallet

```text
influencer_wallets
- id
- influencer_id
- pending_balance
- available_balance
- paid_balance
- reversed_balance
- created_at
- updated_at
```

### 9.9 Influencer Wallet Transactions

```text
influencer_wallet_transactions
- id
- wallet_id
- influencer_id
- ledger_id
- type
  - credit_pending
  - release_available
  - payout_hold
  - payout_paid
  - reversal
  - manual_adjustment
- amount
- balance_after
- metadata
- created_at
```

### 9.10 Influencer Payout Requests

```text
influencer_payout_requests
- id
- influencer_id
- amount
- status
  - pending
  - approved
  - rejected
  - processing
  - paid
  - failed
- payout_method
- bank_account_id
- upi_id
- admin_note
- requested_at
- approved_at
- paid_at
```

### 9.11 Commission Rule Config

```text
referral_commission_rules
- id
- customer_discount_percent
- code_owner_base_percent
- direct_parent_percent
- lifetime_override_percent
- release_delay_days
- yearly_promotion_threshold
- override_mode
- override_scope
- coupon_stack_allowed
- min_order_amount
- max_discount_amount
- active
- effective_from
- effective_to
```

## 10. End-to-End Workflow

### 10.1 Admin Setup

1. Admin creates parent influencer.
2. System creates influencer profile.
3. System generates referral code.
4. Parent influencer receives login access to influencer dashboard.
5. Parent can create child influencer if allowed.

### 10.2 Parent Creates Child

1. Parent opens influencer dashboard.
2. Parent creates child influencer.
3. System validates parent is active.
4. System creates child user/profile.
5. System maps child to parent.
6. System generates child referral code.

### 10.3 Child Uses Code

1. Child shares referral code.
2. Customer applies code.
3. Discount engine validates code.
4. Customer receives discount.
5. Order stores referral attribution.

### 10.4 Order Completion

1. Payment success.
2. Order confirmed.
3. Commission is not released immediately.
4. Commission remains pending until completion and return window rule passes.

Recommended trigger:

```text
Commission calculation starts when order is delivered/completed.
Commission release happens after configured delay.
```

### 10.5 Commission Distribution

For each successful referral order:

```text
Code owner gets base + bonus.
Direct parent gets parent commission.
Override beneficiary gets override if applicable.
Wallet pending entries are created.
```

### 10.6 Commission Release

After release delay:

```text
pending -> available
```

Influencer can request payout only from available balance.

### 10.7 Refund Handling

If order is cancelled/refunded/returned:

```text
If commission is pending:
  mark ledger reversed

If commission is available:
  debit wallet
  mark reversal

If commission is already paid:
  create negative carry-forward or admin recovery entry
```

### 10.8 Monthly Processing

1. Calculate monthly sales per influencer.
2. Apply bonus tier.
3. Lock monthly stats.
4. Reset monthly sales for next month.

### 10.9 Yearly Processing

1. Calculate yearly referral sales per influencer.
2. If threshold met, mark promotion eligible.
3. Admin can auto-promote or manually approve.
4. Promoted influencer becomes parent.
5. Original parent override rule is created.

## 11. Use Cases

### 11.1 Admin Use Cases

Admin can:

- Create parent influencer.
- Approve influencer onboarding.
- Suspend influencer.
- Reactivate influencer.
- Generate referral code.
- Deactivate referral code.
- Edit commission rules.
- Edit discount rules.
- View hierarchy tree.
- Move child under another parent with audit log.
- Promote child to parent.
- Reverse commission manually.
- Approve payout request.
- Reject payout request.
- Mark payout as paid.
- View fraud alerts.
- Export influencer sales report.
- Export payout report.

### 11.2 Parent Influencer Use Cases

Parent influencer can:

- Login to influencer dashboard.
- View own referral code.
- Share code.
- Create child influencer if `canCreateChildren = true`.
- View direct child sales.
- View own earnings.
- View parent commission earnings.
- View override earnings.
- Request payout.
- Update payout details.
- Track monthly and yearly target.

### 11.3 Child Influencer Use Cases

Child influencer can:

- Login to influencer dashboard.
- View own referral code.
- Share code.
- Track referred orders.
- Track pending commission.
- Track available commission.
- Request payout.
- Track monthly bonus.
- Track yearly promotion progress.
- Become parent after promotion.

### 11.4 Sub-child Influencer Use Cases

Sub-child influencer can:

- Be created by a promoted child.
- Own referral code.
- Earn code owner commission.
- Have promoted child as direct parent.
- Later become parent if eligible.
- Create its own child after promotion.

Example:

```text
A creates B.
B gets promoted.
B creates C.
C gets promoted.
C creates D.
D uses code.
```

Recommended payout for D's order:

```text
D: code owner commission
C: direct parent commission
A or B: only if one is configured override beneficiary
No automatic payout to every ancestor
```

### 11.5 Customer Use Cases

Customer can:

- Apply referral code in cart.
- Remove referral code.
- See discount.
- Checkout with discounted amount.
- Use code only if active and eligible.
- Not use own referral code.
- Not use multiple referral codes.
- See failure reason if code invalid.

### 11.6 Seller Use Cases

Seller is mostly separate from referral system.

Seller can:

- Receive normal order.
- Receive normal seller payout.
- See referral discount only if seller reports need it.

Seller should not manage influencer commission unless business later decides seller funds referral payouts.

### 11.7 System Use Cases

System must:

- Validate referral code.
- Prevent self-referral.
- Prevent duplicate commission for same order.
- Create commission idempotently.
- Reverse commission on refund.
- Release commission after delay.
- Calculate monthly bonus.
- Calculate yearly promotion.
- Generate audit logs.

## 12. Edge Cases And Rules

### 12.1 Self Referral

Reject if:

```text
customer.userId == referralCode.ownerUserId
```

Also reject if same phone/email/payment instrument/device is suspicious, depending on fraud rules.

### 12.2 Inactive Code

Reject code if:

- Code is inactive.
- Influencer is suspended.
- Code is expired.
- Usage limit reached.

### 12.3 Multiple Codes

Default:

```text
Only one referral code per order.
```

### 12.4 Coupon Plus Referral

Default:

```text
Do not stack unless admin config allows it.
```

If stacking is allowed:

```text
Apply coupon first or referral first based on config.
Check max total discount cap.
Check product margin.
```

### 12.5 Partial Cancellation

Commission should be calculated only on final successful eligible amount.

### 12.6 Partial Refund

Reverse commission proportional to refunded amount.

### 12.7 Full Refund

Reverse all referral commission.

### 12.8 COD Orders

For cash on delivery:

```text
Do not release commission until COD payment is collected and order is delivered.
```

### 12.9 Order Split Across Sellers

Referral commission should be calculated on eligible total product amount, not seller payout amount.

Seller settlements remain separate.

### 12.10 Product Exclusions

Admin can exclude:

- Low margin products.
- Sale products.
- Gift cards.
- Digital items.
- Specific categories.
- Specific sellers.

### 12.11 Tax And TDS

Influencer payout may require:

- PAN/GST details.
- TDS deduction.
- Payout tax reports.

This depends on legal/accounting rules.

### 12.12 Commission Already Paid But Order Refunded

Options:

```text
Create negative wallet balance.
Recover from next payout.
Manual admin adjustment.
```

Recommended:

```text
Recover from next payout.
```

### 12.13 Influencer Suspended

If influencer is suspended:

- Code becomes invalid.
- New commission stops.
- Existing pending commission can be held.
- Admin decides whether to release or reverse.

### 12.14 Parent Suspended

If parent is suspended:

- Child code can remain active.
- Parent commission is held or skipped based on config.

Recommended:

```text
Hold parent commission until admin review.
```

### 12.15 Child Reassigned To New Parent

Must audit:

- Old parent.
- New parent.
- Admin who changed it.
- Effective date.

Commission before reassignment belongs to old parent.
Commission after reassignment belongs to new parent.

### 12.16 Promotion With Existing Children

If child already has children after manual permission:

```text
Promotion keeps children under same influencer.
Original parent override starts after promotion effective date.
```

### 12.17 Multiple Promotions In Same Lineage

Example:

```text
A -> B -> C -> D
B promoted.
C promoted.
D order happens.
```

Recommended default:

```text
Pay D as code owner.
Pay C as direct parent.
Pay nearest valid override beneficiary only.
Do not stack unlimited overrides.
```

## 13. API Design Recommendation

### 13.1 Admin APIs

```text
GET    /api/v1/admin/referral/influencers
POST   /api/v1/admin/referral/influencers/parents
POST   /api/v1/admin/referral/influencers/:parentId/children
PATCH  /api/v1/admin/referral/influencers/:influencerId/status
PATCH  /api/v1/admin/referral/influencers/:influencerId/promote
GET    /api/v1/admin/referral/codes
POST   /api/v1/admin/referral/codes
PATCH  /api/v1/admin/referral/codes/:codeId
GET    /api/v1/admin/referral/orders
GET    /api/v1/admin/referral/commissions
GET    /api/v1/admin/referral/payouts
PATCH  /api/v1/admin/referral/payouts/:payoutId/approve
PATCH  /api/v1/admin/referral/payouts/:payoutId/reject
PATCH  /api/v1/admin/referral/payouts/:payoutId/paid
GET    /api/v1/admin/referral/reports/summary
GET    /api/v1/admin/referral/reports/hierarchy
```

### 13.2 Influencer APIs

```text
POST   /api/v1/influencer/auth/login
GET    /api/v1/influencer/me
GET    /api/v1/influencer/me/code
GET    /api/v1/influencer/me/sales
GET    /api/v1/influencer/me/earnings
GET    /api/v1/influencer/me/children
POST   /api/v1/influencer/me/children
GET    /api/v1/influencer/me/wallet
POST   /api/v1/influencer/me/payout-requests
GET    /api/v1/influencer/me/payout-requests
```

### 13.3 Customer Checkout APIs

```text
POST   /api/v1/cart/apply-referral-code
DELETE /api/v1/cart/referral-code
POST   /api/v1/orders
```

### 13.4 Internal Event Handlers

```text
order.payment_success
order.completed
order.cancelled
order.refunded
commission.release_due
monthly.referral_stats_due
yearly.referral_promotion_due
```

## 14. Implementation Phases

### Phase 1: Foundation

- Add influencer profile model/table.
- Add referral code table.
- Add admin influencer creation.
- Add influencer login/dashboard skeleton.

### Phase 2: Checkout Discount

- Apply referral code in cart.
- Validate code.
- Apply discount.
- Store referral attribution on order.

### Phase 3: Commission Ledger

- Calculate commission on order completion.
- Create pending ledger.
- Release after delay.
- Reverse on refund.

### Phase 4: Wallet And Payout

- Add influencer wallet.
- Add wallet transactions.
- Add payout request.
- Add admin payout approval.

### Phase 5: Monthly And Yearly Automation

- Monthly stats job.
- Monthly bonus job.
- Yearly promotion job.
- Override rule creation.

### Phase 6: Reports And Fraud

- Sales reports.
- Earnings reports.
- Hierarchy reports.
- Fraud detection.
- Admin audit logs.

## 15. Recommended Final Rules For First Release

Use this first release configuration:

```text
Hierarchy tracking:
  Parent -> child -> sub-child -> sub-sub-child supported

Who can create child:
  Only parent or promoted influencer

Customer discount:
  5%

Code owner commission:
  3%

Monthly bonus:
  Enabled but configurable

Direct parent commission:
  2%

Lifetime override:
  0.5%

Override mode:
  nearest_only

Override scope:
  promoted_subtree

Commission release:
  7 days after completed/delivered order

Refund:
  Reverse commission

Seller payout:
  Separate

Influencer payout:
  Separate

Admin:
  Existing ecommerce admin controls system

Influencer dashboard:
  Separate login, not admin login
```

## 16. Non-Negotiable Safeguards

- Do not mix seller commission with referral commission.
- Do not let influencers login as admins.
- Do not pay commission before order success.
- Do not pay commission on refunded amount.
- Do not allow unlimited ancestor commission by default.
- Do not allow self-referral.
- Do not allow duplicate commission for same order.
- Do not allow inactive/suspended influencer codes.
- Do not approve payout without available wallet balance.
- Do not change hierarchy without audit log.

