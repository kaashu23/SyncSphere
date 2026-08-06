const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['voice', 'video'],
    required: true,
  },
  isGroup: {
    type: Boolean,
    default: false,
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
  },
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['missed', 'answered', 'declined'],
    default: 'missed',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: Date,
  durationSeconds: Number,
}, { timestamps: true });

module.exports = mongoose.model('Call', callSchema);
