/* ------------------------------------------ */
/*    CREATE ROUTER OBJECT                    */
/*    Needed to be mounted to an address      */
/* ------------------------------------------ */
const express = require('express');
const countyCodeController = require('../../controllers/countyCodeController');

const router = express.Router();

/* -------------- */
/*    ROUTES      */
/* -------------- */
router
  .route('/')
  .get(countyCodeController.getAllCountyCodes)
  .post(countyCodeController.createCountyCode);

router
  .route('/:id')
  .get(countyCodeController.getCountyCode)
  .patch(countyCodeController.updateCountyCode)
  .delete(countyCodeController.deleteCountyCode);

module.exports = router;
