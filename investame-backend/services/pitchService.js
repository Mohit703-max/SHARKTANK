const mongoose = require('mongoose');
const Pitch = require('../models/Pitch');
const AppError = require('../utils/AppError');

// ─── Sort map ─────────────────────────────────────────────────────────────────
const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  fundingGoal_asc: { fundingGoal: 1 },
  fundingGoal_desc: { fundingGoal: -1 },
};

// ─── Innovator operations ─────────────────────────────────────────────────────

/**
 * Creates a new pitch for the given innovator.
 */
const createPitch = async (innovatorId, dto) => {
  const pitch = await Pitch.create({ ...dto, innovator: innovatorId });
  return pitch;
};

/**
 * Returns all pitches owned by an innovator, with swipe details populated.
 */
const getMyPitches = async (innovatorId) => {
  const pitches = await Pitch.find({ innovator: innovatorId })
    .populate('innovator', 'name email')
    .populate('swipes.investor', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return pitches;
};

/**
 * Updates a pitch — only the owning innovator can do this.
 */
const updatePitch = async (pitchId, innovatorId, dto) => {
  const pitch = await Pitch.findOne({ _id: pitchId, innovator: innovatorId });
  if (!pitch) {
    throw new AppError('Pitch not found or you are not authorized to edit it.', 404);
  }

  Object.assign(pitch, dto);
  await pitch.save();
  return pitch;
};

/**
 * Deletes a pitch — only the owning innovator can do this.
 */
const deletePitch = async (pitchId, innovatorId) => {
  const result = await Pitch.findOneAndDelete({ _id: pitchId, innovator: innovatorId });
  if (!result) {
    throw new AppError('Pitch not found or you are not authorized to delete it.', 404);
  }
};

// ─── Investor operations ──────────────────────────────────────────────────────

/**
 * Returns the paginated investor feed — pitches the investor has NOT yet swiped on.
 *
 * The key query:
 *   { 'swipes.investor': { $ne: investorId } }
 *
 * MongoDB evaluates this at the array element level:
 * it returns documents where NO element in the swipes array
 * has investor === investorId — which is exactly what we want.
 *
 * $nin alternative for array of IDs:
 *   { 'swipes.investor': { $nin: [investorId] } }
 * Both are equivalent for a single value; $ne is cleaner.
 */
const getInvestorFeed = async (investorId, { page = 1, limit = 10, industry, sort = 'newest' }) => {
  const filter = {
    'swipes.investor': { $ne: new mongoose.Types.ObjectId(investorId) },//not yet swiped investor,
    fundingStatus: 'open',//to show only the pitches that are open
  };

  if (industry) filter.industry = industry;

  const sortOrder = SORT_MAP[sort] || SORT_MAP.newest;
  const skip = (page - 1) * limit;

  const [pitches, total] = await Promise.all([
    Pitch.find(filter)
      .select('-swipes') // Investor feed doesn't need the full swipes list
      .populate('innovator', 'name bio avatarUrl innovatorMeta')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean(),
    Pitch.countDocuments(filter),
  ]);

  return {
    pitches,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Records or updates a swipe from an investor on a pitch.
 * Returns the swipe action taken: 'created' | 'updated'
 */
const swipeOnPitch = async (pitchId, investorId, liked) => {
  const pitch = await Pitch.findById(pitchId);
  if (!pitch) {
    throw new AppError('Pitch not found.', 404);
  }
  if (pitch.fundingStatus !== 'open') {
    throw new AppError('This pitch is no longer accepting swipes.', 400);
  }

  const investorObjectId = new mongoose.Types.ObjectId(investorId);
  const existingSwipeIndex = pitch.swipes.findIndex((s) =>
    s.investor.equals(investorObjectId)
  );

  let action;

  if (existingSwipeIndex !== -1) {
    // Update existing swipe — adjust counters
    const previousLiked = pitch.swipes[existingSwipeIndex].liked;
    if (previousLiked === liked) {
      // No actual change — return early
      return { action: 'unchanged', pitch };
    }

    pitch.swipes[existingSwipeIndex].liked = liked;
    pitch.swipes[existingSwipeIndex].swipedAt = new Date();

    if (liked) {
      pitch.likeCount = Math.max(0, pitch.likeCount + 1);
      pitch.dislikeCount = Math.max(0, pitch.dislikeCount - 1);
    } else {
      pitch.dislikeCount = Math.max(0, pitch.dislikeCount + 1);
      pitch.likeCount = Math.max(0, pitch.likeCount - 1);
    }
    action = 'updated';
  } else {
    // New swipe
    pitch.swipes.push({ investor: investorObjectId, liked });
    if (liked) pitch.likeCount += 1;
    else pitch.dislikeCount += 1;
    action = 'created';
  }

  await pitch.save();
  return { action, pitch };
};

/**
 * Returns all pitches an investor has liked (liked: true).
 * Projects only their own swipe entry from the swipes array.
 */
const getLikedPitches = async (investorId) => {
  const investorObjectId = new mongoose.Types.ObjectId(investorId);

  const pitches = await Pitch.find({
    swipes: {
      $elemMatch: { investor: investorObjectId, liked: true },
    },
  })
    .select('title description industry fundingGoal equityOffered innovator fundingStatus likeCount createdAt')
    .populate('innovator', 'name bio avatarUrl')
    .sort({ createdAt: -1 })
    .lean();

  return pitches;
};

/**
 * Returns a single pitch by ID — visible to all authenticated users.
 */
const getPitchById = async (pitchId, requestingUserId, requestingRole) => {
  const pitch = await Pitch.findById(pitchId)
    .populate('innovator', 'name bio avatarUrl innovatorMeta')
    .lean();

  if (!pitch) throw new AppError('Pitch not found.', 404);

  // Investors only see their own swipe entry, not everyone else's
  if (requestingRole === 'investor') {
    const mySwipe = pitch.swipes.find((s) =>
      s.investor.toString() === requestingUserId.toString()
    );
    pitch.mySwipe = mySwipe || null;
    delete pitch.swipes;
  }

  return pitch;
};

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
