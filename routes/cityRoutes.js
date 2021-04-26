/* ------------------------------------------ */
/*    CREATE ROUTER OBJECT                    */
/*    Needed to be mounted to an address      */
/* ------------------------------------------ */
const express = require('express');
const cityController = require('../controllers/cityController');

const router = express.Router();

/* -------------- */
/*    ROUTES      */
/* -------------- */
router
  .route('/')
  .get(cityController.getAllCities)
  .post(cityController.createCity);

router
  .route('/:id')
  .get(cityController.getCity)
  .patch(cityController.updateCity)
  .delete(cityController.deleteCity);

module.exports = router;
