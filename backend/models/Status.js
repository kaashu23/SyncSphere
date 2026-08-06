const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    mediaType: { type: String, enum: ['text', 'image', 'video'], default: 'image' },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// Auto-delete expired statuses using TTL index
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Status', statusSchema);
