const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name']
  },
  role: {
    type: String,
    enum: ['admin', 'lead-guide', 'guide', 'user'],
    default: 'user'
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    validate: [validator.isEmail, 'Please provide a valid email address'],
    unique: true,
    lowercase: true
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same, please provide the same password'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// Saluting and hashing the password before saving it to the database
userSchema.pre('save', async function(next) {
  // check if the password does not change
  if (!this.isModified('password')) return next();

  // hashing the password
  this.password = await bcrypt.hash(this.password, 12);

  // deleting the passwordConfirm
  this.passwordConfirm = undefined;

  next();
});

// setting the password changed at functionality
userSchema.pre('save', function(next) {
  if (!this.isModified('password' || this.isNew())) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// query middleware to hide the inactive accounts
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// un-hashing the password to check it
userSchema.methods.checkPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// check if the password changed after the token has been initiated
userSchema.methods.checkPassChangedAfter = function(JWTIat) {
  if (this.passwordChangedAt) {
    const changedPass = this.passwordChangedAt.getTime() / 1000;
    return JWTIat < changedPass;
  }

  return false;
};

// creating the password reset token
userSchema.methods.createResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Hashing the reset token and saving it to the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
