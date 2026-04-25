const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcryptjs'); // Changed from 'bcrypt' to 'bcryptjs'
const joi = require('joi');

const userSchema = new mongoose.Schema({
  username: { 
    type: String,
    default: ''
  },
  names: { 
    type: String,
    default: ''
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  profile: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'staff', 'admin', 'client'],
    default: 'user'
  },
  address: {
    type: String,
    default: ''
  },
  phoneNumber: { 
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    index: true,
    lowercase: true,
    validate: [isEmail, 'Please provide a valid email.']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minLength: [8, 'Must be at least 8 characters'],
    select: false
  },
  otpExpires: {
    type: Date,
    default: null
  },
  otp: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// PRE-SAVE HOOK - Hash password before saving

userSchema.pre('save', async function (next) {
  console.log('=== PRE-SAVE HOOK STARTED ===');
  console.log('Password modified:', this.isModified('password'));
  console.log('Has next function:', typeof next === 'function');
  
  if (!this.isModified('password')) {
    console.log('Password not modified, calling next');
    return next();
  }
  
  try {
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    console.log('Calling next()');
    next();
    console.log('Next called');
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});
// PRE-FINDONEANDUPDATE HOOK - Hash password if being updated
userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  
  // Check if password is being updated
  if (update.password || (update.$set && update.$set.password)) {
    try {
      const passwordToHash = update.password || update.$set.password;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(passwordToHash, salt);
      
      if (update.password) {
        update.password = hashedPassword;
      } else if (update.$set && update.$set.password) {
        update.$set.password = hashedPassword;
      }
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// STATIC METHOD - Login user
userSchema.statics.login = async function(email, password) {
  // IMPORTANT: Use .select('+password') to include password field since select: false is set
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Incorrect email');
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Incorrect password');
  }
  
  return user;
};

// INSTANCE METHOD - Compare password (alternative to static method)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// INSTANCE METHOD - Check if OTP is expired
userSchema.methods.isOtpExpired = function() {
  if (!this.otpExpires) return true;
  return new Date(this.otpExpires) < new Date();
};

// Create and export the model
const User = mongoose.model('User', userSchema);
module.exports = User;