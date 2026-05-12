// Controllers/foods.js
const Food = require('../Models/foods');
const Attraction = require('../Models/attraction');
const Owner = require('../Models/owners');
const asyncWrapper = require('../Middleware/async');
const NotFound = require('../Error/NotFound');
const BadRequest = require('../Error/BadRequest');
const cloudinary = require('cloudinary');

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const foodController = {
  
  getAllFoods: asyncWrapper(async (req, res, next) => {
    const { attraction } = req.query;
    let filter = {};
    if (attraction) filter.attraction = attraction;

    const foods = await Food.find(filter)
      .populate('attraction', 'name location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      foods
    });
  }),

  // GET FEATURED FOODS (public)
  getFeaturedFoods: asyncWrapper(async (req, res, next) => {
    const foods = await Food.find({ featured: true })
      .populate('attraction', 'name location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      foods
    });
  }),

  // GET FOODS BY ATTRACTION ID (public)
  getFoodsByAttraction: asyncWrapper(async (req, res, next) => {
    const { attractionId } = req.params;

    const attractionExists = await Attraction.findById(attractionId);
    if (!attractionExists) {
      return next(new NotFound('Attraction not found'));
    }

    const foods = await Food.find({ attraction: attractionId })
      .populate('attraction', 'name location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      foods
    });
  }),

  // GET SINGLE FOOD
  getFoodById: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const food = await Food.findById(id).populate('attraction', 'name location');

    if (!food) {
      return next(new NotFound('Food not found'));
    }

    res.status(200).json({
      success: true,
      food
    });
  }),

  // GET FOODS BY CATEGORY (public, optionally filter by attraction)
  getFoodsByCategory: asyncWrapper(async (req, res, next) => {
    const { category } = req.params;
    const { attraction } = req.query;

    let filter = {
      category: { $regex: category, $options: 'i' }
    };
    if (attraction) filter.attraction = attraction;

    const foods = await Food.find(filter)
      .populate('attraction', 'name location');

    res.status(200).json({
      success: true,
      count: foods.length,
      foods
    });
  }),

  // ===============================
  // PROTECTED ROUTES (Owner/Admin)
  // ===============================

  // CREATE FOOD (owner of the attraction or admin)
  createFood: asyncWrapper(async (req, res, next) => {
    const {
      attraction: attractionId,
      name,
      description,
      category,
      featured,
      priceRange
    } = req.body;

    // Validate required fields
    if (!attractionId || !name || !description) {
      return next(new BadRequest('Missing required fields: attraction, name, and description are required'));
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
        return next(new BadRequest('Not authorized to add food items to this attraction'));
      }
    }

    // Handle image upload
    if (!req.file) {
      return next(new BadRequest('Food image is required'));
    }

    const imageName = `FOOD_${Date.now()}`;
    const uploadedImage = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'MenyaRwanda/Foods',
      public_id: imageName
    });

    const food = await Food.create({
      attraction: attractionId,
      name,
      description,
      category: category || 'Traditional',
      featured: featured || false,
      priceRange: priceRange || null,
      image: uploadedImage.secure_url
    });

    res.status(201).json({
      success: true,
      message: 'Food created successfully',
      food
    });
  }),

  // UPDATE FOOD (owner of the attraction or admin)
  updateFood: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Find food and populate attraction to check ownership
    const food = await Food.findById(id).populate('attraction');
    if (!food) {
      return next(new NotFound('Food not found'));
    }

    // Authorization
    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || food.attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest('Not authorized to update this food item'));
      }
    }

    // Optional: handle new image upload
    if (req.file) {
      const imageName = `FOOD_${Date.now()}`;
      const uploadedImage = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'Foods-MenyaRwanda',
        public_id: imageName
      });
      updateData.image = uploadedImage.secure_url;
    }

    // Remove attraction from updateData to prevent changing parent
    delete updateData.attraction;

    const updatedFood = await Food.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Food updated successfully',
      food: updatedFood
    });
  }),

  // DELETE FOOD (owner of the attraction or admin)
  deleteFood: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const food = await Food.findById(id).populate('attraction');
    if (!food) {
      return next(new NotFound('Food not found'));
    }

    // Authorization
    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || food.attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest('Not authorized to delete this food item'));
      }
    }

    // Optional: delete image from Cloudinary
    // if (food.image) {
    //   const publicId = food.image.split('/').slice(-1)[0].split('.')[0];
    //   await cloudinary.v2.uploader.destroy(`Foods-MenyaRwanda/${publicId}`);
    // }

    await food.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Food deleted successfully'
    });
  })
};

module.exports = foodController;