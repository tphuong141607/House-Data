/* ------------------------------------------ */
/*    CREATE ROUTER OBJECT                    */
/*    Needed to be mounted to an address      */
/* ------------------------------------------ */
const express = require('express');
const stateCodeController = require('../../controllers/stateCodeController');

const router = express.Router();

/* -------------- */
/*    ROUTES      */
/* -------------- */
router
  .route('/')
  .get(stateCodeController.getAllStateCodes)
  .post(stateCodeController.createStateCode);

router
  .route('/:id')
  .get(stateCodeController.getStateCode)
  .patch(stateCodeController.updateStateCode)
  .delete(stateCodeController.deleteStateCode);

module.exports = router;
