const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Redemption = require('../models/Redemption');
const User = require('../models/User');

// @route   GET /api/redemptions
// @desc    Get all redemption records for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const redemptions = await Redemption.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(redemptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/redemptions
// @desc    Redeem a reward
// @access  Private
router.post('/', protect, async (req, res) => {
    const { rewardName, cost } = req.body;

    if (!rewardName || !cost) {
        return res.status(400).json({ message: 'Reward name and cost are required' });
    }

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.points < cost) {
            return res.status(400).json({ message: 'Not enough points to redeem this reward.' });
        }

        user.points -= cost;
        await user.save();

        const newRedemption = new Redemption({
            userId: user._id,
            reward: rewardName,
            cost,
            createdAt: Date.now()
        });

        await newRedemption.save();

        res.status(201).json({ message: `Successfully redeemed ${rewardName}!`, redemption: newRedemption, userPoints: user.points });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;