const express = require('express');
const router = express.Router();
const offerController = require('./controllers/offerController');
const leadsController = require('./controllers/leadsController');

router.post('/offer', offerController.createOffer);
router.post('/leads/upload', leadsController.uploadLeads); // CSV upload
router.post('/score', leadsController.scoreLeads);
router.get('/results', leadsController.getResults);

module.exports = router;
