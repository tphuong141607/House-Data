/* ------------------------------------------ */
/*    CREATE ROUTER OBJECT                    */
/*    Needed to be mounted to an address      */
/* ------------------------------------------ */
const express = require('express');
const viewController = require('../controllers/viewController');

const router = express.Router();

/* -------------- */
/*    ROUTES      */
/* -------------- */
router
  .route('/')
  .get(viewController.getOverview);

module.exports = router;
