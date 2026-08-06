const express = require('express');
const { fetchChats, accessChat, createGroupChat, deleteChat, archiveChat, muteChat } = require('../controllers/chatController');

const router = express.Router();

router.get('/', fetchChats);
router.post('/', accessChat);
router.post('/group', createGroupChat);
router.delete('/:chatId', deleteChat);
router.put('/:chatId/archive', archiveChat);
router.put('/:chatId/mute', muteChat);

module.exports = router;
