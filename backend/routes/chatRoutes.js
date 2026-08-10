const express = require('express');
const { fetchChats, accessChat, createGroupChat, deleteChat, archiveChat, muteChat, toggleGroupAdmin, addToGroup, removeFromGroup, updateGroupInfo } = require('../controllers/chatController');

const router = express.Router();

router.get('/', fetchChats);
router.post('/', accessChat);
router.post('/group', createGroupChat);
router.delete('/:chatId', deleteChat);
router.put('/:chatId/archive', archiveChat);
router.put('/:chatId/mute', muteChat);
router.put('/:chatId/update', updateGroupInfo);
router.put('/:chatId/admin/:userId', toggleGroupAdmin);
router.put('/:chatId/add', addToGroup);
router.put('/:chatId/remove/:userId', removeFromGroup);

module.exports = router;
