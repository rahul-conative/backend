const { AppError } = require("../errors/app-error");

function getActor(auth = {}) {
  return {
    userId: auth.sub || null,
    email: auth.email || null,
    role: auth.role || "guest",
    ownerAdminId: auth.ownerAdminId || null,
    ownerSellerId: auth.ownerSellerId || null,
    allowedModules: Array.isArray(auth.allowedModules) ? auth.allowedModules : [],
  };
}

function getCurrentUser(req) {
  if (!req.auth) {
    throw new AppError("Authentication required", 401);
  }

  return getActor(req.auth);
}

module.exports = { getActor, getCurrentUser };
