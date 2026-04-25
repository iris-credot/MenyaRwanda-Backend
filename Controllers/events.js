const asyncWrapper = require('../Middleware/async');
const Event = require('../Models/events');
const NotFound = require('../Error/NotFound');
const BadRequest = require('../Error/BadRequest');
const cloudinary = require('cloudinary');

cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const eventController = {
  // Get all events
  getAllEvents: asyncWrapper(async (req, res, next) => {
    const events = await Event.find()
      .sort({ date: 1 }); // Sort by date ascending (upcoming events first)
    
    res.status(200).json({ 
      success: true,
      count: events.length,
      events 
    });
  }),

  // Get upcoming events (today and future)
  getUpcomingEvents: asyncWrapper(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const events = await Event.find({
      date: { $gte: today }
    }).sort({ date: 1 });
    
    res.status(200).json({ 
      success: true,
      count: events.length,
      events 
    });
  }),

  // Get past events
  getPastEvents: asyncWrapper(async (req, res, next) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const events = await Event.find({
      date: { $lt: today }
    }).sort({ date: -1 }); // Descending (most recent first)
    
    res.status(200).json({ 
      success: true,
      count: events.length,
      events 
    });
  }),

  // Get a single event by ID
  getEventById: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const event = await Event.findById(id);
    
    if (!event) {
      return next(new NotFound('Event not found'));
    }
    
    res.status(200).json({ 
      success: true,
      event 
    });
  }),

  // Get events by date range
  getEventsByDateRange: asyncWrapper(async (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return next(new BadRequest('Please provide both startDate and endDate'));
    }
    
    const events = await Event.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });
    
    res.status(200).json({ 
      success: true,
      count: events.length,
      events 
    });
  }),

  // Create a new event
   // Create a new event with image upload
  createEvent: asyncWrapper(async (req, res, next) => {
    const {
      title,
      description,
      location,
      date,
      capacity,
      price
    } = req.body;

    // Validate required fields
    if (!title || !description || !location || !date) {
      return next(new BadRequest('Missing required fields: title, description, location, and date are required'));
    }

    // Validate date is not in the past
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return next(new BadRequest('Cannot create an event in the past'));
    }

    // Check if an image file was uploaded
    if (!req.file) {
      return next(new BadRequest('An event image is required.'));
    }

    const imageName = `EVENT_${Date.now()}`;
    
    try {
      // Upload image to Cloudinary
      const imageCloudinary = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'Events-MenyaRwanda',
        public_id: imageName
      });

      // Create the new event
      const newEvent = await Event.create({
        title,
        description,
        location,
        date: eventDate,
        image: imageCloudinary.secure_url,
        capacity: capacity || null,
        price: price !== undefined ? price : 0
      });
console.log("Event =", Event);
console.log("Event type =", typeof Event);
console.log("Event.create =", Event?.create);
      res.status(201).json({ 
        success: true,
        message: 'Event created successfully',
        event: newEvent 
      });

    } catch (err) {
      console.error('Error during event creation:', err);
        console.error('🔥 FULL EVENT ERROR:', err);
  console.error('🔥 ERROR MESSAGE:', err.message);
  console.error('🔥 STACK:', err.stack);

      // Check if the error is from Cloudinary
      if (err.http_code && err.http_code === 400) {
        return next(new BadRequest('Error uploading image to Cloudinary.'));
      }
      return next(new BadRequest('An error occurred while creating the event.'));
    }
  }),

  // Update an event
  updateEvent: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If date is being updated, validate it
    if (updateData.date) {
      const newDate = new Date(updateData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (newDate < today) {
        return next(new BadRequest('Cannot update event to a past date'));
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id, 
      updateData, 
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedEvent) {
      return next(new NotFound('Event not found'));
    }

    res.status(200).json({ 
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent 
    });
  }),

  // Delete an event
  deleteEvent: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(id);
    
    if (!deletedEvent) {
      return next(new NotFound('Event not found'));
    }

    res.status(200).json({ 
      success: true,
      message: 'Event deleted successfully',
      event: deletedEvent 
    });
  }),

  // Check event availability (if capacity exists)
  checkAvailability: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const event = await Event.findById(id);
    
    if (!event) {
      return next(new NotFound('Event not found'));
    }

    // This would typically check against registrations
    // For now, just return capacity info
    res.status(200).json({ 
      success: true,
      eventId: event._id,
      title: event.title,
      capacity: event.capacity || 'Unlimited',
      isAvailable: event.capacity ? event.capacity > 0 : true,
      price: event.price
    });
  }),

  // Get events by location
  getEventsByLocation: asyncWrapper(async (req, res, next) => {
    const { location } = req.params;
    
    const events = await Event.find({
      location: { $regex: location, $options: 'i' } // Case-insensitive search
    }).sort({ date: 1 });
    
    res.status(200).json({ 
      success: true,
      count: events.length,
      events 
    });
  })
};

module.exports = eventController;