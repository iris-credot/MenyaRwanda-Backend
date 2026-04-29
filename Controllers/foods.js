// Controllers/foods.js

const asyncWrapper = require('../Middleware/async');
const Food = require('../Models/foods');
const NotFound = require('../Error/NotFound');
const BadRequest = require('../Error/BadRequest');
const cloudinary = require('cloudinary');

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});


console.log("Food Model:", Food);
console.log("Food.create:", Food.create);
console.log("Type:", typeof Food);
const foodController = {

 
  // GET ALL FOODS
 
  getAllFoods: asyncWrapper(async (req, res, next) => {
    const foods = await Food.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      foods
    });
  }),

  
  // GET FEATURED FOODS
 
  getFeaturedFoods: asyncWrapper(async (req, res, next) => {
    const foods = await Food.find({ featured: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: foods.length,
      foods
    });
  }),

 
  // GET SINGLE FOOD
 
  getFoodById: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const food = await Food.findById(id);

    if (!food) {
      return next(new NotFound('Food not found'));
    }

    res.status(200).json({
      success: true,
      food
    });
  }),

  
  // GET FOODS BY CATEGORY
 
  getFoodsByCategory: asyncWrapper(async (req, res, next) => {
    const { category } = req.params;

    const foods = await Food.find({
      category: { $regex: category, $options: 'i' }
    });

    res.status(200).json({
      success: true,
      count: foods.length,
      foods
    });
  }),


  // CREATE FOOD (ADMIN ONLY)
 
  createFood: asyncWrapper(async (req, res, next) => {
    const { name, description, category, featured } = req.body;

    if (!name || !description) {
      return next(new BadRequest('Name and description are required'));
    }

    if (!req.file) {
      return next(new BadRequest('Food image is required'));
    }

    const imageName = `FOOD_${Date.now()}`;

    const uploadedImage = await cloudinary.v2.uploader.upload(
      req.file.path,
      {
        folder: 'Foods-MenyaRwanda',
        public_id: imageName
      }
    );

    const food = await Food.create({
      name,
      description,
      category,
      featured,
      image: uploadedImage.secure_url
    });

    res.status(201).json({
      success: true,
      message: 'Food created successfully',
      food
    });
  }),

  
  // UPDATE FOOD
  
  updateFood: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const food = await Food.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!food) {
      return next(new NotFound('Food not found'));
    }

    res.status(200).json({
      success: true,
      message: 'Food updated successfully',
      food
    });
  }),


  // DELETE FOOD
 
  deleteFood: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const food = await Food.findByIdAndDelete(id);

    if (!food) {
      return next(new NotFound('Food not found'));
    }

    res.status(200).json({
      success: true,
      message: 'Food deleted successfully'
    });
  })
};

module.exports = foodController;