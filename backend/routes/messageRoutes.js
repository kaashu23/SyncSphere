const express = require('express');
const { sendMessage, allMessages, markAsRead, deleteMessage, reactToMessage, editMessage, starMessage } = require('../controllers/messageController');

const router = express.Router();

router.post('/', sendMessage);
router.post('/read', markAsRead);
router.get('/:chatId', allMessages);
router.delete('/:messageId', deleteMessage);
router.post('/:messageId/react', reactToMessage);
router.put('/:messageId', editMessage);
router.post('/:messageId/star', starMessage);

module.exports = router;
