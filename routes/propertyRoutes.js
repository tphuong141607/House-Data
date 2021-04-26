/* ------------------------------------------ */
/*    CREATE ROUTER OBJECT                    */
/*    Needed to be mounted to an address      */
/* ------------------------------------------ */
const express = require('express');
const propertyController = require('../controllers/propertyController');

const router = express.Router();

/* -------------- */
/*    ROUTES      */
/* -------------- */
router.route('/property-stats').get(propertyController.getPriceStats);

router
  .route('/')
  .get(propertyController.getAllProperties)
  .post(propertyController.createProperty);

router
  .route('/:id')
  .get(propertyController.getProperty)
  .patch(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

module.exports = router;
