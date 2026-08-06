const express = require('express');
const { 
  onboardUser, 
  searchUsers, 
  getMe,
  sendRequest,
  acceptRequest,
  rejectRequest,
  getFriends
} = require('../controllers/userController');

const router = express.Router();

router.get('/me', getMe);
router.post('/onboard', onboardUser);
router.get('/', searchUsers);

// Friend Request Routes
router.post('/request/:id', sendRequest);
router.post('/accept/:id', acceptRequest);
router.post('/reject/:id', rejectRequest);
router.get('/friends', getFriends);

module.exports = router;
