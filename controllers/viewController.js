const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');

const csp =
  "default-src 'self' https://js.stripe.com/v3/ https://cdnjs.cloudflare.com https://api.mapbox.com; base-uri 'self'; block-all-mixed-content; connect-src 'self' https://js.stripe.com/v3/ https://cdnjs.cloudflare.com/ https://*.mapbox.com/; font-src 'self' https://fonts.google.com/ https: data:;frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self' https://js.stripe.com/v3/ https://cdnjs.cloudflare.com/ https://api.mapbox.com/ blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;";

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();

  res
    .status(200)
    .set('Content-Security-Policy', csp)
    .render('overview', {
      title: 'All Tours',
      tours
    });
});

exports.alerts = (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'booking')
    res.locals.alert =
      'Your booking was successful, please check your email.. if your booking does not show up here immediately please check again later';

  next();
};

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({
      path: 'reviews',
      fields: 'review rating user'
    })
    .populate('guides');

  if (!tour) {
    return next(new AppError('This tour does not found...', 404));
  }

  res
    .status(200)
    .set('Content-Security-Policy', csp)
    .render('tour', {
      title: 'The Forest Hiker',
      tour
    });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', csp)
    .render('login', {
      title: 'Log into your account'
    });
};

exports.getSignupForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', csp)
    .render('signup', {
      title: 'Create a new account'
    });
};

exports.getAccount = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', csp)
    .render('account', {
      title: 'Your account'
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // finding all the bookings with the user id
  const bookings = await Booking.find({ user: req.user.id });

  // finding the tour ids
  const toursId = bookings.map(el => el.tour);

  // getting all the corresponding tours
  const tours = await Tour.find({ _id: { $in: toursId } });

  res
    .status(200)
    .set('Content-Security-Policy', csp)
    .render('overview', {
      title: 'My Tours',
      tours
    });
});
