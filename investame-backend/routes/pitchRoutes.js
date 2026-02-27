const express = require('express');
const router = express.Router();

const pitchController = require('../controllers/pitchController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createPitch,
  updatePitch,
  swipe,
} = require('../validators/pitchValidators');

// All pitch routes require authentication of their creator checking jwt shit again
router.use(protect);

// ─── Innovator routes ──────────────────────────────────────────────────────────
router.post(
  '/',
  restrictTo('innovator'),
  validate(createPitch),
  pitchController.createPitch
);

router.get('/my', restrictTo('innovator'), pitchController.getMyPitches);

router.patch(
  '/:pitchId',
  restrictTo('innovator'),
  validate(updatePitch),
  pitchController.updatePitch
);

router.delete('/:pitchId', restrictTo('innovator'), pitchController.deletePitch);

// ─── Investor routes ───────────────────────────────────────────────────────────
router.get('/feed', restrictTo('investor'), pitchController.getInvestorFeed);

router.get('/liked', restrictTo('investor'), pitchController.getLikedPitches);

router.post(
  '/:pitchId/swipe',
  restrictTo('investor'),
  validate(swipe),
  pitchController.swipeOnPitch
);

// ─── Shared routes ─────────────────────────────────────────────────────────────
// Must be last to avoid matching 'feed', 'my', 'liked' as pitchIds
router.get('/:pitchId', restrictTo('innovator', 'investor'), pitchController.getPitchById);

module.exports = router;
