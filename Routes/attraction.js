const express = require('express');
const router = express.Router();

const attractionController = require('../Controllers/attraction');
const auth = require('../Middleware/authentication');
const multer = require('multer');

// ===============================
// 📦 MULTER CONFIG (MULTIPLE FILES)
// ===============================
const storage = multer.diskStorage({
  destination: 'Uploads/Attractions/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// ===============================
// 🌍 PUBLIC ROUTES
// ===============================

// Get approved attractions (public)
router.get('/approved', attractionController.getApprovedAttractions);

// Search
router.get('/search', attractionController.searchAttractions);

// Top rated
router.get('/top', attractionController.getTopRatedAttractions);

// Get single attraction
router.get('/:id', attractionController.getAttractionById);


// ===============================
// 🔐 PROTECTED ROUTES
// ===============================

// Get all (admin / filtered)
router.get('/', auth.adminJWT, attractionController.getAllAttractions);

// Create attraction (STAFF)
router.post(
  '/create',
  auth.AuthJWT,
  upload.array('images'), // 👈 MULTIPLE FILES
  attractionController.createAttraction
);

// Update attraction (OWNER)
router.put(
  '/update/:id',
  auth.AuthJWT,
  upload.array('images'),
  attractionController.updateAttraction
);

// Delete image
router.delete(
  '/image/:id/:imageIndex',
  auth.AuthJWT,
  attractionController.deleteAttractionImage
);

// Delete attraction
router.delete(
  '/delete/:id',
  auth.BothJWT, // admin OR owner
  attractionController.deleteAttraction
);

// Approve / Reject (ADMIN ONLY)
router.put(
  '/status/:id',
  auth.adminJWT,
  attractionController.updateAttractionStatus
);

module.exports = router;