const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const dataSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const AppError = require('./utilities/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewsRouter = require('./routes/reviewsRouter');
const viewRouter = require('./routes/viewRouter');
const bookingRouter = require('./routes/bookingRouter');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// PUBLIC MIDDLEWARES
//using helmet to set some http security headers
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());

/////////////// using the expressJSON middleware to add the body prop in the req object
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// body parser: reading data from the body to req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// adding requested at
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// rate limiting middleware
const limit = rateLimiter({
  max: 100,
  windowMs: 1 * 60 * 60 * 1000,
  message: 'Too many requests, please try again later'
});

app.use('/api', limit);

// data sanitize against no sql query injection
app.use(dataSanitize());

// data sanitize against xss of inserting html code
app.use(xss());

// preventing parameter pollution
app.use(
  hpp({
    whitelist: [
      'difficulty',
      'maxGroupSize',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
      'duration'
    ]
  })
);

// serving static file from a folder
// app.use(express.static(`${__dirname}/public`));

// 2) creating the routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(
    new AppError(
      `Can't find this url (${req.originalUrl}) on this server !!`,
      404
    )
  );
});

app.use(globalErrorHandler);

module.exports = app;
