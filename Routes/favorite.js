const express = require('express');
const router = express.Router();

const favoriteController = require('../Controllers/favorite');
const auth = require('../Middleware/authentication');


// 🔐 ALL ROUTES REQUIRE LOGIN

// Add to favorites
router.post(
  '/',
  auth.AuthJWT,
  favoriteController.addFavorite
);

// Toggle favorite (recommended for frontend)
router.post(
  '/toggle',
  auth.AuthJWT,
  favoriteController.toggleFavorite
);

// Remove from favorites
router.delete(
  '/:attractionId',
  auth.AuthJWT,
  favoriteController.removeFavorite
);

// Get my favorites
router.get(
  '/my',
  auth.AuthJWT,
  favoriteController.getMyFavorites
);

// Check if attraction is favorited
router.get(
  '/check/:attractionId',
  auth.AuthJWT,
  favoriteController.isFavorited
);

module.exports = router;