const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reward: { type: String, required: true },
    cost: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Redemption', redemptionSchema);