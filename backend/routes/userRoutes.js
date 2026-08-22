const express = require('express');
const { 
  onboardUser, 
  searchUsers, 
  getMe,
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  getFriends,
  blockUser,
  unblockUser
} = require('../controllers/userController');

const router = express.Router();

router.get('/me', getMe);
router.post('/onboard', onboardUser);
router.get('/', searchUsers);

// Friend Request Routes
router.post('/request/:id', sendRequest);
router.post('/accept/:id', acceptRequest);
router.post('/reject/:id', rejectRequest);
router.post('/remove/:id', removeFriend);
router.get('/friends', getFriends);

// Block Routes
router.post('/block/:id', blockUser);
router.post('/unblock/:id', unblockUser);

module.exports = router;
