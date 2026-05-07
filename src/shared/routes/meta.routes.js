const express = require("express");
const { env } = require("../../config/env");
const { API_MODULES } = require("../auth/module-catalog");

const metaRoutes = express.Router();

metaRoutes.get("/routes", (req, res) => {
  return res.json({
    success: true,
    data: {
      appName: env.appName,
      version: "1.0.0",
      apiPrefix: env.apiPrefix,
      modules: API_MODULES,
      docs: {
        readme: "README.md",
        apiReference: "docs/API_REFERENCE.md",
      },
    },
  });
});

module.exports = { metaRoutes };
