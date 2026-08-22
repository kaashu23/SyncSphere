const express = require('express');
const router = express.Router();
const { getDashboardStats, exportChat, getAllChats, getAllUsers } = require('../controllers/adminController');
// Assuming we have an adminMiddleware or we trust the clerk token for now
// In a real app we'd verify admin role

router.get('/stats', getDashboardStats);
router.get('/chats', getAllChats);
router.get('/users', getAllUsers);
router.get('/export/:chatId', exportChat);

module.exports = router;
