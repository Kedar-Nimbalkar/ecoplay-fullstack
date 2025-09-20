const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [{
        q: { type: String, required: true },
        options: [{ type: String, required: true }],
        a: { type: Number, required: true }, // Index of the correct option
        points: { type: Number, default: 10 }
    }],
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // To track who created the quiz
});

module.exports = mongoose.model('Quiz', quizSchema);