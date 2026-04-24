const express = require('express');
const router = express.Router();

const ownerController = require('../Controllers/owner');
const auth = require('../Middleware/authentication');

// ===============================
// 🔐 OWNER (LOGGED IN)
// ===============================

// Get my owner profile
router.get(
  '/me/profile',
  auth.AuthJWT,
  ownerController.getMyOwnerProfile
);

// Get my listings
router.get(
  '/me/listings',
  auth.AuthJWT,
  async (req, res, next) => {
    req.params.ownerId = req.user.ownerId;
    next();
  },
  ownerController.getOwnerListings
);


// ===============================
// 🔓 PUBLIC / ADMIN
// ===============================

// Get all owners (admin)
router.get(
  '/',
  auth.adminJWT,
  ownerController.getAllOwners
);

// Get owner by user ID
router.get(
  '/user/:userId',
  auth.AuthJWT,
  ownerController.getOwnerByUserId
);

// Get listings by owner ID
router.get(
  '/:ownerId/listings',
  ownerController.getOwnerListings
);

// Get owner by ID (⚠️ KEEP THIS LAST)
router.get(
  '/:id',
  auth.AuthJWT,
  ownerController.getOwnerById
);


// ===============================
// 🔐 ADMIN ONLY
// ===============================

// Create owner
router.post(
  '/',
  auth.adminJWT,
  ownerController.createOwner
);

// Update owner
router.put(
  '/:id',
  auth.adminJWT,
  ownerController.updateOwner
);

// Delete owner
router.delete(
  '/:id',
  auth.adminJWT,
  ownerController.deleteOwner
);

module.exports = router;