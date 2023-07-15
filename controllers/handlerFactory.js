const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/appError');
const ApiFeatures = require('../utilities/apiFeatures');

exports.deleteDocument = Model =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('There is no document with this id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.createDocument = Model =>
  catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    if (!document) {
      return next(new AppError('There is no data: document with this id', 404));
    }

    // sending the response
    res.status(201).json({
      status: 'success',
      data: {
        data: document
      }
    });
  });

exports.updateDocument = Model =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!document) {
      return next(new AppError('There is no document with this id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: document
      }
    });
  });

exports.getDocument = (Model, populateObject) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateObject) query = query.populate(populateObject);

    const document = await query;

    if (!document) {
      return next(new AppError('There is no document with this id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: document
      }
    });
  });

exports.getAllDocuments = Model =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // EXCRETING THE QUERY
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();

    const documents = await features.query;

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        data: documents
      }
    });
  });
