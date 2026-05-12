const asyncWrapper = require('../Middleware/async');
const Activity = require('../Models/activities');
const Attraction = require('../Models/attraction');
const Owner = require('../Models/owners');
const NotFound = require('../Error/NotFound');
const BadRequest = require('../Error/BadRequest');
const cloudinary = require('cloudinary');

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const activityController = {
  // ===============================
  // PUBLIC ROUTES
  // ===============================

  // Get all activities (with optional filters)
  getAllActivities: asyncWrapper(async (req, res, next) => {
    const { attraction, category, limit } = req.query;
    let filter = {};

    if (attraction) filter.attraction = attraction;
    if (category) filter.category = category;

    let query = Activity.find(filter)
      .populate('attraction', 'name location')
      .sort({ createdAt: -1 });

    if (limit && !isNaN(limit)) query = query.limit(parseInt(limit));

    const activities = await query;

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  }),

  // Get activities by attraction ID (public)
  getActivitiesByAttraction: asyncWrapper(async (req, res, next) => {
    const { attractionId } = req.params;
    const { category } = req.query;

    // Verify attraction exists
    const attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    let filter = { attraction: attractionId };
    if (category) filter.category = category;

    const activities = await Activity.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  }),

  // Get single activity by ID
  getActivityById: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const activity = await Activity.findById(id).populate('attraction', 'name location');

    if (!activity) {
      return next(new NotFound('Activity not found'));
    }

    res.status(200).json({
      success: true,
      activity,
    });
  }),

  // ===============================
  // PROTECTED ROUTES (Owner/Admin only)
  // ===============================

  // Create a new activity (only owner of the attraction or admin)
  createActivity: asyncWrapper(async (req, res, next) => {
    const {
      attraction: attractionId,
      title,
      description,
      duration,
      price,
      availability,
      category,
      includes,
      schedule,
      minPeople,
      maxPeople,
    } = req.body;

    // Validate required fields
    if (!attractionId || !title || !category) {
      return next(
        new BadRequest('Missing required fields: attraction, title, and category are required')
      );
    }

    // Verify attraction exists
    const attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    // Authorization: only owner of the attraction or admin
    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest('Not authorized to add activities to this attraction'));
      }
    }

    // Handle image upload if provided
    let imageUrl = null;
    if (req.file) {
      try {
        const imageName = `ACTIVITY_${Date.now()}`;
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'MenyaRwanda/Activities',
          public_id: imageName,
        });
        imageUrl = result.secure_url;
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return next(new BadRequest('Error uploading image'));
      }
    }

    // Parse array fields if sent as JSON strings
    let parsedIncludes = includes;
    if (includes && typeof includes === 'string') {
      try {
        parsedIncludes = JSON.parse(includes);
      } catch {
        parsedIncludes = includes.split(',').map((i) => i.trim());
      }
    }

    // Create activity
    const activity = await Activity.create({
      attraction: attractionId,
      title,
      description,
      image: imageUrl,
      duration,
      price,
      availability,
      category,
      includes: parsedIncludes || [],
      schedule,
      minPeople: minPeople || 1,
      maxPeople: maxPeople || null,
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity,
    });
  }),

  // Update an existing activity (owner or admin)
  updateActivity: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Find activity
    const activity = await Activity.findById(id).populate('attraction');
    if (!activity) {
      return next(new NotFound('Activity not found'));
    }

    // Authorization
    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || activity.attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest('Not authorized to update this activity'));
      }
    }

    // Handle optional new image upload
    if (req.file) {
      try {
        const imageName = `ACTIVITY_${Date.now()}`;
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'MenyaRwanda/Activities',
          public_id: imageName,
        });
        updateData.image = result.secure_url;
      } catch (err) {
        return next(new BadRequest('Error uploading new image'));
      }
    }

    // Parse array fields if needed
    if (updateData.includes && typeof updateData.includes === 'string') {
      try {
        updateData.includes = JSON.parse(updateData.includes);
      } catch {
        updateData.includes = updateData.includes.split(',').map((i) => i.trim());
      }
    }

    const updatedActivity = await Activity.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      activity: updatedActivity,
    });
  }),

  // Delete an activity (owner or admin)
  deleteActivity: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const activity = await Activity.findById(id).populate('attraction');
    if (!activity) {
      return next(new NotFound('Activity not found'));
    }

    // Authorization
    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || activity.attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest('Not authorized to delete this activity'));
      }
    }

    // Optional: delete image from Cloudinary if needed
    // if (activity.image) {
    //   const publicId = activity.image.split('/').slice(-2).join('/').split('.')[0];
    //   await cloudinary.v2.uploader.destroy(publicId);
    // }

    await activity.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully',
    });
  }),

  // ===============================
  // EXTRA UTILITIES
  // ===============================

  // Get activities by category across all attractions
  getActivitiesByCategory: asyncWrapper(async (req, res, next) => {
    const { category } = req.params;
    const validCategories = [
      'safari',
      'boat_trip',
      'hiking',
      'cultural',
      'night_drive',
      'walking_safari',
      'fishing',
      'bird_watching',
      'photography',
      'other',
    ];
    if (!validCategories.includes(category)) {
      return next(new BadRequest('Invalid category'));
    }

    const activities = await Activity.find({ category })
      .populate('attraction', 'name location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  }),
};

module.exports = activityController;