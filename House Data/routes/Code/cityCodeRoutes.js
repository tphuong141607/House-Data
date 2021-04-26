/* ------------------------------------------ */
/*    CREATE ROUTER OBJECT                    */
/*    Needed to be mounted to an address      */
/* ------------------------------------------ */
const express = require('express');
const cityCodeController = require('../../controllers/cityCodeController');

const router = express.Router();

/* -------------- */
/*    ROUTES      */
/* -------------- */
router
  .route('/')
  .get(cityCodeController.getAllCityCodes)
  .post(cityCodeController.createCityCode);

router
  .route('/:id')
  .get(cityCodeController.getCityCode)
  .patch(cityCodeController.updateCityCode)
  .delete(cityCodeController.deleteCityCode);

module.exports = router;
