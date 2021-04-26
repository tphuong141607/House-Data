const AppError = require('../utils/appError');


const handleValidatorErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another name!`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid token, please login again.', 401);

const handleJWTExpiredError = (err) =>
  new AppError('Login expired, please login again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    err: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational errors.
  if (err.isOperationalError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or unknown error: don't want to leak error details to clients.
  } else {
    // 1) Log error
    console.error('Unknown ERROR 🔥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      err: err,
      message: 'Something went wrong! -- Not Operational Errors.',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // Internal server error
  err.status = err.status || 'error'; // "error" for 500, everything else will be "fail"
  let error = { ...err };

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    // eslint-disable-next-line prettier/prettier
    if (err._message !== undefined && err._message.includes('validation failed')) {
      error = handleValidatorErrorDB(error);
    }
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
    sendErrorProd(error, res);
  }
  next();
};
