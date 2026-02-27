const pitchService = require('../services/pitchService');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

// ─── Innovator controllers ─────────────────────────────────────────────────────

/**
 * POST /api/pitches
 * Innovator creates a new pitch.
 */
const createPitch = catchAsync(async (req, res) => {
  const pitch = await pitchService.createPitch(req.user._id, req.body);
  sendSuccess(res, 201, 'Pitch created successfully.', { pitch });
});

/**
 * GET /api/pitches/my
 * Innovator views their own pitches with full swipe data.
 */
const getMyPitches = catchAsync(async (req, res) => {
  const pitches = await pitchService.getMyPitches(req.user._id);
  sendSuccess(res, 200, 'Pitches fetched.', { pitches, count: pitches.length });
});

/**
 * PATCH /api/pitches/:pitchId
 * Innovator updates one of their pitches.
 */
const updatePitch = catchAsync(async (req, res) => {
  const pitch = await pitchService.updatePitch(req.params.pitchId, req.user._id, req.body);
  sendSuccess(res, 200, 'Pitch updated successfully.', { pitch });
});

/**
 * DELETE /api/pitches/:pitchId
 * Innovator deletes one of their pitches.
 */
const deletePitch = catchAsync(async (req, res) => {
  await pitchService.deletePitch(req.params.pitchId, req.user._id);
  sendSuccess(res, 200, 'Pitch deleted successfully.');
});

// ─── Investor controllers ──────────────────────────────────────────────────────

/**
 * GET /api/pitches/feed
 * Investor sees only pitches they haven't swiped yet, with pagination + filters.
 *
 * Query params:
 *   page      {number}  default: 1
 *   limit     {number}  default: 10
 *   industry  {string}  optional
 *   sort      {string}  newest | oldest | fundingGoal_asc | fundingGoal_desc
 */
const getInvestorFeed = catchAsync(async (req, res) => {
  const { page, limit, industry, sort } = req.query;

  const { pitches, pagination } = await pitchService.getInvestorFeed(req.user._id, {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    industry,
    sort,
  });

  sendSuccess(res, 200, 'Feed fetched.', { pitches }, { pagination });
});

/**
 * POST /api/pitches/:pitchId/swipe
 * Investor swipes on a pitch. Body: { liked: true | false }
 */
const swipeOnPitch = catchAsync(async (req, res) => {
  const { liked } = req.body;
  const { action } = await pitchService.swipeOnPitch(
    req.params.pitchId,
    req.user._id,
    liked
  );

  const messages = {
    created: liked ? 'Pitch liked!' : 'Pitch passed.',
    updated: 'Swipe decision updated.',
    unchanged: 'No change — swipe already recorded.',
  };

  sendSuccess(res, 200, messages[action] || 'Swipe recorded.');
});

/**
 * GET /api/pitches/liked
 * Investor views all pitches they have liked.
 */
const getLikedPitches = catchAsync(async (req, res) => {
  const pitches = await pitchService.getLikedPitches(req.user._id);
  sendSuccess(res, 200, 'Liked pitches fetched.', { pitches, count: pitches.length });
});

// ─── Shared controllers ────────────────────────────────────────────────────────

/**
 * GET /api/pitches/:pitchId
 * Single pitch — accessible to innovators (full) and investors (with their swipe status).
 */
const getPitchById = catchAsync(async (req, res) => {
  const pitch = await pitchService.getPitchById(
    req.params.pitchId,
    req.user._id,
    req.user.role
  );
  sendSuccess(res, 200, 'Pitch fetched.', { pitch });
});

module.exports = {
  createPitch,
  getMyPitches,
  updatePitch,
  deletePitch,
  getInvestorFeed,
  swipeOnPitch,
  getLikedPitches,
  getPitchById,
};
