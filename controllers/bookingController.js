const stripe = require('stripe')(process.env.STRIPE_SECRETKEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const factory = require('./handlerFactory');

const catchAsync = require('../utilities/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          }
        },
        quantity: 1
      }
    ]
  });

  // Create session as response
  res.status(200).json({
    status: 'success',
    session
  });

  next();
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);

  next();
});

exports.createBooking = factory.createDocument(Booking);
exports.getBooking = factory.getDocument(Booking);
exports.getAllBookings = factory.getAllDocuments(Booking);
exports.updateBooking = factory.updateDocument(Booking);
exports.deleteBooking = factory.deleteDocument(Booking);
