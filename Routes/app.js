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


//  REGISTER ROUTES


//  USER AUTH & PROFILE
Router.use('/users', userRoutes);

//  OWNERS (STAFF)
Router.use('/owners', ownerRoutes);

//  ATTRACTIONS
Router.use('/attractions', attractionRoutes);

//  REVIEWS
Router.use('/reviews', reviewRoutes);

// FAVORITES
Router.use('/favorites', favoriteRoutes);

//  NOTIFICATIONS
Router.use('/notifications', notificationRoutes);

//  CHAT (AI / assistant)
Router.use('/chat', chatRoutes);

//  EVENTS
Router.use('/events', eventRoutes);

// FOODS
console.log('foodRoutes:', foodRoutes);
console.log('type:', typeof foodRoutes);
Router.use('/foods', foodRoutes);


//  FALLBACK ROUTE

Router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = Router;