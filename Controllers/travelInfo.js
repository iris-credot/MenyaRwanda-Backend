const TravelInfo = require('../Models/travelInfo');
const asyncWrapper = require('../Middleware/async');
const Attraction = require('../Models/attraction');
const Owner = require('../Models/owners');
const NotFound = require('../Error/NotFound');
const BadRequest = require('../Error/BadRequest');

const travelInfoController = {

  getTravelInfoByAttraction: asyncWrapper(async (req, res, next) => {
    const { attractionId } = req.params;

    const attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    const travelInfo = await TravelInfo.findOne({ attraction: attractionId });

    res.status(200).json({
      success: true,
      travelInfo: travelInfo || null,
    });
  }),

  // ✅ NEW: Get travel info by its own document ID (public)
  getTravelInfoById: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const travelInfo = await TravelInfo.findById(id).populate('attraction', 'name location');

    if (!travelInfo) {
      return next(new NotFound('Travel info not found'));
    }

    res.status(200).json({
      success: true,
      travelInfo,
    });
  }),

  upsertTravelInfo: asyncWrapper(async (req, res, next) => {
    const { attractionId } = req.params;
    const {
      nearestCity,
      distanceFromKigali,
      transportOptions,
      emergencyContacts,
      accessibility,
      recommendedStayDuration,
      tips,
      rules,
    } = req.body;

    const attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest('Not authorized to modify travel info for this attraction'));
      }
    }

    const parseArray = (value) => {
      if (!value) return undefined;
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value.split(',').map(item => item.trim());
        }
      }
      return undefined;
    };

    const updateData = {
      nearestCity,
      distanceFromKigali,
      transportOptions: parseArray(transportOptions),
      emergencyContacts: parseArray(emergencyContacts),
      accessibility,
      recommendedStayDuration,
      tips: parseArray(tips),
      rules: parseArray(rules),
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const travelInfo = await TravelInfo.findOneAndUpdate(
      { attraction: attractionId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Travel information saved successfully',
      travelInfo,
    });
  }),

  // Delete travel info for an attraction
  deleteTravelInfo: asyncWrapper(async (req, res, next) => {
    const { attractionId } = req.params;

    const attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      return next(new NotFound('Attraction not found'));
    }

    if (req.role !== 'admin') {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest('Not authorized to delete travel info for this attraction'));
      }
    }

    const travelInfo = await TravelInfo.findOneAndDelete({ attraction: attractionId });
    if (!travelInfo) {
      return next(new NotFound('No travel info found for this attraction'));
    }

    res.status(200).json({
      success: true,
      message: 'Travel information deleted successfully',
    });
  }),

  // ADMIN: get all travel info records
  getAllTravelInfo: asyncWrapper(async (req, res) => {
    const travelInfos = await TravelInfo.find()
      .populate('attraction', 'name type location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: travelInfos.length,
      travelInfos,
    });
  }),
};

module.exports = travelInfoController;