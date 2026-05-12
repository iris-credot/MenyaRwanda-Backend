const express = require('express');

const router = express.Router();

const attractionContentController = require('../Controllers/attractionContent');

const auth = require('../Middleware/authentication');




router.get(
  '/:attractionId/content', auth.AuthJWT,
  attractionContentController.getContentByAttractionId
);


router.post(
  '/:attractionId/content',
  auth.BothJWT,
  attractionContentController.createAttractionContent
);


router.patch(
  '/:attractionId/content',
  auth.BothJWT,
  attractionContentController.updateAttractionContent
);



router.delete(
  '/:attractionId/content',
  auth.BothJWT,
  attractionContentController.deleteAttractionContent
);



router.get(
  '/admin/contents',
  auth.adminJWT,
  attractionContentController.getAllAttractionContents
);


module.exports = router;