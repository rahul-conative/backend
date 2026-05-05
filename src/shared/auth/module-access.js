const ROLES_WITH_MODULE_ACCESS = new Set(["sub-admin", "seller-sub-admin"]);

const DEFAULT_PLATFORM_MODULES = [
  "users",
  "products",
  "carts",
  "orders",
  "payments",
  "platform",
  "sellers",
  "notifications",
  "analytics",
  "pricing",
  "wallets",
  "tax",
  "subscriptions",
  "rbac",
  "warranty",
  "loyalty",
  "recommendations",
  "returns",
  "fraud",
  "dynamic-pricing",
  "delivery",
  "admin",
];

const DEFAULT_SELLER_MODULES = [
  "products",
  "orders",
  "pricing",
  "notifications",
  "analytics",
  "sellers",
  "sellers/commissions",
  "returns",
  "delivery",
];

function cleanModuleName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getRequestModule(req) {
  const withoutQuery = String(req.originalUrl || "").split("?")[0];
  const parts = withoutQuery.split("/").filter(Boolean);
  const apiIndex = parts.indexOf("api");
  if (apiIndex === -1 || parts.length <= apiIndex + 2) {
    return null;
  }
  const first = parts[apiIndex + 2];
  const second = parts[apiIndex + 3];
  if (first === "sellers" && second === "commissions") {
    return "sellers/commissions";
  }
  return first;
}

function usesModuleAccess(auth) {
  const roles = [
    auth?.role,
    ...(Array.isArray(auth?.roles) ? auth.roles : []),
  ].filter(Boolean);

  return roles.some((role) => ROLES_WITH_MODULE_ACCESS.has(role));
}

module.exports = {
  DEFAULT_PLATFORM_MODULES,
  DEFAULT_SELLER_MODULES,
  cleanModuleName,
  getRequestModule,
  usesModuleAccess,
};
