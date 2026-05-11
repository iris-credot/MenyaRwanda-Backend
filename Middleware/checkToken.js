// Middleware/verifyToken.js (Create this file)
const jwt = require('jsonwebtoken');
const User = require('../Models/user');

const verifyToken = async (req, res, next) => {
  try {
    let token = null;
    
    // First check for token in cookies (your current method)
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
      console.log("✅ Token found in cookie");
    }
    
    // If not in cookie, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log("✅ Token found in Authorization header");
      }
    }
    
    if (!token) {
      console.log("❌ No token found in cookie or header");
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    const secret = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secret);
    console.log("✅ Token verified for user:", decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log("❌ User not found for ID:", decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
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
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = verifyToken;