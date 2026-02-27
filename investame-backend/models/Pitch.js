const mongoose = require('mongoose');

const FUNDING_STATUS = Object.freeze({
  OPEN: 'open',
  FUNDED: 'funded',
  CLOSED: 'closed',
});

// ─── Swipe Sub-schema ──────────────────────────────────────────────────────────
const swipeSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    liked: {
      type: Boolean,
      required: true,
    },
    swipedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // Embedded — no separate ObjectId needed
);

// ─── Pitch Schema ──────────────────────────────────────────────────────────────
const pitchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Pitch title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Pitch description is required'],
      trim: true,
      minlength: [30, 'Description must be at least 30 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: {
        values: [
          'Technology',
          'Healthcare',
          'Finance',
          'Education',
          'E-Commerce',
          'Real Estate',
          'Energy',
          'Agriculture',
          'Media',
          'Logistics',
          'Other',
        ],
        message: 'Invalid industry value',
      },
    },
    fundingGoal: {
      type: Number,
      required: [true, 'Funding goal is required'],
      min: [1000, 'Funding goal must be at least $1,000'],
    },
    equityOffered: {
      type: Number,
      min: [0.1, 'Equity must be at least 0.1%'],
      max: [100, 'Equity cannot exceed 100%'],
    },
    innovator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fundingStatus: {
      type: String,
      enum: Object.values(FUNDING_STATUS),
      default: FUNDING_STATUS.OPEN,
    },
    swipes: {
      type: [swipeSchema],
      default: [],
    },

    // Pre-computed counters — avoid expensive aggregations on every read
    likeCount: {
      type: Number,
      default: 0,
    },
    dislikeCount: {
      type: Number,
      default: 0,
    },

    // Future: attachments, documents, video links
    attachments: [
      {
        label: String,
        url: String,
        type: { type: String, enum: ['document', 'video', 'image', 'link'] },
      },
    ],

    // Future: AI scoring
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    aiFeedback: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
pitchSchema.index({ innovator: 1 });
pitchSchema.index({ industry: 1 });
pitchSchema.index({ fundingStatus: 1 });
pitchSchema.index({ createdAt: -1 });

// Compound index for the investor feed query — critical for performance
// Finds pitches where a given investor is NOT in the swipes array
pitchSchema.index({ 'swipes.investor': 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
pitchSchema.virtual('swipeCount').get(function () {
  return this.swipes.length;
});

// ─── Static helpers ────────────────────────────────────────────────────────────
pitchSchema.statics.FUNDING_STATUS = FUNDING_STATUS;

const Pitch = mongoose.model('Pitch', pitchSchema);
module.exports = Pitch;
