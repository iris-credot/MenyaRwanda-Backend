const asyncWrapper = require('../Middleware/async');
const Accommodation = require('../Models/accommodation');
const Attraction = require('../Models/attraction');
const Owner = require('../Models/owners');

const cloudinary = require('cloudinary');

const BadRequest = require('../Error/BadRequest');
const NotFound = require('../Error/NotFound');

// ==============================
// CLOUDINARY CONFIG (if not global)
// ==============================
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const accommodationController = {

  // ======================================================
  // CREATE ACCOMMODATION
  // ======================================================
  createAccommodation: asyncWrapper(async (req, res, next) => {

    const {
      name,
      description,
      pricePerNight,
      currency,
      type, // hotel, lodge, resort, guesthouse
      amenities,
      location,
      attractionId,
      contactInfo
    } = req.body;

    if (!name || !pricePerNight || !type || !attractionId) {
      return next(new BadRequest('Missing required fields'));
    }

    // Check attraction exists
    const attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    // Authorization (owner or admin)
    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });

      if (!owner) {
        return next(new BadRequest('Owner profile not found'));
      }

      if (
        !attraction.owner ||
        attraction.owner.toString() !== owner._id.toString()
      ) {
        return next(new BadRequest('Not authorized'));
      }
    }

    // Upload images
    const images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: 'MenyaRwanda/Accommodations'
        });

        images.push(result.secure_url);
      }
    }

    const accommodation = await Accommodation.create({
      name,
      description,
      pricePerNight,
      currency: currency || 'USD',
      type,
      amenities: amenities ? JSON.parse(amenities) : [],
      location: location ? JSON.parse(location) : {},
      attraction: attractionId,
      contactInfo: contactInfo ? JSON.parse(contactInfo) : {},
      images,
      owner: req.role === 'admin' ? req.body.owner : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Accommodation created successfully',
      accommodation
    });

  }),

  // ======================================================
  // GET ALL ACCOMMODATIONS
  // ======================================================
  getAllAccommodations: asyncWrapper(async (req, res) => {

    const { type, attractionId, minPrice, maxPrice } = req.query;

    let filter = {};

    if (type) filter.type = type;
    if (attractionId) filter.attraction = attractionId;

    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    const accommodations = await Accommodation.find(filter)
      .populate('attraction', 'name location')
      .populate('owner', 'businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: accommodations.length,
      accommodations
    });

  }),

  // ======================================================
  // GET SINGLE
  // ======================================================
  getAccommodationById: asyncWrapper(async (req, res, next) => {

    const { id } = req.params;

    const accommodation = await Accommodation.findById(id)
      .populate('attraction', 'name location')
      .populate('owner', 'businessName');

    if (!accommodation) {
      return next(new NotFound('Accommodation not found'));
    }

    res.status(200).json({
      success: true,
      accommodation
    });

  }),

  // ======================================================
  // UPDATE
  // ======================================================
  updateAccommodation: asyncWrapper(async (req, res, next) => {

    const { id } = req.params;

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return next(new NotFound('Accommodation not found'));
    }

    // Authorization
    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });

      if (!owner || accommodation.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest('Not authorized'));
      }
    }

    const updateData = { ...req.body };

    if (updateData.amenities) {
      updateData.amenities = JSON.parse(updateData.amenities);
    }

    if (updateData.location) {
      updateData.location = JSON.parse(updateData.location);
    }

    if (updateData.contactInfo) {
      updateData.contactInfo = JSON.parse(updateData.contactInfo);
    }

    // Upload new images if any
    if (req.files && req.files.length > 0) {
      const newImages = [];

      for (const file of req.files) {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: 'MenyaRwanda/Accommodations'
        });

        newImages.push(result.secure_url);
      }

      updateData.images = [
        ...accommodation.images,
        ...newImages
      ];
    }

    const updated = await Accommodation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Accommodation updated successfully',
      accommodation: updated
    });

  }),

  // ======================================================
  // DELETE
  // ======================================================
  deleteAccommodation: asyncWrapper(async (req, res, next) => {

    const { id } = req.params;

    const accommodation = await Accommodation.findById(id);

    if (!accommodation) {
      return next(new NotFound('Accommodation not found'));
    }

    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });

      if (!owner || accommodation.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest('Not authorized'));
      }
    }

    await accommodation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Accommodation deleted successfully'
    });

  }),

  // ======================================================
  // GET BY ATTRACTION
  // ======================================================
  getByAttraction: asyncWrapper(async (req, res) => {

    const { attractionId } = req.params;

    const accommodations = await Accommodation.find({
      attraction: attractionId
    });

    res.status(200).json({
      success: true,
      count: accommodations.length,
      accommodations
    });

  })

};

module.exports = accommodationController;