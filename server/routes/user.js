const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('quizzesTaken.quizId', 'title') // Populate quiz titles
            .populate('submissions', 'type note createdAt points'); // Populate submission details

        if (user) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                school: user.school,
                grade: user.grade,
                createdAt: user.createdAt,
                points: user.points,
                badges: user.badges,
                quizzesTaken: user.quizzesTaken,
                submissions: user.submissions,
                wateringStreak: user.wateringStreak,
                lastWateringDate: user.lastWateringDate,
                role: user.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const { fullName, username, email, school, grade, password } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.fullName = fullName || user.fullName;
            user.username = username || user.username;
            user.email = email || user.email;
            user.school = school || user.school;
            user.grade = grade || user.grade;

            if (password) {
                user.password = password; // Mongoose pre-save hook will hash it
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                username: updatedUser.username,
                email: updatedUser.email,
                school: updatedUser.school,
                grade: updatedUser.grade,
                points: updatedUser.points,
                role: updatedUser.role,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;