const express = require('express');
const router = express.Router();

const reviewController = require('../Controllers/review');
const auth = require('../Middleware/authentication');

// CREATE or UPDATE review
router.post(
  '/',
  auth.AuthJWT,
  reviewController.createOrUpdateReview
);

// GET all reviews for a specific attraction
router.get(
  '/attraction/:attractionId',
  reviewController.getAttractionReviews
);

// GET logged-in user's reviews
router.get(
  '/my-reviews',
  auth.AuthJWT,
  reviewController.getMyReviews
);

// DELETE review
router.delete(
  '/:id',
  auth.AuthJWT,
  reviewController.deleteReview
);

// GET single review
router.get(
  '/:id',
  reviewController.getReviewById
);

module.exports = router;