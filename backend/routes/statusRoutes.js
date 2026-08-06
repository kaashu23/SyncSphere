const express = require('express');
const { getStatuses, addStatus } = require('../controllers/statusController');

const router = express.Router();

router.get('/', getStatuses);
router.post('/', addStatus);

module.exports = router;
