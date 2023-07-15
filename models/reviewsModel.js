const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, 'Review can not be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must be assigned to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must be assigned to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middlewares
reviewSchema.pre(/^find/, function(next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name'
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo'
  //   });

  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

// using static method to calculate the stats of the reviews and persist it to the tour docs
reviewSchema.statics.calcStats = async tourId => {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: 'rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate({
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRatings
    });
  } else {
    await Tour.findByIdAndUpdate({
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    });
  }
};

// making the review to be done only once by the same user
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post('save', function() {
  this.constructor.calcStats(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.query = await this.findOne();

  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  await this.query.constructor.calcStats(this.query.tour);
});

const Reviews = mongoose.model('Reviews', reviewSchema);

module.exports = Reviews;
