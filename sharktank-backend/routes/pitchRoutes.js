const express = require('express');
const router = express.Router();
const Pitch = require('../models/Pitch');
const authMiddleware = require('../middleware/authMiddleware');

// CREATE PITCH (Innovator only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'innovator') {
            return res.status(403).json({ message: 'Only innovators can create pitches' });
        }

        const { title, description, industry, fundingGoal } = req.body;

        const newPitch = await Pitch.create({
            title,
            description,
            innovator: req.user._id, // renamed from founder → innovator
            industry,
            fundingGoal
        });

        res.status(201).json(newPitch);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// FETCH PITCHES (Investors only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'investor') {
            return res.status(403).json({ message: 'Only investors can view pitches' });
        }

        const pitches = await Pitch.find().populate('innovator', 'name email');
        res.json(pitches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// SWIPE ON PITCH (Investors only)
router.post('/:pitchId/swipe', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'investor') {
            return res.status(403).json({ message: 'Only investors can swipe' });
        }

        const { liked } = req.body;
        const pitch = await Pitch.findById(req.params.pitchId);
        if (!pitch) return res.status(404).json({ message: 'Pitch not found' });

        const existingSwipe = pitch.swipes.find(
            s => s.investor.toString() === req.user._id.toString()
        );

        if (existingSwipe) {
            existingSwipe.liked = liked;
        } else {
            pitch.swipes.push({ investor: req.user._id, liked });
        }

        await pitch.save();
        res.json(pitch);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;