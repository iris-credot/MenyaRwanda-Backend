const Gallery = require("../Models/gallery");
const asyncWrapper = require("../Middleware/async");
const Attraction = require("../Models/attraction");
const Owner = require("../Models/owners");
const NotFound = require("../Error/NotFound");
const BadRequest = require("../Error/BadRequest");
const cloudinary = require("cloudinary");

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const galleryController = {
  
  getGalleryByAttraction: asyncWrapper(async (req, res, next) => {
    const { attractionId } = req.params;

    const attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      return next(new NotFound("Attraction not found"));
    }

    const media = await Gallery.find({ attraction: attractionId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: media.length,
      media,
    });
  }),

  // Get single gallery item by its ID
  getGalleryItemById: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const item = await Gallery.findById(id).populate("attraction", "name");
    if (!item) {
      return next(new NotFound("Gallery item not found"));
    }

    res.status(200).json({
      success: true,
      item,
    });
  }),

  addGalleryItem: asyncWrapper(async (req, res, next) => {
    const { attractionId } = req.params;
    const { mediaType, caption, order, videoUrl } = req.body;

    // Validate attraction exists
    const attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      return next(new NotFound("Attraction not found"));
    }

    // Authorization
    if (req.role !== "admin") {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest("Not authorized to modify gallery for this attraction"));
      }
    }

    let url = null;
    let publicId = null;
    let thumbnail = null;

    // Handle image upload (if file provided)
    if (req.file) {
      // Image upload via Cloudinary
      const imageName = `GALLERY_${Date.now()}`;
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: `MenyaRwanda/Gallery/${attractionId}`,
        public_id: imageName,
      });
      url = result.secure_url;
      publicId = result.public_id;
      mediaType = "image";
    } 
    // Handle video URL
    else if (videoUrl && mediaType === "video") {
      url = videoUrl;
      // Optional: generate thumbnail from video URL (if needed, can use external service)
      thumbnail = req.body.thumbnail || null;
    } 
    else {
      return next(new BadRequest("Either upload an image or provide a video URL"));
    }

    // Validate order (if not provided, assign next available)
    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === null) {
      const lastItem = await Gallery.findOne({ attraction: attractionId }).sort({ order: -1 });
      finalOrder = lastItem ? lastItem.order + 1 : 0;
    }

    const newItem = await Gallery.create({
      attraction: attractionId,
      mediaType,
      url,
      thumbnail,
      caption,
      order: finalOrder,
      publicId,
    });

    res.status(201).json({
      success: true,
      message: "Gallery item added successfully",
      item: newItem,
    });
  }),

  // Update gallery item (caption, order, etc.)
  updateGalleryItem: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const { caption, order, mediaType, url, thumbnail } = req.body;

    const item = await Gallery.findById(id).populate("attraction");
    if (!item) {
      return next(new NotFound("Gallery item not found"));
    }

    // Authorization
    if (req.role !== "admin") {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || item.attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest("Not authorized to update this gallery item"));
      }
    }

    // Update fields
    if (caption !== undefined) item.caption = caption;
    if (order !== undefined) item.order = order;
    if (mediaType !== undefined) item.mediaType = mediaType;
    if (url !== undefined) item.url = url;
    if (thumbnail !== undefined) item.thumbnail = thumbnail;

    await item.save();

    res.status(200).json({
      success: true,
      message: "Gallery item updated successfully",
      item,
    });
  }),

  // Delete a gallery item (and optionally remove from Cloudinary)
  deleteGalleryItem: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const item = await Gallery.findById(id).populate("attraction");
    if (!item) {
      return next(new NotFound("Gallery item not found"));
    }

    // Authorization
    if (req.role !== "admin") {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || item.attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest("Not authorized to delete this gallery item"));
      }
    }

    // Delete from Cloudinary if it's an image
    if (item.mediaType === "image" && item.publicId) {
      try {
        await cloudinary.v2.uploader.destroy(item.publicId);
      } catch (err) {
        console.error("Cloudinary delete error:", err);
        // Continue deletion even if cloudinary fails
      }
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully",
    });
  }),

  // Bulk reorder gallery items (send array of ids with new orders)
  reorderGallery: asyncWrapper(async (req, res, next) => {
    const { attractionId } = req.params;
    const { items } = req.body; // items: [{ id: "...", order: 0 }, ...]

    if (!items || !Array.isArray(items)) {
      return next(new BadRequest("Items array is required"));
    }

    const attraction = await Attraction.findById(attractionId);
    if (!attraction) {
      return next(new NotFound("Attraction not found"));
    }

    if (req.role !== "admin") {
      const owner = await Owner.findOne({ user: req.userId });
      if (!owner || attraction.owner.toString() !== owner._id.toString()) {
        return next(new BadRequest("Not authorized to reorder gallery"));
      }
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id, attraction: attractionId },
        update: { $set: { order: item.order } },
      },
    }));

    await Gallery.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: "Gallery reordered successfully",
    });
  }),

  // ADMIN: Get all gallery items across all attractions
  getAllGalleryItems: asyncWrapper(async (req, res) => {
    const items = await Gallery.find()
      .populate("attraction", "name location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  }),
};

module.exports = galleryController;