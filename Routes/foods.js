// Routes/foods.js

const express = require('express');
const router = express.Router();

const foodController = require('../Controllers/foods');
const auth = require('../Middleware/authentication');
const multer = require('multer');

const upload = multer({ dest: 'uploads/Foods/' });



router.get('/', auth.AuthJWT, foodController.getAllFoods);

// Get featured foods
router.get('/featured', auth.AuthJWT, foodController.getFeaturedFoods);

// Get foods by category
router.get('/category/:category', auth.AuthJWT, foodController.getFoodsByCategory);
router.get('/attractions/:attractionId', auth.AuthJWT, foodController.getFoodsByAttraction);
// Get single food
router.get('/:id', auth.AuthJWT, foodController.getFoodById);


// ==============================
// ADMIN ROUTES
// ==============================

// Create food
router.post(
  '/',
  auth.BothJWT,
  upload.single('image'),
  foodController.createFood
);

// Update food
router.put(
  '/:id',
  auth.BothJWT,
  foodController.updateFood
);

// Delete food
router.delete(
  '/:id',
  auth.BothJWT,
  foodController.deleteFood
);

module.exports = router;
