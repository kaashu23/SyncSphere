const express = require('express');
const router = express.Router();
const { getDashboardStats, exportChat, getAllChats, getAllUsers, getNotifications, markNotificationsRead, getEvents, createEvent, deleteEvent, getSettings, updateSettings } = require('../controllers/adminController');
// Assuming we have an adminMiddleware or we trust the clerk token for now
// In a real app we'd verify admin role

router.get('/stats', getDashboardStats);
router.get('/chats', getAllChats);
router.get('/users', getAllUsers);
router.get('/export/:chatId', exportChat);
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsRead);
router.get('/events', getEvents);
router.post('/events', createEvent);
router.delete('/events/:id', deleteEvent);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
