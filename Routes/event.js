const express = require('express');
const router = express.Router();

const eventController = require('../Controllers/events');
const auth = require('../Middleware/authentication');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });


// ==============================
// 🔓 PUBLIC ROUTES
// ==============================

// Get all events
router.get('/', eventController.getAllEvents);

// Get upcoming events
router.get('/upcoming', eventController.getUpcomingEvents);

// Get past events
router.get('/past', eventController.getPastEvents);

// Get events by date range
router.get('/range', eventController.getEventsByDateRange);

// Get events by location
router.get('/location/:location', eventController.getEventsByLocation);

// Get single event
router.get('/:id', eventController.getEventById);

// Check availability
router.get('/:id/availability', eventController.checkAvailability);


// ==============================
// 🔐 ADMIN ROUTES
// ==============================

// Create event
router.post(
  '/',
  auth.adminJWT,
  upload.single('image'),
  eventController.createEvent
);

// Update event
router.put(
  '/:id',
  auth.adminJWT,
  eventController.updateEvent
);

// Delete event
router.delete(
  '/:id',
  auth.adminJWT,
  eventController.deleteEvent
);

module.exports = router;