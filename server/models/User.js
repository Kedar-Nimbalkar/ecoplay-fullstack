const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    school: { type: String },
    grade: { type: String },
    createdAt: { type: Date, default: Date.now },
    points: { type: Number, default: 0 },
    badges: [{ type: String }], // Store badge names or IDs
    submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }],
    quizzesTaken: [{
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
        earned: { type: Number },
        takenAt: { type: Date },
        correctAnswers: { type: Number },
        totalQuestions: { type: Number }
    }],
    joinedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }], // Assuming an Event model
    wateringStreak: { type: Number, default: 0 },
    lastWateringDate: { type: Date },
    role: { type: String, enum: ['user', 'admin', 'educator'], default: 'user' }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);