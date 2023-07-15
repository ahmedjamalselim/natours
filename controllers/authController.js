const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/appError');
const Email = require('../utilities/email');

// creating the jwt
const createJWT = id => {
  return jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// signing the user in and sending the jwt function
const sendToken = (user, res, statusCode) => {
  const token = createJWT(user.id);

  const cookieOptions = {
    expiresIn: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  user.active = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      token
    }
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });

  // sending the email
  const url = `${req.protocol}://${req.get('host')}/me`;
  new Email(newUser, url).sendWelcome();

  // singing in the user by sending the jwt
  const token = createJWT(newUser.id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if the email and password exist
  const user = await User.findOne({ email }).select('+password');

  // check if the email and password are correct
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('The email or password are not correct', 401));
  }

  // signing the user in and sending the jwt
  sendToken(user, res, 200);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1- check if the user has a jwt
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('Your are not logged in, please login first', 401)
    );
  }

  // 2- verify the jwt
  const decoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY);

  // 3- check if the user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to that id does no longer exist', 401)
    );
  }

  // 4- check if the user does not change the password after getting the token
  if (currentUser.checkPassChangedAfter(decoded.iat)) {
    return next(
      new AppError('The user password has changed, please login again', 401)
    );
  }

  // 5- finally the user authorized / sending the user data to the next middleware
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1- verify the jwt
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.SECRET_KEY
      );

      // 2- check if the user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3- check if the user does not change the password after getting the token
      if (currentUser.checkPassChangedAfter(decoded.iat)) {
        return next();
      }

      // 4- finally the user authorized / sending the user data to the next middleware
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// implementing the authorization
exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have access to perform this action', 403)
      );
    }

    next();
  });
};

// resting password
exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1- getting the user data
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // 2- create the reset token
  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  // 3- sending the token via email to the user

  try {
    const url = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetpassword/${resetToken}`;
    new Email(user, url).sendPasswordReset();

    // sending the response
    res.status(200).json({
      status: 'success',
      message: 'An email just sent to you'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending your email please try again')
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // check if there is a token and it is valid
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('The token is invalid or it has expired'));
  }

  // setting the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  // signing the user in and sending the jwt
  sendToken(user, res, 200);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // selecting the user
  const user = await User.findById(req.user.id).select('+password');

  // checking the password
  if (!(await user.checkPassword(req.body.password, user.password))) {
    return next(new AppError('The entered password is not correct', 401));
  }

  // updating the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // signing the user in and sending the jwt
  sendToken(user, res, 200);
});
