const asyncWrapper = require('../Middleware/async');
const Owner = require('../Models/owners');
const User = require('../Models/user');
const Attraction = require('../Models/attraction');
const NotFound = require('../Error/NotFound');
const BadRequest = require('../Error/BadRequest');
const sendEmail = require('../Middleware/sendMail');

const ownerController = {

  // Get all owners
  getAllOwners: asyncWrapper(async (req, res) => {
    const owners = await Owner.find().populate('user');
    res.status(200).json({ owners });
  }),

  //  Get owner by ID
  getOwnerById: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const owner = await Owner.findById(id).populate('user');
    if (!owner) {
      return next(new NotFound('Owner not found'));
    }

    res.status(200).json({ owner });
  }),

  //  Get logged-in owner's profile
  getMyOwnerProfile: asyncWrapper(async (req, res, next) => {
    const owner = await Owner.findOne({ user: req.userId }).populate('user');

    if (!owner) {
      return next(new NotFound('Owner profile not found'));
    }

    res.status(200).json({ owner });
  }),
getOwnerListings: asyncWrapper(async (req, res, next) => {
  const { ownerId } = req.params;

  // 1. Check if owner exists
  const owner = await Owner.findById(ownerId);
  if (!owner) {
    return next(new NotFound('Owner not found'));
  }

  // 2. Get all attractions belonging to this owner
  const listings = await Attraction.find({ owner: ownerId }).populate('owner', 'businessName').sort({ createdAt: -1 });

  res.status(200).json({
    count: listings.length,
    listings
  });
}),
  //  Get owner by user ID
  getOwnerByUserId: asyncWrapper(async (req, res, next) => {
    const { userId } = req.params;

    const owner = await Owner.findOne({ user: userId }).populate('user');
    if (!owner) {
      return next(new NotFound('Owner not found'));
    }

    res.status(200).json({ owner });
  }),

  //  Create Owner (ADMIN ONLY)
 createOwner: asyncWrapper(async (req, res, next) => {
  // Only get the userId and owner-specific info from the request.
  const { userId, businessName,plainTextPassword } = req.body;

  // 1. Validate that you have the necessary ID
  if (!userId ) {
    return next(new BadRequest('userId is required'));
  }

  // 2. Find the user. This is the source of truth for email.
  const user = await User.findById(userId);
  if (!user) {
    return next(new BadRequest('User not found'));
  }

  // 3. Check if an owner profile already exists for this user.
  // This query is now on the `user` field in the owner schema.
  const existingOwner = await Owner.findOne({ user: userId });
  if (existingOwner) {
    return next(new BadRequest('Staff profile already exists for this user'));
  }

  // 4. Create the new owner profile.
  // Notice we are NOT passing email or password. They don't exist in the schema anymore.
  let newOwner;
  try {
    newOwner = await Owner.create({
      user: userId, // Link to the user document
      businessName,
      plainTextPassword
    });
  } catch (error) {
    // This will now catch other potential errors, like if the userId is invalid
    return next(new BadRequest(error.message));
  }
   user.role = 'staff';
   user.verified = true;
  await user.save();

  // 5. Send a welcome email using the RELIABLE email from the user object
  const targetEmail = user.email;
 // Get email from the user, NOT req.body
  const emailBody = `
    Welcome to Menya-Rwanda!

    Your Business profile has been created. You can log in with your credentials for the email: ${targetEmail} and password: ${plainTextPassword} .

    Best regards,
    Menya-Rwanda Team
  `;

  try {
    await sendEmail(targetEmail, "Menya-Rwanda System: Your Business Profile is Ready", emailBody);
  } catch (error) {
    console.error("Failed to send email:", error.message);
  }

  // 6. Send the successful response
  res.status(201).json({
    message: 'Owner created successfully and email sent',
    owner: newOwner
  });
}),
  //  Update owner + linked user
  updateOwner: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const { businessName, user: userData } = req.body;

    const owner = await Owner.findById(id);
    if (!owner) {
      return next(new NotFound('Owner not found'));
    }

    // Update owner fields
    if (businessName) {
      owner.businessName = businessName;
      await owner.save();
    }

    // Update linked user
    if (userData) {
      await User.findByIdAndUpdate(owner.user, userData, {
        new: true,
        runValidators: true
      });
    }

    const updatedOwner = await Owner.findById(id).populate('user');

    res.status(200).json({
      message: 'Owner updated successfully',
      owner: updatedOwner
    });
  }),

  //  Delete owner
  deleteOwner: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const owner = await Owner.findById(id);
    if (!owner) {
      return next(new NotFound('Owner not found'));
    }

    // Optional: revert user role
    await User.findByIdAndUpdate(owner.user, { role: 'user' });

    await owner.deleteOne();

    res.status(200).json({
      message: 'Owner deleted successfully'
    });
  })

};

module.exports = ownerController;