const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// handling the uncaught exceptions
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION, SHUTTING DOWN......');
  console.log(err.name, err.message);

  process.exit(1);
});

const app = require('./app');

// 2) connecting to the database
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
  .then(() => console.log('Connection to database established...'));

// 1) create the server
const port = process.env.PORT || 3000;

const server = app.listen(port, (req, res) => {
  console.log(`The server starts listening on port ${port}...`);
});

// handling the unhandled rejections
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION, SHUTTING DOWN .....');

  server.close(() => {
    process.exit(1);
  });
});
