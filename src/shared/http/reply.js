/**
 * Standardized API response helpers.
 *
 * Success:
 *   { success: true, message?, data, pagination?, meta? }
 *
 * Error:
 *   { success: false, message, code?, error: { code?, message, details?, fields? } }
 */

/**
 * Build a success response.
 *
 * @param {*}      data
 * @param {object} [opts]
 * @param {string} [opts.message]
 * @param {object} [opts.pagination]  — { page, limit, total, totalPages }
 * @param {object} [opts.meta]        — arbitrary extra metadata
 */
function okResponse(data, opts = {}) {
  // Support legacy call: okResponse(data, metaObject) where meta is not a
  // structured options object but raw meta — detect by absence of known keys.
  let message, pagination, meta;
  if (
    opts &&
    typeof opts === "object" &&
    (opts.message !== undefined ||
      opts.pagination !== undefined ||
      opts.meta !== undefined)
  ) {
    ({ message, pagination, meta } = opts);
  } else if (opts && typeof opts === "object") {
    // Legacy: second arg was raw meta object
    meta = Object.keys(opts).length ? opts : undefined;
  }

  const response = { success: true };
  if (message) response.message = message;
  response.data = data;
  if (pagination) response.pagination = pagination;

  const metaPayload = {};
  if (meta && Object.keys(meta).length) Object.assign(metaPayload, meta);
  if (pagination) {
    Object.assign(metaPayload, pagination);
    metaPayload.pagination = pagination;
  }
  if (Object.keys(metaPayload).length) response.meta = metaPayload;

  return response;
}

/**
 * Build an error response.
 *
 * @param {string}   message
 * @param {*}        [details]  — field-level validation errors or extra context
 * @param {string}   [code]     — machine-readable error code
 * @param {object[]} [fields]   — array of { field, message } for form validation
 */
function failResponse(message, details = null, code = null, fields = null) {
  const error = {};
  if (code) error.code = code;
  error.message = message;
  if (details) error.details = details;
  if (fields && Array.isArray(fields) && fields.length) error.fields = fields;

  const response = {
    success: false,
    message,
    error,
  };
  if (code) response.code = code;
  return response;
}

/**
 * Build a pagination meta object from page/limit/total.
 * Pass the result as opts.pagination in okResponse().
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @returns {{ page, limit, total, totalPages }}
 */
function paginationMeta(page, limit, total) {
  return {
    page:       Number(page),
    limit:      Number(limit),
    total:      Number(total),
    totalPages: Math.ceil(Number(total) / Number(limit)) || 0,
  };
}

module.exports = { okResponse, failResponse, paginationMeta };
