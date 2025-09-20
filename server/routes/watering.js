const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const WateringRecord = require('../models/WateringRecord');
const User = require('../models/User');

// @route   GET /api/watering
// @desc    Get all watering records for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const records = await WateringRecord.find({ userId: req.user._id }).sort({ date: -1 });
        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/watering
// @desc    Submit a new watering record
// @access  Private
router.post('/', protect, async (req, res) => {
    const { imageData, note } = req.body;

    if (!imageData) {
        return res.status(400).json({ message: 'Image data is required' });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        const existingRecordToday = await WateringRecord.findOne({
            userId: req.user._id,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Up to end of day
            }
        });

        if (existingRecordToday) {
            return res.status(400).json({ message: 'You have already submitted a watering record for today.' });
        }

        // --- AI Verification Placeholder ---
        // In a real application, you would send `imageData` to an AI service here.
        // The AI would verify:
        // 1. Is there a plant in the image?
        // 2. Is there a watering action (e.g., watering can, hose)?
        // 3. (Optional, more complex) Is the person in the image the logged-in user (facial recognition)?
        // For now, we'll simulate a successful verification.
        const isPlantingVerified = true; // Simulate AI verification
        const isSamePersonVerified = true; // Simulate AI verification (very complex in reality)

        if (!isPlantingVerified) {
            return res.status(400).json({ message: 'AI could not verify a plant watering activity in the image.' });
        }
        // If you implement facial recognition:
        // if (!isSamePersonVerified) {
        //     return res.status(400).json({ message: 'AI could not verify that it is you in the image.' });
        // }
        // --- End AI Verification Placeholder ---

        const newRecord = new WateringRecord({
            userId: req.user._id,
            date: Date.now(),
            imageData,
            note: note || 'Daily watering activity',
            verified: isPlantingVerified, // Mark as verified if AI passes
            points: 15 // Default points
        });

        await newRecord.save();

        const user = await User.findById(req.user._id);
        if (user) {
            user.points += newRecord.points;

            // Update streak logic
            const latestRecordDate = new Date(newRecord.date);
            latestRecordDate.setHours(0, 0, 0, 0);

            const yesterday = new Date(latestRecordDate);
            yesterday.setDate(latestRecordDate.getDate() - 1);

            const dayBeforeYesterday = new Date(latestRecordDate);
            dayBeforeYesterday.setDate(latestRecordDate.getDate() - 2);

            const lastWatering = user.lastWateringDate ? new Date(user.lastWateringDate) : null;
            if (lastWatering) {
                lastWatering.setHours(0, 0, 0, 0);
            }

            if (lastWatering && lastWatering.getTime() === yesterday.getTime()) {
                user.wateringStreak += 1;
            } else if (lastWatering && lastWatering.getTime() === latestRecordDate.getTime()) {
                // Already watered today, should be caught by existingRecordToday check, but good for robustness
            } else {
                user.wateringStreak = 1; // Start new streak
            }
            user.lastWateringDate = newRecord.date;

            await user.save();
            res.status(201).json({ message: 'Watering record submitted and verified!', record: newRecord, userPoints: user.points, userStreak: user.wateringStreak });
        } else {
            res.status(404).json({ message: 'User not found' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;