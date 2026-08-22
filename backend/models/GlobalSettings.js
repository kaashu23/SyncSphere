const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  allowRegistrations: { type: Boolean, default: true },
  maxFileSizeMB: { type: Number, default: 20 },
  theme: { type: String, default: 'system' }
}, { timestamps: true });

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
