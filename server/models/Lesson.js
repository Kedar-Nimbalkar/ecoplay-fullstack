const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['video', 'text', 'interactive'], required: true }, // e.g., video, text, interactive
    content: { type: String, required: true }, // URL for video, markdown for text, or interactive code/link
    thumbnail: { type: String }, // URL for a thumbnail image
    pointsReward: { type: Number, default: 0 }, // Points for completing the lesson
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Admin/Educator who created it
});

module.exports = mongoose.model('Lesson', lessonSchema);