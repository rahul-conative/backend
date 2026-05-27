const {
  DEFAULT_PLATFORM_MODULES,
  DEFAULT_SELLER_MODULES,
} = require("./module-catalog");

const ROLES_WITH_MODULE_ACCESS = new Set([
  "admin",
  "sub-admin",
  "seller",
  "seller-admin",
  "seller-sub-admin",
]);

const MODULE_ALIASES = {
  "admin-users": "admin_users",
  admin_users: "admin_users",
  "sub-admins": "admin_users",
  sub_admins: "admin_users",
  "user-permissions": "rbac",
  user_permissions: "rbac",
  "seller-users": "sellers",
  seller_users: "sellers",
  "seller-staff": "sellers",
  seller_staff: "sellers",
  "seller-management": "sellers",
  seller_management: "sellers",
  "seller-kyc": "seller_kyc",
  seller_kyc: "seller_kyc",
  "seller-bank": "seller_bank",
  seller_bank: "seller_bank",
  category: "categories",
  categories: "categories",
  "category-attributes": "categories",
  category_attributes: "categories",
  "sub-category": "sub_categories",
  "sub-categories": "sub_categories",
  sub_category: "sub_categories",
  sub_categories: "sub_categories",
  "sub-sub-category": "sub_sub_categories",
  "sub-sub-categories": "sub_sub_categories",
  sub_sub_category: "sub_sub_categories",
  sub_sub_categories: "sub_sub_categories",
  brand: "brands",
  brands: "brands",
  "product-options": "option_masters",
  product_options: "option_masters",
  "option-masters": "option_masters",
  option_masters: "option_masters",
  "product-option-values": "option_values",
  product_option_values: "option_values",
  "option-values": "option_values",
  option_values: "option_values",
  "product-reviews": "reviews",
  product_reviews: "reviews",
  reviews: "reviews",
  country: "countries",
  countries: "countries",
  state: "states",
  states: "states",
  city: "cities",
  cities: "cities",
  zipcode: "zip_codes",
  zipcodes: "zip_codes",
  "zip-code": "zip_codes",
  "zip-codes": "zip_codes",
  zip_codes: "zip_codes",
  pincode: "zip_codes",
  pincodes: "zip_codes",
  "pin-code": "zip_codes",
  "pin-codes": "zip_codes",
  "hsn-code": "tax",
  "hsn-codes": "tax",
  product: "products",
  "product-catalog": "products",
  seller: "sellers",
  vendors: "sellers",
  commissions: "sellers/commissions",
  "seller-commissions": "sellers/commissions",
  seller_commissions: "sellers/commissions",
  order: "orders",
  "order-status": "orders",
  order_status: "orders",
  coupon: "coupons",
  coupons: "coupons",
  "discount-coupons": "coupons",
  discount_coupons: "coupons",
  "promotion-banners": "banners",
  promotion_banners: "banners",
  banners: "banners",
  "content-management": "cms_pages",
  content_management: "cms_pages",
  "cms-pages": "cms_pages",
  cms_pages: "cms_pages",
  reports: "reports",
  analytics_reports: "reports",
  messages: "notifications",
  "shipping-packages": "delivery",
  shipping_packages: "delivery",
  "pickup-addresses": "delivery",
  pickup_addresses: "delivery",
  "shipping-profile": "delivery",
  shipping_profile: "delivery",
  "dynamic-pricing": "dynamic-pricing",
  dynamic_pricing: "dynamic-pricing",
  "referral-commerce": "referral",
  referral_commerce: "referral",
};

function cleanModuleName(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return MODULE_ALIASES[normalized] || normalized;
}

