const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');

router.post('/', callController.createCallLog);
router.get('/', callController.getCallLogs);

module.exports = router;
