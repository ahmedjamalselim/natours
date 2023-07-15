const slugify = require('slugify');
const mongoose = require('mongoose');

// creating the schema
const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour Must Has A Name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must not exceed 40 characters'],
      minLength: [10, 'A tour name must has at least 10 characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A Tour Must Has A Duration'],
      max: [15, 'A duration must not exceed 15']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour Must Has A Group Size']
    },
    difficulty: {
      type: String,
      required: [true, 'A Tour Must Has A Difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A difficulty must be easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1.0, 'A ratings must be at least one'],
      max: [5.0, 'A ratings must be at max five'],
      set: value => Math.round(value * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A Tour Must Has A Price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(value) {
          return value < this.price;
        },
        message:
          'The discount price ({VALUE}) must be less than the original price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A Tour Must Has A Summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour Must Has A Cover Image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // to hide it from the user
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// using indexes to help fastening the searching process
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual property to calculate duration in weeks
tourSchema.virtual('durationInWeeks').get(function() {
  return this.duration / 7;
});

// Virtual population
tourSchema.virtual('reviews', {
  ref: 'Reviews',
  foreignField: 'tour',
  localField: '_id'
});

// Document middleware
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name);
  next();
});

// Query middleware
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

tourSchema.pre(/^find/, function(next) {
  this.startDate = Date.now();

  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`query took ${Date.now() - this.startDate} milliseconds`);
  next();
});

// // Aggregation middleware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

// creating the model out of the schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
