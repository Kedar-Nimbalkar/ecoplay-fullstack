const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @route   GET /api/submissions
// @desc    Get all submissions for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const submissions = await Submission.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/submissions
// @desc    Submit a new environmental activity
// @access  Private
router.post('/', protect, async (req, res) => {
    const { type, note, imageData } = req.body;

    if (!type || !note || !imageData) {
        return res.status(400).json({ message: 'Activity type, note, and image data are required' });
    }

    try {
        const newSubmission = new Submission({
            userId: req.user._id,
            type,
            note,
            imageData,
            points: 10, // Default points, can be adjusted by admin
            verified: false // Awaiting admin verification
        });

        await newSubmission.save();

        const user = await User.findById(req.user._id);
        if (user) {
            user.points += newSubmission.points; // Award points immediately, subject to admin review
            user.submissions.push(newSubmission._id);
            await user.save();
            res.status(201).json({ message: 'Activity submitted successfully! Points awarded, awaiting verification.', submission: newSubmission, userPoints: user.points });
        } else {
            res.status(404).json({ message: 'User not found' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;