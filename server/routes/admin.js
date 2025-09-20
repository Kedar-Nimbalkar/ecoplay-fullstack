const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { admin, educator } = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Submission = require('../models/Submission');
const WateringRecord = require('../models/WateringRecord');
const Quiz = require('../models/Quiz');

// @route   GET /api/admin/users
// @desc    Get all users (Admin/Educator)
// @access  Private/Admin, Educator
router.get('/users', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    try {
        const users = await User.find({}).select('-password'); // Exclude passwords
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/user/:id
// @desc    Get single user details (Admin/Educator)
// @access  Private/Admin, Educator
router.get('/user/:id', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password')
            .populate('quizzesTaken.quizId', 'title')
            .populate('submissions', 'type note createdAt points verified');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/user/:id/role
// @desc    Update user role (Admin only)
// @access  Private/Admin
router.put('/user/:id/role', protect, admin, async (req, res) => {
    const { role } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.role = role;
            await user.save();
            res.json({ message: 'User role updated', user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/user/:id
// @desc    Delete a user (Admin only)
// @access  Private/Admin
router.delete('/user/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (user) {
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/submissions/pending
// @desc    Get all pending submissions for verification (Admin/Educator)
// @access  Private/Admin, Educator
router.get('/submissions/pending', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    try {
        const pendingSubmissions = await Submission.find({ verified: false }).populate('userId', 'fullName username email');
        res.json(pendingSubmissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/submissions/:id/verify
// @desc    Verify/Reject a submission (Admin/Educator)
// @access  Private/Admin, Educator
router.put('/submissions/:id/verify', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    const { verified, points, adminNotes } = req.body; // `verified` can be true/false

    try {
        const submission = await Submission.findById(req.params.id);
        if (submission) {
            // If previously unverified and now verified, adjust points
            if (!submission.verified && verified) {
                const user = await User.findById(submission.userId);
                if (user) {
                    // If points are changed by admin, adjust
                    if (points && points !== submission.points) {
                        user.points -= submission.points; // Remove old points
                        user.points += points; // Add new points
                        submission.points = points;
                    }
                    await user.save();
                }
            } else if (submission.verified && !verified) {
                // If previously verified and now rejected, remove points
                const user = await User.findById(submission.userId);
                if (user) {
                    user.points -= submission.points;
                    await user.save();
                }
            }

            submission.verified = verified;
            submission.adminNotes = adminNotes;
            await submission.save();
            res.json({ message: 'Submission updated', submission });
        } else {
            res.status(404).json({ message: 'Submission not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/watering/pending
// @desc    Get all pending watering records for verification (Admin/Educator)
// @access  Private/Admin, Educator
router.get('/watering/pending', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    try {
        const pendingRecords = await WateringRecord.find({ verified: false }).populate('userId', 'fullName username email');
        res.json(pendingRecords);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/watering/:id/verify
// @desc    Verify/Reject a watering record (Admin/Educator)
// @access  Private/Admin, Educator
router.put('/watering/:id/verify', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    const { verified, points, adminNotes } = req.body;

    try {
        const record = await WateringRecord.findById(req.params.id);
        if (record) {
            // Similar point adjustment logic as submissions
            if (!record.verified && verified) {
                const user = await User.findById(record.userId);
                if (user) {
                    if (points && points !== record.points) {
                        user.points -= record.points;
                        user.points += points;
                        record.points = points;
                    }
                    await user.save();
                }
            } else if (record.verified && !verified) {
                const user = await User.findById(record.userId);
                if (user) {
                    user.points -= record.points;
                    await user.save();
                }
            }

            record.verified = verified;
            record.adminNotes = adminNotes;
            await record.save();
            res.json({ message: 'Watering record updated', record });
        } else {
            res.status(404).json({ message: 'Watering record not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/analytics
// @desc    Get overall platform analytics (Admin/Educator)
// @access  Private/Admin, Educator
router.get('/analytics', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalQuizzes = await Quiz.countDocuments();
        const totalSubmissions = await Submission.countDocuments();
        const verifiedSubmissions = await Submission.countDocuments({ verified: true });
        const totalWateringRecords = await WateringRecord.countDocuments();
        const verifiedWateringRecords = await WateringRecord.countDocuments({ verified: true });
        const totalPointsAwarded = (await User.aggregate([{ $group: { _id: null, total: { $sum: "$points" } } }]))[0]?.total || 0;

        res.json({
            totalUsers,
            totalQuizzes,
            totalSubmissions,
            verifiedSubmissions,
            totalWateringRecords,
            verifiedWateringRecords,
            totalPointsAwarded,
            // Add more analytics as needed
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;