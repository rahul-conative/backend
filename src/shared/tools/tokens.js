const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { v4: uuidv4 } = require("uuid");

function makeAccessToken(payload) {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });
}

function makeRefreshToken(payload) {
  return jwt.sign({ ...payload, sessionId: uuidv4() }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshTtl,
  });
}

function makeOnboardingToken(payload) {
  return jwt.sign({ ...payload, isOnboarding: true }, env.jwtAccessSecret, {
    expiresIn: "24h",
  });
}

function readRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = {
  makeAccessToken,
  makeRefreshToken,
  makeOnboardingToken,
  readRefreshToken,
};