function getRequestModule(req) {
  const withoutQuery = String(req.originalUrl || "").split("?")[0];
  const parts = withoutQuery.split("/").filter(Boolean);
  const apiIndex = parts.indexOf("api");
  if (apiIndex === -1) {
    return null;
  }

  const afterApi = parts[apiIndex + 1];
  const startIndex = /^v\d+$/i.test(afterApi || "")
    ? apiIndex + 2
    : apiIndex + 1;
  if (parts.length <= startIndex) {
    return null;
  }

  const first = parts[startIndex];
  const second = parts[startIndex + 1];
  const third = parts[startIndex + 2];
  const fourth = parts[startIndex + 3];

  if (first === "admin") {
    if (second === "access" && third === "modules") {
      return null;
    }

    if (second === "access" && ["admins", "sub-admins"].includes(third)) {
      return "admin_users";
    }

    if (second === "access" && third === "activity-logs") {
      return "rbac";
    }

    if (second === "platform" && third === "hsn-codes") {
      return "tax";
    }

    if (second === "platform" && third === "product-reviews") {
      return "reviews";
    }

    if (second === "products" && (third === "inventory" || fourth === "inventory")) {
      return "inventory";
    }

    if (second === "platform" && third === "categories") {
      return "categories";
    }

    if (second === "platform" && third === "sub-categories") {
      return "sub_categories";
    }

    if (second === "platform" && third === "sub-sub-categories") {
      return "sub_sub_categories";
    }

    if (second === "categories" && third && fourth === "attributes") {
      return "categories";
    }

    if (second === "platform" && third === "brands") {
      return "brands";
    }

    if (second === "platform" && third === "product-options") {
      return "option_masters";
    }

    if (second === "platform" && third === "product-option-values") {
      return "option_values";
    }

    if (second === "cms") {
      return "cms_pages";
    }

    if (second === "pricing" && third === "coupons") {
      return "coupons";
    }

    if (second === "pricing" && third === "promotion-banners") {
      return "banners";
    }

    if (second === "sellers" && third === "kyc") {
      return "seller_kyc";
    }

    if (second === "sellers" && fourth === "kyc") {
      return "seller_kyc";
    }

    if (second === "sellers" && fourth === "bank") {
      return "seller_bank";
    }

    if (second === "common") {
      const commonModuleMap = {
        countries: "countries",
        states: "states",
        cities: "cities",
        "zip-codes": "zip_codes",
      };
      if (commonModuleMap[third]) {
        return commonModuleMap[third];
      }
    }

    if (second === "common" && ["taxes", "sub-taxes", "tax-rules"].includes(third)) {
      return "tax";
    }

    if (second === "platform" && third === "content-pages") {
      return "cms_pages";
    }

    const adminModuleMap = {
      access: "rbac",
      cms: "cms_pages",
      dashboard: "admin",
      "seller-users": "sellers",
      users: "users",
      "admin-users": "admin_users",
      vendors: "sellers",
      sellers: "sellers",
      products: "products",
      orders: "orders",
      payments: "payments",
      payouts: "payments",
      inventory: "inventory",
      shipping: "delivery",
      tax: "tax",
      common: "platform",
      platform: "platform",
      analytics: "reports",
      reports: "reports",
      returns: "returns",
      chargebacks: "fraud",
      referral: "referral",
      system: "admin",
    };

    if (second === "platform" && third === "feature-flags") {
      return "admin";
    }

    return adminModuleMap[second] || "admin";
  }

  if (first === "sellers" && second === "commissions") {
    return "sellers/commissions";
  }
  if (first === "rbac" && second === "modules" && third === "sidebar") {
    return null;
  }
  if (first === "sellers" && second === "me" && third === "dashboard") {
    return "analytics";
  }
  if (first === "sellers" && second === "me" && third === "tracking") {
    return "orders";
  }
  if (first === "sellers" && second === "me" && third === "access") {
    return "sellers";
  }
  if (first === "platform" && second === "cms") {
    return "cms_pages";
  }
  if (first === "platform" && second === "hsn-codes") {
    return "tax";
  }
  if (first === "platform" && second === "product-reviews") {
    return "reviews";
  }
  if (first === "products" && (second === "inventory" || third === "inventory")) {
    return "inventory";
  }
  if (first === "platform" && second === "categories") {
    return "categories";
  }
  if (first === "platform" && second === "sub-categories") {
    return "sub_categories";
  }
  if (first === "platform" && second === "sub-sub-categories") {
    return "sub_sub_categories";
  }
  if (first === "platform" && second === "brands") {
    return "brands";
  }
  if (first === "platform" && second === "product-options") {
    return "option_masters";
  }
  if (first === "platform" && second === "product-option-values") {
    return "option_values";
  }
  if (first === "coupons") {
    return "coupons";
  }
  if (first === "pricing" && second === "coupons") {
    return "coupons";
  }
  if (first === "pricing" && second === "promotion-banners") {
    return "banners";
  }
  if (first === "analytics") {
    return "reports";
  }
  return cleanModuleName(first);
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
