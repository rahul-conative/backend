function okResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta,
  };
}

function failResponse(message, details = null) {
  return {
    success: false,
    error: {
      message,
      details,
    },
  };
}

module.exports = { okResponse, failResponse };
