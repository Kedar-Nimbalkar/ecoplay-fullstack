const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // e.g., "Planting", "Cleanup", "Recycling"
    note: { type: String },
    imageData: { type: String, required: true }, // Base64 encoded image
    createdAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    points: { type: Number, default: 10 },
    adminNotes: { type: String }
});

module.exports = mongoose.model('Submission', submission,submissionSchema);