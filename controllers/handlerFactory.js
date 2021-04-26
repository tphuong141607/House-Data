const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Takes in the param Model and returns a function
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { body } = req;
    const document = await Model.findByIdAndDelete(id, body);

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    } 

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password update. Please use /updateMyPassword',
          400
        )
      );
    }

    // findByIdAndUpdate -- all the save middlewares are not run
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: document },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, _next) => {
    // console.log(req.body);
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { data: newDoc },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    if (populateOptions) query.populate(populateOptions);
    const document = await query;

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { data: document },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, _next) => {
    // To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // 1. BUILD THE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // 2. EXECUTE THE QUERY
    // const documents = await features.query.explain() to see STATS...
    const documents = await features.query;

    // 3. SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: { data: documents },
    });
  });
