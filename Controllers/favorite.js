const asyncWrapper = require('../Middleware/async');
const Favorite = require('../Models/favorite');
const Attraction = require('../Models/attraction');
const NotFound = require('../Error/NotFound');
const BadRequest = require('../Error/BadRequest');

const favoriteController = {

  //  ADD TO FAVORITES
 addFavorite: asyncWrapper(async (req, res, next) => {
  const { attractionId } = req.body;

  if (!attractionId) {
    return next(new BadRequest('Attraction ID is required'));
  }

  const attraction = await Attraction.findById(attractionId);
  if (!attraction) {
    return next(new NotFound('Attraction not found'));
  }

  try {
    const favorite = await Favorite.create({
      user: req.userId,          // ✅ FIXED
      attractionId: attractionId // ✅ FIXED
    });

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      favorite
    });

  } catch (err) {
    if (err.code === 11000) {
      return next(new BadRequest('Already in favorites'));
    }
    throw err;
  }
}),

  //  REMOVE FROM FAVORITES
 removeFavorite: asyncWrapper(async (req, res, next) => {
  const { attractionId } = req.params;

  const favorite = await Favorite.findOneAndDelete({
    user: req.userId,          // ✅ FIX
    attractionId: attractionId // ✅ FIX
  });

  if (!favorite) {
    return next(new NotFound('Favorite not found'));
  }

  res.status(200).json({
    success: true,
    message: 'Removed from favorites'
  });
}),

  //  TOGGLE FAVORITE (BEST FOR FRONTEND)
 toggleFavorite: asyncWrapper(async (req, res, next) => {
  const { attractionId } = req.body;

  if (!attractionId) {
    return next(new BadRequest('Attraction ID is required'));
  }

  const existing = await Favorite.findOne({
    user: req.userId,          // ✅ FIX
    attractionId: attractionId // ✅ FIX
  });

  if (existing) {
    await existing.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Removed from favorites',
      favorited: false
    });
  }

  await Favorite.create({
    user: req.userId,          // ✅ FIX
    attractionId: attractionId // ✅ FIX
  });

  res.status(200).json({
    success: true,
    message: 'Added to favorites',
    favorited: true
  });
}),

  //  GET MY FAVORITES
  getMyFavorites: asyncWrapper(async (req, res) => {
  const favorites = await Favorite.find({ user: req.userId }) // ✅ FIX
    .populate({
      path: 'attractionId',         // ✅ FIX
      match: { status: 'approved' }
    })
    .sort({ createdAt: -1 });

  const cleaned = favorites.filter(f => f.attractionId !== null);

  res.status(200).json({
    success: true,
    count: cleaned.length,
    favorites: cleaned
  });
}),

  //  CHECK IF FAVORITED (VERY USEFUL)
 isFavorited: asyncWrapper(async (req, res) => {
  const { attractionId } = req.params;

  const exists = await Favorite.exists({
    user: req.userId,          // ✅ FIX
    attractionId: attractionId // ✅ FIX
  });

  res.status(200).json({
    success: true,
    favorited: !!exists
  });
}),

};

module.exports = favoriteController;