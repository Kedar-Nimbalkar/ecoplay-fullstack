require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // To handle larger image data

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/quizzes', require('./routes/quiz'));
app.use('/api/watering', require('./routes/watering'));
app.use('/api/submissions', require('./routes/submission'));
app.use('/api/redemptions', require('./routes/redemption'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/lessons', require('./routes/lesson')); // New lessons route

// Serve static files from the client folder in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'index.html'));
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});