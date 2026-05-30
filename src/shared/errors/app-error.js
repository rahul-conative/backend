/**
 * Application error class with typed factory methods.
 *
 * Every factory produces a user-friendly message and a machine-readable code.
 * Technical details are kept off the response and logged server-side.
 */

class AppError extends Error {
  constructor(message, statusCode = 500, details = null, code = null) {
    super(message);
    this.name       = "AppError";
    this.statusCode = statusCode;
    this.details    = details;
    this.code       = code;
  }
}

// ─── Error Codes ─────────────────────────────────────────────────────────────

const CODES = {
  // Auth
  UNAUTHENTICATED:        "UNAUTHENTICATED",
  SESSION_EXPIRED:        "SESSION_EXPIRED",
  INVALID_CREDENTIALS:    "INVALID_CREDENTIALS",
  ACCOUNT_SUSPENDED:      "ACCOUNT_SUSPENDED",
  ACCOUNT_INACTIVE:       "ACCOUNT_INACTIVE",
  // Access
  FORBIDDEN:              "FORBIDDEN",
  PERMISSION_DENIED:      "PERMISSION_DENIED",
  HIERARCHY_DENIED:       "HIERARCHY_DENIED",
  OWNERSHIP_DENIED:       "OWNERSHIP_DENIED",
  MODULE_INACTIVE:        "MODULE_INACTIVE",
  // Validation
  VALIDATION_ERROR:       "VALIDATION_ERROR",
  DUPLICATE_ENTRY:        "DUPLICATE_ENTRY",
  REQUIRED_FIELD:         "REQUIRED_FIELD",
  INVALID_VALUE:          "INVALID_VALUE",
  INVALID_STATUS:         "INVALID_STATUS",
  INVALID_TRANSITION:     "INVALID_TRANSITION",
  // Resource
  NOT_FOUND:              "NOT_FOUND",
  DEPENDENCY_NOT_FOUND:   "DEPENDENCY_NOT_FOUND",
  DEPENDENCY_INACTIVE:    "DEPENDENCY_INACTIVE",
  DEPENDENCY_IN_USE:      "DEPENDENCY_IN_USE",
  // Business
  ALREADY_VERIFIED:       "ALREADY_VERIFIED",
  ALREADY_APPROVED:       "ALREADY_APPROVED",
  STOCK_INSUFFICIENT:     "STOCK_INSUFFICIENT",
  ORDER_NOT_CANCELLABLE:  "ORDER_NOT_CANCELLABLE",
  COUPON_EXPIRED:         "COUPON_EXPIRED",
  COUPON_LIMIT_REACHED:   "COUPON_LIMIT_REACHED",
  // Server
  INTERNAL_ERROR:         "INTERNAL_ERROR",
  FILE_TOO_LARGE:         "FILE_TOO_LARGE",
  UNSUPPORTED_FILE_TYPE:  "UNSUPPORTED_FILE_TYPE",
};

// ─── Factory methods ──────────────────────────────────────────────────────────

/** 401 – not authenticated / session expired */
AppError.unauthenticated = (msg = "Your session has expired. Please login again.") =>
  new AppError(msg, 401, null, CODES.SESSION_EXPIRED);

/** 403 – forbidden / no permission */
AppError.forbidden = (msg = "You do not have permission to perform this action.") =>
  new AppError(msg, 403, null, CODES.PERMISSION_DENIED);

AppError.permissionDenied = (module, action) =>
  new AppError(
    `You do not have permission to ${action || "access"} ${module || "this resource"}.`,
    403,
    null,
    CODES.PERMISSION_DENIED,
  );

AppError.hierarchyDenied = () =>
  new AppError("You cannot manage users outside your hierarchy.", 403, null, CODES.HIERARCHY_DENIED);

AppError.ownershipDenied = () =>
  new AppError("You can only access resources that belong to you.", 403, null, CODES.OWNERSHIP_DENIED);

AppError.moduleInactive = (module) =>
  new AppError(`The ${module || "requested"} module is currently inactive.`, 403, null, CODES.MODULE_INACTIVE);

/** 404 – not found */
AppError.notFound = (resource = "Record") =>
  new AppError(`${resource} not found.`, 404, null, CODES.NOT_FOUND);

AppError.dependencyNotFound = (dependency) =>
  new AppError(
    `${dependency || "Required reference"} does not exist.`,
    422,
    null,
    CODES.DEPENDENCY_NOT_FOUND,
  );

AppError.dependencyInactive = (dependency) =>
  new AppError(
    `${dependency || "Required reference"} is inactive and cannot be used.`,
    422,
    null,
    CODES.DEPENDENCY_INACTIVE,
  );

AppError.dependencyInUse = (resource, dependency) =>
  new AppError(
    `${resource || "This record"} is used by ${dependency || "other records"} and cannot be deleted.`,
    409,
    null,
    CODES.DEPENDENCY_IN_USE,
  );

/** 409 – duplicate */
AppError.duplicate = (field, value) =>
  new AppError(
    value
      ? `${field || "This value"} "${value}" already exists.`
      : `${field || "A record"} with this value already exists.`,
    409,
    null,
    CODES.DUPLICATE_ENTRY,
  );

/** 422 – validation / business rule */
AppError.validation = (message, fields = null) =>
  new AppError(message, 422, fields ? { fields } : null, CODES.VALIDATION_ERROR);

AppError.invalidStatusTransition = (from, to, module) =>
  new AppError(
    `Status cannot be changed from "${from}" to "${to}"${module ? ` for ${module}` : ""}.`,
    422,
    null,
    CODES.INVALID_TRANSITION,
  );

AppError.alreadyVerified = (resource = "Record") =>
  new AppError(`${resource} is already verified.`, 409, null, CODES.ALREADY_VERIFIED);

AppError.alreadyApproved = (resource = "Record") =>
  new AppError(`${resource} is already approved.`, 409, null, CODES.ALREADY_APPROVED);

AppError.insufficientStock = (product) =>
  new AppError(
    product
      ? `Insufficient stock for "${product}".`
      : "Insufficient stock to complete this operation.",
    422,
    null,
    CODES.STOCK_INSUFFICIENT,
  );

AppError.accountSuspended = () =>
  new AppError(
    "Your account has been suspended. Please contact support.",
    403,
    null,
    CODES.ACCOUNT_SUSPENDED,
  );

AppError.accountInactive = () =>
  new AppError(
    "Your account is inactive. Please verify your email or contact support.",
    403,
    null,
    CODES.ACCOUNT_INACTIVE,
  );

module.exports = { AppError, ERROR_CODES: CODES };
