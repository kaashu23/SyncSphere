const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // sparse because they might not pick a username immediately on signup
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: String,
  avatarUrl: String,
  bio: String,
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
  },
  privacy: {
    lastSeenVisible: { type: Boolean, default: true },
    readReceiptsVisible: { type: Boolean, default: true },
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  pushSubscription: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String,
    },
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sentRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  onboarded: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
