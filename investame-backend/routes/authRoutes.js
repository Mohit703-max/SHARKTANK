const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { register, login } = require('../validators/authValidators');

// Public routes
router.post('/register', validate(register), authController.register);
router.post('/login', validate(login), authController.login);

// Protected
router.get('/me', protect, authController.getMe);

module.exports = router;
