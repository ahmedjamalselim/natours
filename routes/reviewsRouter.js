const express = require('express');
const reviewsController = require('../controllers/reviewsController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewsController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewsController.setUserAndTour,
    reviewsController.createReview
  );

router
  .route('/:id')
  .get(reviewsController.getReview)
  .patch(
    authController.protect,
    authController.restrictTo('user, admin'),
    reviewsController.updateReview
  )
  .delete(
    authController.protect,
    authController.restrictTo('user, admin'),
    reviewsController.deleteReview
  );

module.exports = router;
