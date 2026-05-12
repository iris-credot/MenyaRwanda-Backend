
const express = require('express');
const router = express.Router();

const auth = require('../Middleware/authentication');
const travelInfoController = require('../Controllers/travelInfo');


router.get('/:attractionId/travel-info', auth.AuthJWT,travelInfoController.getTravelInfoByAttraction);

router.post('/:attractionId/travel-info', auth.BothJWT, travelInfoController.upsertTravelInfo);
router.delete('/:attractionId/travel-info', auth.BothJWT, travelInfoController.deleteTravelInfo);
router.get('/travel-info/:id', auth.AuthJWT, travelInfoController.getTravelInfoById);
router.get('/admin/travel-info', auth.adminJWT, travelInfoController.getAllTravelInfo);
module.exports = router;