const express = require('express');
const { fetchChats, accessChat, createGroupChat, deleteChat, archiveChat, muteChat, toggleGroupAdmin, addToGroup, removeFromGroup, updateGroupInfo, setWallpaper, togglePinMessage, setDisappearingTimer, generateInviteLink, joinByInviteLink } = require('../controllers/chatController');

const router = express.Router();

router.get('/', fetchChats);
router.post('/', accessChat);
router.post('/group', createGroupChat);
router.delete('/:chatId', deleteChat);
router.put('/:chatId/archive', archiveChat);
router.put('/:chatId/mute', muteChat);
router.put('/:chatId/wallpaper', setWallpaper);
router.put('/:chatId/update', updateGroupInfo);
router.put('/:chatId/admin/:userId', toggleGroupAdmin);
router.put('/:chatId/add', addToGroup);
router.put('/:chatId/remove/:userId', removeFromGroup);
router.put('/:chatId/pin/:messageId', togglePinMessage);
router.put('/:chatId/disappearing', setDisappearingTimer);
router.get('/:chatId/invite', generateInviteLink);
router.post('/join/:inviteCode', joinByInviteLink);

module.exports = router;
