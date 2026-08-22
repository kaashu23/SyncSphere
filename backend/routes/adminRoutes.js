const express = require('express');
const router = express.Router();
const { getDashboardStats, exportChat, getAllChats, getAllUsers, getNotifications, markNotificationsRead } = require('../controllers/adminController');
// Assuming we have an adminMiddleware or we trust the clerk token for now
// In a real app we'd verify admin role

router.get('/stats', getDashboardStats);
router.get('/chats', getAllChats);
router.get('/users', getAllUsers);
router.get('/export/:chatId', exportChat);
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsRead);

module.exports = router;
