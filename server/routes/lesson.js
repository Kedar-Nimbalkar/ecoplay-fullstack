const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { admin, educator } = require('../middleware/adminMiddleware');
const Lesson = require('../models/Lesson');
const User = require('../models/User');

// @route   GET /api/lessons
// @desc    Get all lessons
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const lessons = await Lesson.find({});
        res.json(lessons);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/lessons/:id
// @desc    Get a single lesson
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (lesson) {
            res.json(lesson);
        } else {
            res.status(404).json({ message: 'Lesson not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/lessons
// @desc    Create a new lesson (Admin/Educator)
// @access  Private/Admin, Educator
router.post('/', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    const { title, description, type, content, thumbnail, pointsReward } = req.body;

    if (!title || !type || !content) {
        return res.status(400).json({ message: 'Title, type, and content are required for a lesson.' });
    }

    try {
        const newLesson = new Lesson({
            title,
            description,
            type,
            content,
            thumbnail,
            pointsReward,
            createdBy: req.user._id
        });

        await newLesson.save();
        res.status(201).json(newLesson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/lessons/:id
// @desc    Update a lesson (Admin/Educator)
// @access  Private/Admin, Educator
router.put('/:id', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    const { title, description, type, content, thumbnail, pointsReward } = req.body;

    try {
        const lesson = await Lesson.findById(req.params.id);
        if (lesson) {
            lesson.title = title || lesson.title;
            lesson.description = description || lesson.description;
            lesson.type = type || lesson.type;
            lesson.content = content || lesson.content;
            lesson.thumbnail = thumbnail || lesson.thumbnail;
            lesson.pointsReward = pointsReward !== undefined ? pointsReward : lesson.pointsReward;

            const updatedLesson = await lesson.save();
            res.json(updatedLesson);
        } else {
            res.status(404).json({ message: 'Lesson not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete a lesson (Admin/Educator)
// @access  Private/Admin, Educator
router.delete('/:id', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndDelete(req.params.id);
        if (lesson) {
            res.json({ message: 'Lesson removed' });
        } else {
            res.status(404).json({ message: 'Lesson not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/lessons/:id/complete
// @desc    Mark a lesson as complete and award points
// @access  Private
router.post('/:id/complete', protect, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent duplicate point awards for the same lesson
        if (user.joinedEvents.includes(lesson._id)) { // Re-using joinedEvents for completed lessons for simplicity
            return res.status(400).json({ message: 'Lesson already completed.' });
        }

        user.points += lesson.pointsReward;
        user.joinedEvents.push(lesson._id); // Mark as completed
        await user.save();

        res.json({ message: `Lesson completed! You earned ${lesson.pointsReward} points.`, userPoints: user.points });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;