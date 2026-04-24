const jwt = require('jsonwebtoken');
const asyncWrapper = require('../Middleware/async');
const User = require('../Models/user');
const Owner = require('../Models/owners');
const NotFound = require('../Error/NotFound');

const login_post = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const secret = process.env.SECRET_KEY;

  // 1. Authenticate user
  let user;
  try {
    user = await User.login(email, password);
  } catch (error) {
    return next(new NotFound('Invalid email or password'));
  }

  const { _id: userId, role } = user;

  // 2. Fetch staff profile ONLY
  let profile = null;

  if (role === 'staff') {
    profile = await Owner.findOne({ user: userId });
  }

  // 3. Generate token
  const token = jwt.sign(
    { userId, role },
    secret,
    { expiresIn: '1d' }
  );

  // 4. Set header + cookie
  res.setHeader('Authorization', `Bearer ${token}`);

  res.cookie('jwt', token, {
    httpOnly: true,
    path: '/',
    secure: false, // true in production
    sameSite: 'Strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  // 5. Send response
  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role
    },
    profile // only for staff
  });
});


//  SIMPLIFIED LOGOUT
const logout = asyncWrapper(async (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = {
  login_post,
  logout
};