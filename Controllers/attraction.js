const asyncWrapper = require('../Middleware/async');
const Attraction = require('../Models/attraction');
const Owner = require('../Models/owners');
const cloudinary = require('cloudinary');
const BadRequest = require('../Error/BadRequest');
const NotFound = require('../Error/NotFound');
const { createNotification } = require('./notification');

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const attractionController = {

  // GET ALL (Admin or filtered)
  getAllAttractions: asyncWrapper(async (req, res) => {
    const { status, type, location } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const attractions = await Attraction.find(filter)
      .populate('owner', 'businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attractions.length,
      attractions
    });
  }),

  //  PUBLIC (ONLY APPROVED)
  getApprovedAttractions: asyncWrapper(async (req, res) => {
    const { type, location } = req.query;

    let filter = { status: 'approved' };
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const attractions = await Attraction.find(filter)
      .populate('owner', 'businessName')
      .sort({ rating: -1 });

    res.status(200).json({
      success: true,
      count: attractions.length,
      attractions
    });
  }),

  // GET ONE
  getAttractionById: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const attraction = await Attraction.findById(id)
      .populate('owner', 'businessName email');

    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    res.status(200).json({
      success: true,
      attraction
    });
  }),

  //  CREATE (STAFF ONLY)
  createAttraction: asyncWrapper(async (req, res, next) => {
    const {
      name,
      description,
      location,
      type,
      phone,
      email,
      openingHours,
      details
    } = req.body;

    // Find owner from logged-in user
    const owner = await Owner.findOne({ user: req.user.id });

    if (!owner) {
      return next(new BadRequest('Only staff can create attractions'));
    }

    if (!name || !location || !type) {
      return next(new BadRequest('Missing required fields'));
    }

    if (!['place', 'hotel', 'restaurant'].includes(type)) {
      return next(new BadRequest('Invalid type'));
    }

    if (!req.files || req.files.length === 0) {
      return next(new BadRequest('Upload at least one image'));
    }

    // Upload images
    const uploadedImages = [];

    for (let file of req.files) {
      const result = await cloudinary.v2.uploader.upload(file.path, {
        folder: `MenyaRwanda/Attractions/${type}`
      });

      uploadedImages.push({
        url: result.secure_url,
        public_id: result.public_id
      });
    }

    const attraction = await Attraction.create({
      name,
      description,
      location,
      type,
      phone,
      email,
      openingHours,
      details: details ? JSON.parse(details) : {},
      images: uploadedImages,
      owner: owner._id,
      user: req.user.id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Attraction created and pending approval',
      attraction
    });
  }),

  //  UPDATE (OWNER ONLY)
  updateAttraction: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const attraction = await Attraction.findById(id);
    if (!attraction) return next(new NotFound('Attraction not found'));

    const owner = await Owner.findOne({ user: req.user.id });

    if (!owner || attraction.owner.toString() !== owner._id.toString()) {
      return next(new BadRequest('Not authorized'));
    }

    const updateData = { ...req.body };

    if (updateData.details && typeof updateData.details === 'string') {
      updateData.details = JSON.parse(updateData.details);
    }

    // Upload new images
    if (req.files && req.files.length > 0) {
      const newImages = [];

      for (let file of req.files) {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: `MenyaRwanda/Attractions/${attraction.type}`
        });

        newImages.push({
          url: result.secure_url,
          public_id: result.public_id
        });
      }

      updateData.images = [...attraction.images, ...newImages];
    }

    const updated = await Attraction.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Attraction updated',
      attraction: updated
    });
  }),

  // DELETE IMAGE
  deleteAttractionImage: asyncWrapper(async (req, res, next) => {
    const { id, imageIndex } = req.params;

    const attraction = await Attraction.findById(id);
    if (!attraction) return next(new NotFound('Attraction not found'));

    const owner = await Owner.findOne({ user: req.user.id });

    if (!owner || attraction.owner.toString() !== owner._id.toString()) {
      return next(new BadRequest('Not authorized'));
    }

    const image = attraction.images[imageIndex];
    if (!image) return next(new BadRequest('Invalid image index'));

    // delete from cloudinary
    await cloudinary.v2.uploader.destroy(image.public_id);

    attraction.images.splice(imageIndex, 1);
    await attraction.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted',
      images: attraction.images
    });
  }),

  //  DELETE ATTRACTION
  deleteAttraction: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const attraction = await Attraction.findById(id);
    if (!attraction) return next(new NotFound('Attraction not found'));

    const owner = await Owner.findOne({ user: req.user.id });

    if (
      req.user.role !== 'admin' &&
      (!owner || attraction.owner.toString() !== owner._id.toString())
    ) {
      return next(new BadRequest('Not authorized'));
    }

    // delete images
    for (let img of attraction.images) {
      await cloudinary.v2.uploader.destroy(img.public_id);
    }

    await attraction.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Attraction deleted'
    });
  }),

  //  APPROVE / REJECT
 updateAttractionStatus: asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new BadRequest('Invalid status'));
  }

  const attraction = await Attraction.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!attraction) {
    return next(new NotFound('Attraction not found'));
  }

  // 🔔 SEND NOTIFICATION
  if (status === 'approved') {
    await createNotification({
      user: attraction.user,
      title: 'Listing Approved',
      message: `${attraction.name} has been approved`,
      type: 'listing_approved'
    });
  }

  if (status === 'rejected') {
    await createNotification({
      user: attraction.user,
      title: 'Listing Rejected',
      message: `${attraction.name} was rejected`,
      type: 'listing_rejected'
    });
  }

  res.status(200).json({
    success: true,
    message: `Attraction ${status}`,
    attraction
  });
}),

  //  SEARCH
  searchAttractions: asyncWrapper(async (req, res) => {
    const { query } = req.query;

    const attractions = await Attraction.find({
      status: 'approved',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    }).sort({ rating: -1 });

    res.status(200).json({
      success: true,
      count: attractions.length,
      attractions
    });
  }),

  // TOP RATED
  getTopRatedAttractions: asyncWrapper(async (req, res) => {
    const attractions = await Attraction.find({ status: 'approved' })
      .sort({ rating: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      attractions
    });
  })

};

module.exports = attractionController;