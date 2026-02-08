const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    liked: { type: Boolean, required: true }
}, { _id: false });

const pitchSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    innovator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    industry: { type: String },
    fundingGoal: { type: Number },
    swipes: [swipeSchema]
}, { timestamps: true });

module.exports = mongoose.model('Pitch', pitchSchema);