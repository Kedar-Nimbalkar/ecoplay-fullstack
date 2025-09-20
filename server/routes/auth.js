const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
    const { fullName, username, email, password, school, grade } = req.body;

    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists with that email or username' });
        }

        user = new User({
            fullName,
            username,
            email,
            password,
            school,
            grade,
        });

        await user.save();

        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { loginInput, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email: loginInput }, { username: loginInput }]
        });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                points: user.points,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/admin-init
// @desc    Initialize admin user (run once)
// @access  Public (should be protected in production)
router.post('/admin-init', async (req, res) => {
    const { email, password } = req.body; // Or use values from .env

    try {
        let adminUser = await User.findOne({ email: email || process.env.ADMIN_EMAIL });
        if (adminUser) {
            return res.status(400).json({ message: 'Admin user already exists' });
        }

        adminUser = new User({
            fullName: 'Admin User',
            username: 'admin',
            email: email || process.env.ADMIN_EMAIL,
            password: password || process.env.ADMIN_PASSWORD,
            role: 'admin',
        });

        await adminUser.save();
        res.status(201).json({ message: 'Admin user created successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;