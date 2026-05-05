const express = require("express");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { allowRoles } = require("../../../shared/middleware/access");
const { FraudDetectionService } = require("../services/fraud-detection.service");
const { fraudValidation } = require("../../validation");

const router = express.Router();

// Admin: Review fraud flag
router.post("/:fraudId/review", authenticate, allowRoles(["admin"]), async (req, res, next) => {
  try {
    const { error, value } = fraudValidation.reviewOrder.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });

    const result = await FraudDetectionService.reviewOrder(
      req.params.fraudId,
      value.decision,
      value.notes,
      req.auth.sub,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
