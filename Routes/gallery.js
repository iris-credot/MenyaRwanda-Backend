const express = require('express');
const router = express.Router();

const galleryController = require('../Controllers/gallery');
const auth = require('../Middleware/authentication');
const multer = require('multer');

const upload = multer({ dest: 'uploads/Gallery/' });
router.get('/:attractionId/gallery',auth.AuthJWT, galleryController.getGalleryByAttraction);
router.get('/gallery/:id',auth.AuthJWT, galleryController.getGalleryItemById);

// Protected routes (Owner/Admin only)
router.post(
  '/:attractionId/gallery',
  auth.BothJWT,
  upload.single('image'), // single image upload
  galleryController.addGalleryItem
);

router.put(
  '/gallery/:id',
  auth.BothJWT,
  galleryController.updateGalleryItem
);

router.delete(
  '/gallery/:id',
  auth.BothJWT,
  galleryController.deleteGalleryItem
);

// Bulk reorder (Owner/Admin only)
router.post(
  '/:attractionId/gallery/reorder',
  auth.BothJWT,
  galleryController.reorderGallery
);

// Admin only: get all gallery items across all attractions
router.get(
  '/admin/gallery',
  auth.adminJWT,
  galleryController.getAllGalleryItems
);
module.exports = router;