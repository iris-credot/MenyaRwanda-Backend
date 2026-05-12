const express = require('express');
const router = express.Router();

const activityController = require('../Controllers/activities');
const auth = require('../Middleware/authentication');
const multer = require('multer');

const upload = multer({ dest: 'uploads/Activities/' });

router.get('/activities', auth.AuthJWT,activityController.getAllActivities);
router.get('/attractions/:attractionId/activities', auth.AuthJWT, activityController.getActivitiesByAttraction);
router.get('/activities/category/:category', auth.AuthJWT, activityController.getActivitiesByCategory);
router.get('/activities/:id', auth.AuthJWT, activityController.getActivityById);

// ===============================
// 🔐 PROTECTED ROUTES (Activities) - require authentication
// ===============================
router.post(
  '/activities',
  auth.BothJWT,
  upload.single('image'), // single image upload
  activityController.createActivity
);

router.put(
  '/activities/:id',
  auth.BothJWT,
  upload.single('image'),
  activityController.updateActivity
);

router.delete(
  '/activities/:id',
  auth.BothJWT,
  activityController.deleteActivity
);

module.exports = router;