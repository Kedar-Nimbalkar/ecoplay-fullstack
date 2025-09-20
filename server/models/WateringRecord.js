const mongoose = require('mongoose');

const wateringRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    imageData: { type: String, required: true }, // Base64 encoded image
    note: { type: String },
    verified: { type: Boolean, default: false },
    points: { type: Number, default: 15 },
    adminNotes: { type: String }
});

module.exports = mongoose.model('WateringRecord', wateringRecordSchema);