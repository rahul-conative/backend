const CONSTANTS = require("../constants/constants");

function createOtp(length = CONSTANTS.OTP_LENGTH) {
  let code = "";
  const digits = "0123456789";

  for (let index = 0; index < length; index += 1) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  return code;
}

module.exports = { createOtp };
