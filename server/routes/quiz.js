const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// @route   GET /api/quizzes
// @desc    Get all quizzes
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const quizzes = await Quiz.find({});
        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/quizzes/:id
// @desc    Get single quiz
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (quiz) {
            res.json(quiz);
        } else {
            res.status(404).json({ message: 'Quiz not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/quizzes/submit
// @desc    Submit quiz answers and update user points
// @access  Private
router.post('/submit', protect, async (req, res) => {
    const { quizId, answers } = req.body; // answers is an array of selected option indices

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        let totalPoints = 0;
        let correctAnswersCount = 0;

        quiz.questions.forEach((q, index) => {
            if (answers[index] === q.a) {
                totalPoints += q.points;
                correctAnswersCount++;
            }
        });

        const user = await User.findById(req.user._id);
        if (user) {
            user.points += totalPoints;
            user.quizzesTaken.push({
                quizId: quiz._id,
                earned: totalPoints,
                takenAt: Date.now(),
                correctAnswers: correctAnswersCount,
                totalQuestions: quiz.questions.length,
            });
            await user.save();
            res.json({ message: 'Quiz submitted successfully', totalPoints, correctAnswers: correctAnswersCount });
        } else {
            res.status(404).json({ message: 'User not found' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/quizzes/generate
// @desc    Generate a new quiz using AI
// @access  Private (Admin/Educator only)
router.post('/generate', protect, authorizeRoles('admin', 'educator'), async (req, res) => {
    const { topic, numQuestions = 5, difficulty = 'medium' } = req.body;

    if (!topic) {
        return res.status(400).json({ message: 'Topic is required for quiz generation' });
    }

    try {
        const prompt = `Generate a ${numQuestions}-question multiple-choice quiz about "${topic}" with ${difficulty} difficulty. Each question should have 4 options, and indicate the 0-indexed correct answer. Provide the output in a JSON array format like this:
        [
            {
                "q": "Question text?",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "a": 0,
                "points": 10
            },
            ...
        ]`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // or "gpt-4" for better quality
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const quizContent = JSON.parse(completion.choices[0].message.content);
        const questions = quizContent.questions || quizContent; // Handle cases where AI wraps in 'questions' key

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(500).json({ message: 'AI failed to generate valid quiz questions.' });
        }

        const newQuiz = new Quiz({
            title: `${topic} Quiz`,
            description: `An AI-generated quiz on ${topic} (${difficulty} difficulty).`,
            questions: questions,
            createdBy: req.user._id,
        });

        await newQuiz.save();
        res.status(201).json(newQuiz);

    } catch (error) {
        console.error('AI Quiz Generation Error:', error);
        res.status(500).json({ message: 'Failed to generate quiz. Please try again later.', error: error.message });
    }
});

module.exports = router;