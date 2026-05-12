const asyncWrapper = require('../Middleware/async');
const AttractionContent = require('../Models/AttractionContent');
const Attraction = require('../Models/attraction');
const Owner = require('../Models/owners');

const BadRequest = require('../Error/BadRequest');
const NotFound = require('../Error/NotFound');

const attractionContentController = {

  // ======================================================
  // CREATE CONTENT
  // ======================================================

  createAttractionContent: asyncWrapper(async (req, res, next) => {

    const { attractionId } = req.params;

    // Check attraction
    const attraction = await Attraction.findById(attractionId);

    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    // Authorization
    if (req.role !== 'admin') {

      const owner = await Owner.findOne({
        user: req.userId
      });

      if (!owner) {
        return next(new BadRequest('Owner profile not found'));
      }

      if (
        !attraction.owner ||
        attraction.owner.toString() !== owner._id.toString()
      ) {
        return next(
          new BadRequest(
            'Not authorized to create content for this attraction'
          )
        );
      }
    }

    // Prevent duplicate content
    const existingContent = await AttractionContent.findOne({
      attraction: attractionId
    });

    if (existingContent) {
      return next(
        new BadRequest(
          'Content already exists for this attraction'
        )
      );
    }

    // Safe parser
    const parseJSON = (field) => {

      if (!field) return undefined;

      if (typeof field === 'object') {
        return field;
      }

      try {
        return JSON.parse(field);
      } catch (error) {
        throw new BadRequest('Invalid JSON format');
      }
    };

    // Create content
    const content = await AttractionContent.create({

      attraction: attractionId,

      overview: req.body.overview,
      bestTimeToVisit: req.body.bestTimeToVisit,
      weather: req.body.weather,

      location: parseJSON(req.body.location),

      gettingThere: req.body.gettingThere,
      openingHours: req.body.openingHours,
      entryFee: req.body.entryFee,

      visitorTips: parseJSON(req.body.visitorTips),
      rules: parseJSON(req.body.rules),
      highlights: parseJSON(req.body.highlights),
      importantInfo: parseJSON(req.body.importantInfo),

      statistics: parseJSON(req.body.statistics),

      contactInfo: parseJSON(req.body.contactInfo),

      coordinates: parseJSON(req.body.coordinates)

    });

    res.status(201).json({
      success: true,
      message: 'Attraction content created successfully',
      content
    });

  }),

  // ======================================================
  // UPDATE CONTENT
  // ======================================================

  updateAttractionContent: asyncWrapper(async (req, res, next) => {

    const { attractionId } = req.params;

    // Check attraction
    const attraction = await Attraction.findById(attractionId);

    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    // Authorization
    if (req.role !== 'admin') {

      const owner = await Owner.findOne({
        user: req.userId
      });

      if (!owner) {
        return next(new BadRequest('Owner profile not found'));
      }

      if (
        !attraction.owner ||
        attraction.owner.toString() !== owner._id.toString()
      ) {
        return next(
          new BadRequest(
            'Not authorized to update this attraction'
          )
        );
      }
    }

    // Existing content
    const existingContent = await AttractionContent.findOne({
      attraction: attractionId
    });

    if (!existingContent) {
      return next(
        new NotFound(
          'No content found for this attraction'
        )
      );
    }

    // Safe parser
    const parseJSON = (field) => {

      if (!field) return undefined;

      if (typeof field === 'object') {
        return field;
      }

      try {
        return JSON.parse(field);
      } catch (error) {
        throw new BadRequest('Invalid JSON format');
      }
    };

    // Update object
    const updateData = {

      overview: req.body.overview,
      bestTimeToVisit: req.body.bestTimeToVisit,
      weather: req.body.weather,

      location: parseJSON(req.body.location),

      gettingThere: req.body.gettingThere,
      openingHours: req.body.openingHours,
      entryFee: req.body.entryFee,

      visitorTips: parseJSON(req.body.visitorTips),
      rules: parseJSON(req.body.rules),
      highlights: parseJSON(req.body.highlights),
      importantInfo: parseJSON(req.body.importantInfo),

      statistics: parseJSON(req.body.statistics),

      contactInfo: parseJSON(req.body.contactInfo),

      coordinates: parseJSON(req.body.coordinates)

    };

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update
    const updatedContent = await AttractionContent.findByIdAndUpdate(
      existingContent._id,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).populate('attraction', 'name type');

    res.status(200).json({
      success: true,
      message: 'Attraction content updated successfully',
      content: updatedContent
    });

  }),

  // ======================================================
  // GET CONTENT BY ATTRACTION ID
  // ======================================================

  getContentByAttractionId: asyncWrapper(async (req, res, next) => {

    const { attractionId } = req.params;

    const attraction = await Attraction.findById(attractionId);

    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    const content = await AttractionContent.findOne({
      attraction: attractionId
    }).populate('attraction', 'name type location');

    res.status(200).json({
      success: true,
      content: content || {}
    });

  }),

  // ======================================================
  // DELETE CONTENT
  // ======================================================

  deleteAttractionContent: asyncWrapper(async (req, res, next) => {

    const { attractionId } = req.params;

    const attraction = await Attraction.findById(attractionId);

    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    // Authorization
    if (req.role !== 'admin') {

      const owner = await Owner.findOne({
        user: req.userId
      });

      if (!owner) {
        return next(new BadRequest('Owner profile not found'));
      }

      if (
        !attraction.owner ||
        attraction.owner.toString() !== owner._id.toString()
      ) {
        return next(
          new BadRequest(
            'Not authorized to delete this content'
          )
        );
      }
    }

    const deletedContent = await AttractionContent.findOneAndDelete({
      attraction: attractionId
    });

    if (!deletedContent) {
      return next(
        new NotFound(
          'No content found for this attraction'
        )
      );
    }

    res.status(200).json({
      success: true,
      message: 'Attraction content deleted successfully'
    });

  }),

  // ======================================================
  // GET ALL CONTENTS (ADMIN)
  // ======================================================

  getAllAttractionContents: asyncWrapper(async (req, res) => {

    const contents = await AttractionContent.find()
      .populate('attraction', 'name type location status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contents.length,
      contents
    });

  })

};

module.exports = attractionContentController;