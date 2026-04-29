// Routes/foods.js

const express = require('express');
const router = express.Router();

const foodController = require('../Controllers/foods');
const auth = require('../Middleware/authentication');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });


// ==============================
// PUBLIC ROUTES
// ==============================

// Get all foods
router.get('/', foodController.getAllFoods);

// Get featured foods
router.get('/featured', foodController.getFeaturedFoods);

// Get foods by category
router.get('/category/:category', foodController.getFoodsByCategory);

// Get single food
router.get('/:id', foodController.getFoodById);


// ==============================
// ADMIN ROUTES
// ==============================

// Create food
router.post(
  '/',
  auth.adminJWT,
  upload.single('image'),
  foodController.createFood
);

// Update food
router.put(
  '/:id',
  auth.adminJWT,
  foodController.updateFood
);

// Delete food
router.delete(
  '/:id',
  auth.adminJWT,
  foodController.deleteFood
);

module.exports = router;
