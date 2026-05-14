const express = require("express");
const router = express.Router();

const { authenticate } = require("../../../shared/middleware/authenticate");
const { RecommendationService } = require("../services/recommendation.service");
const { recommendationValidation } = require("../../validation");
const jwt = require("jsonwebtoken");
const { env } = require("../../../config/env");

function optionalAuthenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();

  try {
    req.auth = jwt.verify(authHeader.replace("Bearer ", ""), env.jwtAccessSecret);
  } catch {
    req.auth = null;
  }
  return next();
}

// ==============================
// Get personalized recommendations
// ==============================
router.get("/", optionalAuthenticate, async (req, res, next) => {
  try {
    const { error, value } =
      recommendationValidation.getRecommendations.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details,
      });
    }

    const userId = req.auth?.sub;

    const recs = await RecommendationService.getRecommendations(userId, value);

    return res.status(200).json({
      success: true,
      data: recs,
    });
  } catch (err) {
    next(err);
  }
});

// ==============================
// Track interaction with recommendation
// ==============================
router.post(
  "/:productId/interact",
  authenticate,
  async (req, res, next) => {
    try {
      const { error } =
        recommendationValidation.recordInteraction.validate({
          ...req.body,
          productId: req.params.productId,
        });

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details,
        });
      }

      const userId = req.auth?.sub;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { interactionType } = req.body;

      await RecommendationService.recordInteraction(
        userId,
        req.params.productId,
        interactionType
      );

      return res.status(200).json({
        success: true,
        message: "Interaction recorded",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==============================
// Get trending products
// ==============================
router.get("/trending", async (req, res, next) => {
  try {
    const { error, value } =
      recommendationValidation.getTrending.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details,
      });
    }

    const { category, period, limit } = value;

    const trending = await RecommendationService.getTrendingProducts(
      category,
      period,
      { limit },
    );

    return res.status(200).json({
      success: true,
      data: trending,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
