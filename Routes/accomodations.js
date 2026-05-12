const express = require('express');
const router = express.Router();

const accommodationController = require('../Controllers/accomodations');
const auth = require('../Middleware/authentication');
const multer = require('multer');

// =====================
// MULTER
// =====================
const storage = multer.diskStorage({
  destination: 'Uploads/Accommodations/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });


router.get('/', auth.AuthJWT,accommodationController.getAllAccommodations);
router.get('/:id', auth.AuthJWT, accommodationController.getAccommodationById);
router.get('/attraction/:attractionId', auth.AuthJWT, accommodationController.getByAttraction);

// Protected
router.post(
  '/create',
  auth.BothJWT,
  upload.array('images'),
  accommodationController.createAccommodation
);

router.put(
  '/update/:id',
  auth.BothJWT,
  upload.array('images'),
  accommodationController.updateAccommodation
);

router.delete(
  '/delete/:id',
  auth.BothJWT,
  accommodationController.deleteAccommodation
);

module.exports = router;