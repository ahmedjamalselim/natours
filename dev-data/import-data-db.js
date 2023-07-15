const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Reviews = require('../models/reviewsModel');

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => console.log('connection to the database established....'));

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours.json`, 'utf-8')
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/data/users.json`, 'utf-8')
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/data/reviews.json`, 'utf-8')
);

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Reviews.create(reviews);
    console.log('writing data went successfully.....');
  } catch (err) {
    console.log('failed writing the data to the database XXX', err.message);
  }

  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Reviews.deleteMany();
    console.log('deleting data went successfully.....');
  } catch (err) {
    console.log('failed deleting the data from the database XXX');
  }

  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
