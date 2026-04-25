const asyncWrapper = require('../Middleware/async');
const userModel= require('../Models/user');
const otpModel = require('../Models/otpModel'); 
const jwt = require('jsonwebtoken');
const Badrequest=require('../Error/BadRequest');
const cloudinary =require('cloudinary').v2;
const Notfound=require('../Error/NotFound');
const bcrypt = require('bcryptjs');
const { createNotification } = require('./notification');
const UnauthorizedError =require('../Error/Unauthorised');
const sendEmail = require('../Middleware/sendMail');
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
  });

const userController ={
    
    getAllUsers: asyncWrapper(async (req, res,next) => {
        const users = await userModel.find({})
        res.status(200).json({ users })
      }),
  getAllUserRole: asyncWrapper(async (req, res, next) => {
  const clients = await userModel.find({ role: 'user' });

  if (!clients || clients.length === 0) {
    return next(new Notfound('No users roles found'));
  }

  res.status(200).json({ clients });
}),

createUser: asyncWrapper(async (req, res, next) => {
  console.log('=== CREATE USER STARTED ===');
  console.log('next type at start:', typeof next);
  
  const {
    email,
    username,
    names,
    firstName,
    lastName,
    profile,
    address,
    phoneNumber,
    dateOfBirth,
    password,
    gender
  } = req.body;
  
  console.log('1. Body parsed');
  
  const emaill = email.toLowerCase();
  console.log('2. Email lowercased');
  
  const foundUser = await userModel.findOne({ email: emaill });
  console.log('3. User search completed');
  
  if (foundUser) {
    console.log('4a. User found, calling next with error');
    return next(new Badrequest("Email already in use"));
  }
  
  console.log('4b. No existing user');
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpirationDate = new Date(Date.now() + 5 * 60 * 1000);
  console.log('5. OTP generated');
  
  let imageUrl = "";
  if (req.file) {
    console.log('6. File detected');
    try {
      const images = `IMAGE_${Date.now()}`;
      const ImageCloudinary = await cloudinary.uploader.upload(req.file.path, {
        folder: 'Menya-Rwanda',
        public_id: images
      });
      imageUrl = ImageCloudinary.secure_url;
      console.log('7. Image uploaded');
    } catch (err) {
      console.error('Cloudinary error:', err);
      return next(new Badrequest('Error uploading image to Cloudinary.'));
    }
  }
  
  console.log('8. Creating new user object');
  console.log('Password type:', typeof password);
  console.log('Password length:', password?.length);
  
  // Test creating user object without saving
  const newUser = new userModel({
    username: username || '',
    firstName: firstName || '',
    lastName: lastName || '',
    names: names || '',
    image: imageUrl,
    profile: profile || '',
    address: address || '',
    phoneNumber: phoneNumber || '',
    dateOfBirth: dateOfBirth || null,
    email: emaill,
    password: password,
    gender: gender || '',
    otp: otp.toString(), // Ensure OTP is string
    otpExpires: otpExpirationDate,
  });
  
  console.log('8a. User object created successfully');
  console.log('8b. Object keys:', Object.keys(newUser.toObject()));
  
  console.log('9. About to save user');
  
  // Try-catch specifically for save
  try {
    console.log('9a. Calling newUser.save()...');
    const savedUser = await newUser.save();
    console.log('10. User saved successfully!');
    console.log('11. Saved user ID:', savedUser._id);
    
    console.log('12. Creating notification');
    try {
      await createNotification({
        user: savedUser._id,
        title: 'Welcome 🎉',
        message: 'Your account has been created successfully. Please verify your email.',
        type: 'account'
      });
      console.log('12a. Notification created');
    } catch (notifError) {
      console.error('Notification error:', notifError.message);
      // Don't fail the whole request for notification error
    }
    
    console.log('13. Preparing email');
    const emailBody = `
      Welcome to Menya-Rwanda!
      Your OTP for verification is: ${otp}
      This OTP is valid for 5 minutes.
      If you did not request this, please ignore this email.

      Best regards,
      Menya-Rwanda Team
    `;
    
    console.log('14. Sending email');
    try {
      await sendEmail(emaill, 'Menya-Rwanda System: Verify your account', emailBody);
      console.log('15. Email sent successfully');
    } catch (emailError) {
      console.error('Email error:', emailError.message);
      // Don't fail the whole request for email error
    }
    
    console.log('16. Sending success response');
    return res.status(201).json({ 
      user: savedUser, 
      message: 'User created successfully, OTP sent to email' 
    });
    
  } catch (saveError) {
    console.error('!!! SAVE ERROR !!!');
    console.error('Error name:', saveError.name);
    console.error('Error message:', saveError.message);
    console.error('Error stack:', saveError.stack);
    console.error('Complete error object:', JSON.stringify(saveError, Object.getOwnPropertyNames(saveError)));
    
    // Check if it's a validation error
    if (saveError.name === 'ValidationError') {
      const errors = Object.values(saveError.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    return next(new Badrequest(`Save failed: ${saveError.message}`));
  }
}),
      getUserById: asyncWrapper(async (req, res, next) => {
        const { id } = req.params;
        const user = await userModel.findById(id);
    
      
    
        res.status(200).json({ user });
      }),
    
    
    
   OTP: asyncWrapper(async (req, res, next) => {

  const foundUser = await userModel.findOne({ otp: req.body.otp });

  if (!foundUser) {
    return next(new UnauthorizedError('Authorization denied'));
  }

  const otpExpired = new Date(foundUser.otpExpires) < new Date();

  if (otpExpired) {
    return next(new UnauthorizedError('OTP expired'));
  }

  foundUser.verified = true;
  const savedUser = await foundUser.save();

  await createNotification({
    user: savedUser._id,
    title: 'Account Verified ✅',
    message: 'Your account has been successfully verified.',
    type: 'account'
  });

  return res.status(201).json({
    message: "User account verified!",
    user: savedUser
  });
}),

    deleteUser: asyncWrapper(async (req, res, next) => {
      const { id: userID } = req.params;
      const user = await userModel.findOneAndDelete({ _id: userID })
     
      res.status(200).json({ user })
    }),

 // ... other code in userController.js

// THIS IS THE CORRECTED FUNCTION
updateUser: asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // 1. Check if a new file was uploaded via multer.
    if (req.file) {
      try {
        console.log("FILE:", req.file);
console.log("FILE PATH:", req.file?.path);
        // 2. If yes, upload this new file to Cloudinary.
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'Menya-Rwanda', // Or your desired folder
          public_id: `PROFILE_${id}_${Date.now()}` // A unique public_id
        });

        // 3. IMPORTANT: Add the secure public URL from Cloudinary to our update data.
        updateData.image = result.secure_url;

      } catch (err) {
        console.error('Error uploading image to Cloudinary during update:', err);
        return next(new Badrequest('Error uploading new profile image.'));
      }
    }

    // 4. Find the user and update them with all the data 
    //    (text fields and potentially the new Cloudinary image URL).
    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, {
      new: true, // Return the modified document
      runValidators: true // Run schema validators
    });

    if (!updatedUser) {
      return next(new Notfound(`User not found`));
    }

    // 5. Send the fully updated user object back to the frontend.
    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
}),
 

 ForgotPassword : asyncWrapper(async (req, res, next) => {
      const foundUser = await userModel.findOne({ email: req.body.email });
      if (!foundUser) {
        return next(new Notfound(`Your email is not registered`));
      }
      // Generate token
      const token = jwt.sign({ id: foundUser.id }, process.env.SECRET_KEY, { expiresIn: "15m" });
  
      // Recording the token to the database
      await otpModel.create({
          token: token,
          user: foundUser._id,
          expirationDate: new Date(Date.now() + 5 * 60 * 1000),
      });
  
      const link = `https://bistro-pulse-front-end-k4d8.vercel.app/resetPassword/${token}`;
      const emailBody = `Click on the link bellow to reset your password\n\n${link}`;
         
      await sendEmail(req.body.email, "Bistrou-Pulse-Reset password", emailBody);
      await createNotification({
  user: foundUser._id,
  title: 'Password Reset Request',
  message: 'A password reset link has been sent to your email.',
  type: 'account'
});
  
      res.status(200).json({
          message: "We sent you a reset password link on your email!",
          link:link
         
      });
     
  }),
    ResetPassword: asyncWrapper(async (req, res, next) => {
    const { newPassword, confirm } = req.body;
  const { token } = req.params;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const user = await userModel.findById(decoded.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (newPassword !== confirm) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  user.password = newPassword;
  await user.save();
await createNotification({
  user: user._id,
  title: 'Password Updated 🔐',
  message: 'Your password has been successfully changed.',
  type: 'account'
});
  return res.status(200).json({ message: "Password reset successfully" });
}),
updatePassword : asyncWrapper(async (req, res, next) => {
  // Assuming you have middleware that authenticates the user and attaches user info to req.user
  const { userId } = req; // or req.userId, depending on your auth middleware
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Please provide both current and new passwords." });
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  // Check if the current password is correct
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Incorrect current password." });
  }

  // Set and save the new password
  user.password = newPassword;
  await user.save();
await createNotification({
  user: user._id,
  title: 'Password Changed 🔐',
  message: 'Your password has been updated successfully.',
  type: 'account'
});
  res.status(200).json({ message: "Password updated successfully." });
})
}
module.exports = userController