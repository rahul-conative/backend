const { AuditLogModel } = require("./audit-log.model");

/**
 * Business-level audit service.
 *
 * Usage in controllers/services:
 *   await auditService.record(req, {
 *     module:     'products',
 *     action:     'update',
 *     entityId:   product._id,
 *     entityType: 'Product',
 *     oldData:    existingProduct,
 *     newData:    updatedProduct,
 *     reason:     req.body.reason,
 *   });
 */

function extractActorMeta(req) {
  const auth = req?.auth || {};
  return {
    actorId:   auth.sub || auth.id || auth.userId || null,
    actorName: auth.name || auth.email || null,
    actorRole: auth.role || (Array.isArray(auth.roles) ? auth.roles[0] : null) || null,
  };
}

function extractRequestMeta(req) {
  return {
    method:    req?.method || null,
    path:      req?.originalUrl || req?.path || null,
    requestId: req?.id || null,
    ip:        req?.ip || req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || null,
    userAgent: req?.headers?.["user-agent"] || null,
  };
}

function computeChangedFields(oldData, newData) {
  if (!oldData || !newData) return [];
  const changed = [];
  const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  for (const key of keys) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changed.push(key);
    }
  }
  return changed;
}

function toPlainObject(data, seen = new WeakSet()) {
  if (!data || typeof data !== "object") return data;
  if (data instanceof Date) return data.toISOString();
  if (typeof data.toHexString === "function") return data.toHexString();
  if (Buffer.isBuffer(data)) return "[Buffer]";
  if (seen.has(data)) return "[Circular]";
  seen.add(data);

  if (typeof data.toObject === "function") {
    try {
      return toPlainObject(data.toObject({ depopulate: true, flattenMaps: true }), seen);
    } catch {
      // Fall through to object traversal.
    }
  }

  if (data instanceof Map) {
    return Array.from(data.entries()).reduce((acc, [key, value]) => {
      acc[key] = toPlainObject(value, seen);
      return acc;
    }, {});
  }

  if (Array.isArray(data)) {
    return data.map((item) => toPlainObject(item, seen));
  }

  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined && typeof value !== "function") {
      acc[key] = toPlainObject(value, seen);
    }
    return acc;
  }, {});
}

const SENSITIVE_EXACT_KEYS = new Set(["password", "passwordhash", "pin", "otp"]);
const SENSITIVE_KEY_PARTS = ["token", "secret", "authorization", "cookie", "apikey"];

function isSensitiveKey(key) {
  const normalized = String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return SENSITIVE_EXACT_KEYS.has(normalized) ||
    SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function redactSensitive(data, seen = new WeakSet()) {
  if (!data || typeof data !== "object") return data;
  if (seen.has(data)) return "[Circular]";
  seen.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitive(item, seen));
  }

  const out = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = isSensitiveKey(key) ? "[REDACTED]" : redactSensitive(value, seen);
  }
  return out;
}

function sanitize(data) {
  return redactSensitive(toPlainObject(data));
}

/**
 * record(req, options)
 *
 * Options:
 *   module      {string}  — module slug, e.g. "products"
 *   action      {string}  — action slug, e.g. "create" | "update" | "delete" | "status_change" | "approve" | ...
 *   entityId    {string|number}
 *   entityType  {string}  — e.g. "Product"
 *   oldData     {object}  — state before change
 *   newData     {object}  — state after change
 *   reason      {string}  — optional reason (for reject/status changes)
 *   description {string}  — free-text summary
 *   statusCode  {number}  — override HTTP status (default: inferred from req)
 */
async function record(req, options = {}) {
  try {
    const {
      module,
      action,
      entityId,
      entityType,
      oldData,
      newData,
      reason,
      description,
      statusCode,
    } = options;

    const actorMeta   = extractActorMeta(req);
    const requestMeta = extractRequestMeta(req);
    const sanitizedOldData = sanitize(oldData) || null;
    const sanitizedNewData = sanitize(newData) || null;
    const changedFields = computeChangedFields(sanitizedOldData, sanitizedNewData);

    await AuditLogModel.create({
      ...actorMeta,
      module:      module || null,
      action:      action || null,
      entityId:    entityId ? String(entityId) : null,
      entityType:  entityType || null,
      description: description || null,
      oldData:     sanitizedOldData,
      newData:     sanitizedNewData,
      changedFields,
      reason:      reason || null,
      ...requestMeta,
      statusCode:  statusCode ?? requestMeta.statusCode ?? null,
    });
  } catch {
    // Audit failures must never crash the request
  }
}

/**
 * Convenience wrappers for common actions.
 */
const auditService = {
  record,
  create:       (req, opts) => record(req, { action: "create",        ...opts }),
  update:       (req, opts) => record(req, { action: "update",        ...opts }),
  remove:       (req, opts) => record(req, { action: "delete",        ...opts }),
  statusChange: (req, opts) => record(req, { action: "status_change", ...opts }),
  approve:      (req, opts) => record(req, { action: "approve",       ...opts }),
  reject:       (req, opts) => record(req, { action: "reject",        ...opts }),
};

module.exports = { auditService };
