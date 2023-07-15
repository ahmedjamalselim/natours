const AppError = require('../utilities/appError');

const handleCastErrors = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateNameError = err => {
  const message = `Duplicate name: (${
    err.keyValue.name
  }), please choose another name`;
  return new AppError(message, 404);
};

const handleValidationErrors = err => {
  const validateErrors = Object.values(err.errors).map(value => value.message);
  const message = `Validation error occurred please be noted that: ${validateErrors.join(
    '. '
  )} `;
  return new AppError(message, 404);
};

const handleWrongToken = () =>
  new AppError('Invalid Token, please login again', 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  console.log('error!!!', err.message);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // Api
  if (req.originalUrl.startsWith('/api')) {
    // Operational error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Non operational error
    console.log('Error 💥', err);
    return res.status(500).json({
      status: 'fail',
      message: 'something went wrong!!'
    });
  }

  // Rendered website
  // Operational error
  if (err.isOperational) {
    console.log('Error 💥', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    });
  }
  // Non operational error
  console.log('Error 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later...'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // handling errors in development
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
    // handling errors in production
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.name = err.name;
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrors(error);
    if (error.code === 11000) error = handleDuplicateNameError(error);
    if (error.name === 'ValidationError') error = handleValidationErrors(error);
    if (error.name === 'JsonWebTokenError') error = handleWrongToken();

    sendErrorProd(error, req, res);
  }

  next();
};
