// Middleware/verifyToken.js
const jwt = require('jsonwebtoken');
const User = require('../Models/user');

const verifyToken = async (req, res, next) => {
  try {
    // Get token from cookie (since your login sets it in cookie)
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    // Verify token using your secret key
    const secret = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secret);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = verifyToken;