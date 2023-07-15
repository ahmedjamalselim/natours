const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewsRouter = require('../routes/reviewsRouter');

const router = express.Router();

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getNearestTours);

router.use('/:tourId/reviews', reviewsRouter);

router
  .route('/top-5-cheap')
  .get(tourController.getTopCheapTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getToursStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
