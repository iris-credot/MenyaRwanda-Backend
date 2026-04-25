const jwt = require('jsonwebtoken');

const SECRET = process.env.SECRET_KEY;

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return req.cookies.jwt;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
};

const requireAuth = {
  AuthJWT: (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.'
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(403).json({
      error: 'Invalid or expired token. Please login again.'
    });
  }

  req.userId = decoded.userId;
  req.role = decoded.role;
  req.username = decoded.username;

  next();
},

  ownerJWT: async (req, res, next) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required. Please log in.' });

    const decoded = verifyToken(token, res);
    if (!decoded) return;

    if (decoded.role !== 'staff') {
      return res.status(401).json({ error: 'You are not authorized to access this route.' });
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    req.username = decoded.username;
    next();
  },


  adminJWT: async (req, res, next) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required. Please log in.' });

    const decoded = verifyToken(token, res);
    if (!decoded) return;

    if (decoded.role !== 'admin') {
      return res.status(401).json({ error: 'You are not authorized to access this route.' });
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    req.username = decoded.username;
    next();
  },

  BothJWT: async (req, res, next) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required. Please log in.' });

    const decoded = verifyToken(token, res);
    if (!decoded) return;

    if (!['staff', 'admin'].includes(decoded.role)) {
      return res.status(401).json({ error: 'You are not authorized to access this route.' });
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    req.username = decoded.username;
    next();
  }
};

module.exports = requireAuth;
