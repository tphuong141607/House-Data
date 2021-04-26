/* ---------------------------- */
/*   All EXPRESS related code   */
/* ---------------------------- */
const path = require('path');
const express = require('express');
const morgan = require('morgan');

// Security related
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

// Error related
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Routes related 
const propertyRouter = require('./routes/propertyRoutes');
const cityRouter = require('./routes/cityRoutes');
const stateCodeRouter = require('./routes/Code/stateCodeRoutes');
const cityCodeRouter = require('./routes/Code/cityCodeRoutes');
const countyCodeRouter = require('./routes/Code/countyCodeRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug'); 
app.set('views', path.join(__dirname, 'views')); // view engine is called "views" in Express. Set "views" to path ./views
app.use(express.static(path.join(__dirname, 'public'))); // The browser can access static files from public dir

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Debugging middleware: user defined middlewares
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
  });

/* ---------------------------- */
/*   SECURITY MIDDLEWAREs       */
/* ---------------------------- */
// • Set security HTTP headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'",
        'https://*.cloudflare.com',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.plot.ly',
        'https://code.jquery.com',
        'https://ajax.googleapis.com',
        'data:',
      ],
      connectSrc: ["'self'", 'https://*.mapbox.com', 'https://*.plot.ly'],
      frameSrc: ["'self'", 'https://*.stripe.com', 'https://*.plot.ly'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      objectSrc: ["'none'"],
      workerSrc: ["'self'", 'data:', 'blob:'],
      childSrc: ["'self'", 'blob:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      upgradeInsecureRequests: [],
    },
  })
);

// • Limit requests: 
// 100 requests per 1 hour for the same ip address
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter); // Only use this limiter middlewars on the /api route.

// • Body parser, reading data from body into req.body
// ideally, all request info should be in the req, but express doesn't do that ==> we need a middleware: express.json()
app.use(express.json({ limit: '10kb' })); // Need this for POST request
app.use(cookieParser()); // Cookie cookieParser

// • Data sanitization against NoSQL query injection
app.use(mongoSanitize()); // filter out all NoSQL query syntax

// • Data sanitization against XSS
app.use(xss());

// • Prevent parameter pollution
// Only fields in the whitelist are allowed to be called more than 1
// Other fields, such as sort, if called multiple times, only the 1st one counts.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

/* -------------- */
/*    ROUTES      */
/* -------------- */
app.use('/', viewRouter); // templates
app.use('/api/property', propertyRouter);
app.use('/api/city', cityRouter);
app.use('/api/countyCode', countyCodeRouter);
app.use('/api/stateCode', stateCodeRouter);
app.use('/api/cityCode', cityCodeRouter);

// all = for all routes: post, get, etc.
app.all('*', (req, res, next) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  const err = new AppError(message, 404);
  next(err);
});

app.use(globalErrorHandler);

module.exports = app;
