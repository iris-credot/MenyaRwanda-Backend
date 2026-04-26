const asyncWrapper = require('../Middleware/async');
const Review = require('../Models/review');
const Attraction = require('../Models/attraction');
const NotFound = require('../Error/NotFound');
const BadRequest = require('../Error/BadRequest');
const { createNotification } = require('./notification');
const Owner = require('../Models/owners');
const reviewController = {

  //  CREATE OR UPDATE REVIEW
  createOrUpdateReview: asyncWrapper(async (req, res, next) => {
  const { attractionId, rating, comment } = req.body;

  if (!attractionId || !rating) {
    return next(new BadRequest('Attraction and rating are required'));
  }

  if (rating < 1 || rating > 5) {
    return next(new BadRequest('Rating must be between 1 and 5'));
  }

  const attraction = await Attraction.findById(attractionId);
  if (!attraction) {
    return next(new NotFound('Attraction not found'));
  }

  let review = await Review.findOne({
    user: req.userId,
    attractionId: attractionId
  });

  if (review) {
    review.rating = rating;
    review.comment = comment;
    await review.save();
  } else {
    review = await Review.create({
      user: req.userId,
      attractionId: attractionId,
      rating,
      comment
    });

    // Notify owner
    if (attraction.owner) {
      const owner = await Owner.findById(attraction.owner);

      if (owner) {
        await createNotification({
          user: owner.user,
          title: 'New Review ⭐',
          message: `Your attraction "${attraction.name}" received a new review.`,
          type: 'review'
        });
      }
    }
  }

  await updateAttractionRating(attractionId);

  res.status(200).json({
    success: true,
    message: 'Review submitted successfully',
    review
  });
}),

  // GET REVIEWS FOR AN ATTRACTION
  getAttractionReviews: asyncWrapper(async (req, res, next) => {
    const { attractionId } = req.params;

    const reviews = await Review.find({ attraction: attractionId })
      .populate('user', 'username image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  }),

  //  GET MY REVIEWS
  getMyReviews: asyncWrapper(async (req, res) => {
    const reviews = await Review.find({ user: req.user.id })
      .populate('attraction', 'name location');

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  }),

  //  DELETE REVIEW
  deleteReview: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return next(new NotFound('Review not found'));
    }

    // Only owner or admin
    if (
      review.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(new BadRequest('Not authorized'));
    }

    const attractionId = review.attraction;

    await review.deleteOne();

const attraction = await Attraction.findById(attractionId);
const owner = await Owner.findById(attraction.owner);

if (owner) {
  await createNotification({
    user: owner.user,
    title: 'Review Removed',
    message: `A review on your attraction was removed.`,
    type: 'review'
  });
}
    // Recalculate rating after deletion
    await updateAttractionRating(attractionId);

    res.status(200).json({
      success: true,
      message: 'Review deleted'
    });
  }),

  // GET SINGLE REVIEW
  getReviewById: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('user', 'username image')
      .populate('attraction', 'name');

    if (!review) {
      return next(new NotFound('Review not found'));
    }

    res.status(200).json({
      success: true,
      review
    });
  })

};

module.exports = reviewController;


//  HELPER FUNCTION (IMPORTANT)
async function updateAttractionRating(attractionId) {
  const reviews = await Review.find({ attraction: attractionId });

  if (reviews.length === 0) {
    await Attraction.findByIdAndUpdate(attractionId, { rating: 0 });
    return;
  }

  const total = reviews.reduce((acc, item) => acc + item.rating, 0);
  const average = total / reviews.length;

  await Attraction.findByIdAndUpdate(attractionId, {
    rating: average.toFixed(1)
  });
}