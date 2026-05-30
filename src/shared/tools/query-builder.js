/**
 * Build a Mongoose filter object from request query params.
 */
function buildMongoFilter(opts = {}) {
  const {
    search,
    searchFields = [],
    exactFilters = {},
    status,
    statusField = "status",
    startDate,
    endDate,
    dateField = "createdAt",
    extra = {},
  } = opts;

  const filter = {};

  if (search && searchFields.length) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = searchFields.map((field) => ({ [field]: { $regex: regex } }));
  }

  for (const [field, value] of Object.entries(exactFilters)) {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      filter[field] = value;
    }
  }

  if (status && status !== "all") {
    filter[statusField] = status;
  }

  if (startDate || endDate) {
    filter[dateField] = {};
    if (startDate) filter[dateField].$gte = new Date(startDate);
    if (endDate)   filter[dateField].$lte = new Date(endDate);
  }

  Object.assign(filter, extra);

  return filter;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  buildMongoFilter,
  escapeRegex,
};
