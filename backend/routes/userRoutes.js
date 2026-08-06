const express = require('express');
const { onboardUser, searchUsers, getMe } = require('../controllers/userController');

const router = express.Router();

router.get('/me', getMe);
router.post('/onboard', onboardUser);
router.get('/', searchUsers);

module.exports = router;
