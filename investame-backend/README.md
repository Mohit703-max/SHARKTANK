# InvestaMe — Backend API

Production-grade Node.js/Express/MongoDB backend for the InvestaMe startup pitching platform.

---

## Folder Structure

```
backend/
├── config/
│   └── db.js                   # MongoDB connection with reconnect logic
│
├── controllers/
│   ├── authController.js        # HTTP layer — delegates to services
│   └── pitchController.js
│
├── middleware/
│   ├── authMiddleware.js        # JWT protect + restrictTo() factory
│   ├── errorHandler.js          # Global error handler (Mongoose + JWT error transforms)
│   └── validate.js              # Joi validation middleware factory
│
├── models/
│   ├── User.js                  # User schema with role enum, bcrypt hooks, indexes
│   └── Pitch.js                 # Pitch schema with embedded swipes sub-docs
│
├── routes/
│   ├── authRoutes.js
│   └── pitchRoutes.js
│
├── services/
│   ├── authService.js           # Registration, login, JWT signing
│   └── pitchService.js          # All pitch business logic
│
├── utils/
│   ├── AppError.js              # Operational error class
│   ├── apiResponse.js           # Standardized sendSuccess() helper
│   ├── catchAsync.js            # Async handler wrapper (no try/catch boilerplate)
│   └── logger.js                # Winston logger (dev: console, prod: files)
│
├── validators/
│   ├── authValidators.js        # Joi schemas for auth routes
│   └── pitchValidators.js       # Joi schemas for pitch routes
│
├── server.js                    # App bootstrap, middleware, routes, graceful shutdown
├── .env.example
└── package.json
```

---

## Architecture Decisions

### MVC + Service Layer

Routes → Controllers → Services → Models

- **Routes**: wiring only (apply middleware, call controller)
- **Controllers**: extract HTTP concerns (req/res), delegate to service
- **Services**: pure business logic, no Express objects
- **Models**: schema, indexes, instance methods

This separation means services are independently testable and reusable across future REST/GraphQL/gRPC interfaces.

### Error Handling

- `AppError` for operational errors (user-facing, known failures)
- `catchAsync` wraps all async handlers — no try/catch in controllers
- `globalErrorHandler` transforms Mongoose/JWT errors in production and sends clean responses

### Authentication

- JWT, stateless
- `protect` middleware verifies token, fetches user from DB, attaches to `req.user`
- `restrictTo(...roles)` factory — composable role guard per route

### Validation

- Joi schemas in `validators/` — single source of truth for input rules
- `validate(schema)` middleware strips unknown fields (prevents mass assignment), coerces types, collects all errors

### The Feed Query (Critical)

```javascript
// Correct query — finds pitches where investor is NOT in any swipes entry
{ 'swipes.investor': { $ne: investorObjectId } }
```

This works because MongoDB evaluates `$ne` across the entire array. A document is returned only if **no element** in `swipes` has `investor === investorObjectId`. Compound index on `swipes.investor` ensures this scales.

---

## API Reference

### Auth

| Method | Endpoint            | Auth | Role | Body                              |
|--------|---------------------|------|------|-----------------------------------|
| POST   | /api/auth/register  | No   | —    | name, email, password, role       |
| POST   | /api/auth/login     | No   | —    | email, password                   |
| GET    | /api/auth/me        | JWT  | Any  | —                                 |

### Pitches

| Method | Endpoint                      | Auth | Role       | Notes                         |
|--------|-------------------------------|------|------------|-------------------------------|
| POST   | /api/pitches                  | JWT  | innovator  | Create pitch                  |
| GET    | /api/pitches/my               | JWT  | innovator  | Own pitches + swipe data      |
| PATCH  | /api/pitches/:pitchId         | JWT  | innovator  | Update own pitch              |
| DELETE | /api/pitches/:pitchId         | JWT  | innovator  | Delete own pitch              |
| GET    | /api/pitches/feed             | JWT  | investor   | Unswiped pitches, paginated   |
| GET    | /api/pitches/liked            | JWT  | investor   | Pitches investor liked        |
| POST   | /api/pitches/:pitchId/swipe   | JWT  | investor   | Body: { liked: bool }         |
| GET    | /api/pitches/:pitchId         | JWT  | both       | Single pitch detail           |

#### Feed Query Parameters

```
GET /api/pitches/feed?page=1&limit=10&industry=Technology&sort=newest
```

| Param    | Values                                              | Default  |
|----------|-----------------------------------------------------|----------|
| page     | integer ≥ 1                                         | 1        |
| limit    | 1–50                                                | 10       |
| industry | Technology, Healthcare, Finance, Education, …       | (all)    |
| sort     | newest, oldest, fundingGoal_asc, fundingGoal_desc   | newest   |

---

## Setup

```bash
git clone <repo>
cd backend
cp .env.example .env     # Fill in MONGO_URI and JWT_SECRET
npm install
npm run dev
```

---

## Scaling Roadmap

### Phase 1 — MVP (Now)
- [x] MVC + Service architecture
- [x] JWT auth + RBAC
- [x] Pitch CRUD, swipe, feed with pagination
- [x] Joi validation, global error handling
- [x] Rate limiting, helmet, mongo-sanitize

### Phase 2 — Growth
- [ ] NestJS migration for DI and decorators
- [ ] Redis for feed caching (reduce DB reads at scale)
- [ ] Mongoose transactions for counter updates (swipeOnPitch)
- [ ] Cloudinary / S3 for pitch attachments
- [ ] Email verification flow (Nodemailer / Resend)
- [ ] Refresh token rotation

### Phase 3 — AI Integration
- [ ] AI pitch scoring service (separate microservice, called via HTTP from pitchService)
- [ ] Vector embeddings for semantic investor-pitch matching (Pinecone / pgvector)
- [ ] AI-powered feed ranking (replace simple sort with scored sort)

### Phase 4 — Marketplace
- [ ] Job posting system (restricted to funded startups)
- [ ] Applicant tracking
- [ ] Stripe integration for premium features
- [ ] NDA document workflow (DocuSign / custom)
- [ ] Real-time notifications (Socket.IO or Pusher)

---

## Why MongoDB Over PostgreSQL (for MVP)

| Concern                        | MongoDB                          | PostgreSQL                    |
|-------------------------------|----------------------------------|-------------------------------|
| Swipes sub-document            | Natural fit (array in pitch)     | Requires join table           |
| Schema flexibility (MVP speed) | High                             | Lower (migrations)            |
| Aggregate analytics            | Possible ($group, $facet)        | Better with complex queries   |
| Investor-Pitch many-to-many    | Embedded swipes (current)        | Junction table                |

**Migrate to PostgreSQL when:** you introduce complex financial reporting, audit trails, or NDA legal workflows that require ACID transactions across many entities.

---

## Known Technical Debt to Address Before Investor Demo

1. **Swipe counter race condition** — `likeCount`/`dislikeCount` updates are not atomic. Fix with MongoDB `$inc` operator via `findOneAndUpdate` instead of `save()`.
2. **Feed performance** — Add `fundingStatus: 1, 'swipes.investor': 1` compound index.
3. **JWT secret rotation** — Add `tokenVersion` to user schema; increment on password change to invalidate old tokens.
4. **Input length attacks** — Already handled via `express.json({ limit: '10kb' })`.
