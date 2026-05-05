const bcrypt = require("bcryptjs");

async function hashText(value) {
  return bcrypt.hash(value, 12);
}

async function checkHash(value, hashedValue) {
  return bcrypt.compare(value, hashedValue);
}

module.exports = { hashText, checkHash };
