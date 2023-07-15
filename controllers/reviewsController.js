const Reviews = require('../models/reviewsModel');
const factory = require('./handlerFactory');

exports.setUserAndTour = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getReview = factory.getDocument(Reviews);
exports.getAllReviews = factory.getAllDocuments(Reviews);
exports.createReview = factory.createDocument(Reviews);
exports.updateReview = factory.updateDocument(Reviews);
exports.deleteReview = factory.deleteDocument(Reviews);
