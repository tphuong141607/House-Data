/* ----------------------- */
/*    Only SETUP CODE      */
/* ----------------------- */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// It's a good practice to handle all errors where they occur... However, it's impossible to catch all errors.
// When we have uncaught exceptions (synchronous errors), the process object will emit an event named uncaughtException
process.on('uncaughtException', err => {
  console.error('Uncaught Exception (synchrous errors) ! 🔥 ... Shutting down ...');
  console.error(err.name, err.message, err.stack);
  process.exit(1); // 0 = success, 1 = error
});

dotenv.config({ path: './config.env' }); // Read variables from this file and store them to nodejs environment.
// console.log(process.env);    // node
// console.log(app.get('env')); // express

const app = require('./app'); // This must be declared after dotenv

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then((conn) => {
    // console.log(DB);
    // console.log(conn.connections);
    console.log('DB connection successful');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// HANLDERS should be the last results (like a back-up)...
// It's a good practice to handle all errors where they occur.
// When we have unhandled rejections (asynchronous errors), the process object will emit an event named unhandledRejection
process.on('unhandledRejection', err => {
  console.error('Unhanle rejection (asynchronous errors) ! 🔥 ... Shutting down ...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1); // 0 = success, 1 = error
  });
});