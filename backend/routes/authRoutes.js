const express = require('express');
const { clerkWebhook, imagekitAuth } = require('../controllers/authController');

const router = express.Router();

// Clerk webhook needs the raw body to verify the signature properly.
// The route receives raw text instead of parsed JSON.
router.post('/webhook', express.raw({ type: 'application/json' }), clerkWebhook);
router.get('/imagekit', imagekitAuth);

module.exports = router;
