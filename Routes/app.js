const express = require('express');
const Router = express.Router();

// ===============================
// 📦 IMPORT ROUTES
// ===============================
const userRoutes = require('./user');
const ownerRoutes = require('./owner');
const attractionRoutes = require('./attraction');
const reviewRoutes = require('./review');
const favoriteRoutes = require('./favorite');
const notificationRoutes = require('./notification');
const chatRoutes = require('./chat');
const eventRoutes = require('./event');
const foodRoutes = require('./foods');
const aiChatRoutes = require('./aiChat');
const debugRoutes = require('./debug');
const attractionContentRoutes = require('./attractionContent');
const accommodationRoutes = require('./accomodations');
const activityRoutes = require('./activities');
const travelInfoRoutes = require('./travelInfo');
const galleryRoutes = require('./gallery');
//  REGISTER ROUTES

Router.use('/ai', aiChatRoutes);
Router.use('/debug', debugRoutes);
Router.use('/attraction-content', attractionContentRoutes);
Router.use('/travel-info', travelInfoRoutes);
Router.use('/accommodations', accommodationRoutes);
Router.use('/activities', activityRoutes);
Router.use('/users', userRoutes);
Router.use('/owners', ownerRoutes);
Router.use('/attractions', attractionRoutes);
Router.use('/gallery', galleryRoutes);
Router.use('/reviews', reviewRoutes);
Router.use('/favorites', favoriteRoutes);
Router.use('/notifications', notificationRoutes);
Router.use('/chat', chatRoutes);
Router.use('/events', eventRoutes);
Router.use('/foods', foodRoutes);


//  FALLBACK ROUTE

Router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = Router;