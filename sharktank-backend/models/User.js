const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['innovator', 'investor', 'user'], required: true } // ✅ 3 roles
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);