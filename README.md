# Paid Backend

A RESTful API backend for the **Paid** bill-splitting application, built with Express, TypeScript, Prisma, and PostgreSQL.

## Features

- **Authentication** - Email/password login, JWT tokens, magic link authentication for players
- **Session Management** - Create and manage bill-splitting sessions
- **Player Management** - Add players to sessions, track participation
- **Expense Tracking** - Add expenses with support for different split types
- **Payment Obligations** - Auto-generate what each player owes
- **Payment Verification** - Upload proof of payment, host verification
- **Face Detection** - AI-powered group photo processing and face enrollment
- **Input Validation** - Request validation with express-validator
- **Standardized Responses** - Consistent API response format with pagination

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - ORM for database access
- **PostgreSQL** - Relational database (via Supabase)
- **Supabase** - Storage for photos and media
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Winston** - Logging
- **Morgan** - HTTP request logging
- **Express Validator** - Input validation
- **ULID** - Unique ID generation
- **Luxon** - Date/time handling

## Project Structure

```
src/
├── app/            # Express app setup
├── config/         # Configuration (environment, logger, prisma)
├── controllers/    # Request handlers (auth, session, player, user)
├── middlewares/    # Custom middlewares (auth)
├── routes/         # API route definitions
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── validations/    # Input validation schemas
└── server.ts       # Entry point

prisma/
├── schema.prisma   # Database schema
└── seed.ts         # Database seeding

docs/               # API contracts, architecture, database docs
tests/              # Test files
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- pnpm (`npm install -g pnpm`)
- PostgreSQL (or Supabase account)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Paid-BE
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   Create a `.env` file with the following variables:

   ```env
   PORT=3000
   ENVIRONMENT=development
   JWT_SECRET=your-jwt-secret
   DATABASE_URL=postgresql://user:password@host:port/database
   DIRECT_URL=postgresql://user:password@host:port/database
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   AI_SERVICE_URL=https://your-ai-service-url
   AI_SERVICE_TOKEN=your-ai-service-token
   ```

4. Generate Prisma client:

   ```bash
   pnpm prisma:generate
   ```

5. Run database migrations:

   ```bash
   pnpm prisma:migrate
   ```

6. (Optional) Seed the database:
   ```bash
   pnpm prisma:seed
   ```

### Development

Start the development server:

```bash
pnpm dev
```

The API will be available at `http://localhost:3000/api`

### Production

Build and start:

```bash
pnpm build
pnpm start
```

## API Endpoints

### Health Check

- `GET /api/health` - Service health check

### Authentication (`/api/auth`)

| Method | Endpoint              | Description                    | Auth     |
| ------ | --------------------- | ------------------------------ | -------- |
| POST   | `/register`           | Register a new user            | Public   |
| POST   | `/login`              | Login with email/password      | Public   |
| GET    | `/profile`            | Get current user profile       | Required |
| POST   | `/magic-link`         | Generate magic link for player | Required |
| POST   | `/magic-link/verify`  | Verify magic link token        | Public   |

### Users (`/api/users`)

| Method | Endpoint       | Description                | Auth     |
| ------ | -------------- | -------------------------- | -------- |
| GET    | `/me`          | Get my profile             | Required |
| PUT    | `/me`          | Update my profile          | Required |
| POST   | `/me/photo`    | Upload profile photo       | Required |
| DELETE | `/me`          | Delete my account          | Required |
| POST   | `/me/password` | Change password            | Required |
| GET    | `/me/sessions` | Get my sessions            | Required |
| GET    | `/me/summary`  | Get payment summary        | Required |

### Sessions (`/api/sessions`)

| Method | Endpoint                             | Description                  | Auth     |
| ------ | ------------------------------------ | ---------------------------- | -------- |
| POST   | `/`                                  | Create a new session         | Required |
| GET    | `/`                                  | Get my sessions              | Required |
| GET    | `/:sessionId`                        | Get session details          | Required |
| PUT    | `/:sessionId`                        | Update session               | Required |
| DELETE | `/:sessionId`                        | Delete session               | Required |
| POST   | `/:sessionId/players`                | Add players to session       | Required |
| DELETE | `/:sessionId/players/:playerId`      | Remove player from session   | Required |
| POST   | `/:sessionId/photo`                  | Upload group photo           | Required |
| GET    | `/:sessionId/faces`                  | Get face detection results   | Required |
| POST   | `/:sessionId/faces/confirm`          | Confirm face mappings        | Required |
| POST   | `/:sessionId/expenses`               | Add expenses                 | Required |
| GET    | `/:sessionId/expenses`               | Get expense summary          | Required |
| PUT    | `/:sessionId/expenses/:expenseId`    | Update expense               | Required |
| DELETE | `/:sessionId/expenses/:expenseId`    | Delete expense               | Required |
| POST   | `/:sessionId/split`                  | Generate split/obligations   | Required |
| GET    | `/:sessionId/obligations`            | Get obligations              | Required |
| POST   | `/:sessionId/obligations/:id/verify` | Verify payment               | Required |
| POST   | `/:sessionId/obligations/:id/remind` | Send payment reminder        | Required |
| POST   | `/:sessionId/close`                  | Close session                | Required |

### Players (`/api/player`)

| Method | Endpoint                      | Description              | Auth   |
| ------ | ----------------------------- | ------------------------ | ------ |
| GET    | `/me`                         | Get player profile       | Player |
| PUT    | `/me`                         | Update player profile    | Player |
| GET    | `/sessions`                   | Get player's sessions    | Player |
| GET    | `/obligations`                | Get my obligations       | Player |
| GET    | `/obligations/:id`            | Get obligation details   | Player |
| POST   | `/obligations/:id/pay`        | Mark as paid             | Player |
| GET    | `/payments/:id`               | Get payment status       | Player |
| POST   | `/payments/:id/proof`         | Upload payment proof     | Player |
| POST   | `/payments/:id/proof/resubmit`| Resubmit payment proof   | Player |
| POST   | `/face/enroll`                | Enroll face              | Player |
| DELETE | `/face/:embeddingId`          | Delete face enrollment   | Player |

## Response Format

### Success Response

```json
{
  "message": "Success message",
  "content": {
    // Response data
  },
  "errors": []
}
```

### Paginated Response

```json
{
  "message": "Success message",
  "content": {
    "totalData": 100,
    "totalPage": 10,
    "entries": []
  },
  "errors": []
}
```

### Error Response

```json
{
  "message": "Error message",
  "content": null,
  "errors": [
    {
      "field": "email",
      "message": "Email is already in use"
    }
  ]
}
```

## Documentation

For detailed documentation, see the [`docs/`](./docs) folder:

- [API Contracts](./docs/api-contract/) - Detailed endpoint specifications
- [Database Schema](./docs/database.md) - ERD and table definitions
- [Architecture](./docs/architecture.md) - System design
- [Development Guide](./docs/development.md) - Setup and workflows
- [Project Structure](./docs/project-structure.md) - Code organization
- [Testing](./docs/testing.md) - Test setup and running tests
- [Postman Collection](./docs/postman.json) - Import for API testing

## Scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `pnpm dev`         | Start development server             |
| `pnpm build`       | Build for production                 |
| `pnpm start`       | Start production server              |
| `pnpm test`        | Run tests                            |
| `pnpm test:watch`  | Run tests in watch mode              |
| `pnpm test:coverage`| Run tests with coverage             |
| `pnpm lint`        | Run ESLint                           |
| `pnpm lint:fix`    | Fix ESLint issues                    |
| `pnpm format`      | Format code with Prettier            |
| `pnpm prisma:generate` | Generate Prisma client           |
| `pnpm prisma:migrate`  | Run database migrations          |
| `pnpm prisma:studio`   | Open Prisma Studio               |
| `pnpm prisma:seed`     | Seed the database                |

## Future Development

### Player-Account Linking

When a host adds a player who doesn't have an account yet, the player record is created without a linked user. The following feature needs to be implemented to connect new users to their existing player records:

**Scenario:**
1. Host creates session and adds player "John" with phone `+628123456789`
2. A `Player` record is created with `userId = NULL`
3. Later, John creates an account with the same phone number
4. **Problem**: How to connect John's new `User` to his existing `Player` records?

**Proposed Solution - Automatic Phone/Email Matching:**
- When a new user registers, check if their phone OR email matches any unlinked `Player` records
- Automatically set `Player.userId = newUser.id` for matching records
- Add endpoint `GET /api/sessions?role=player` to show sessions where user is a participant (not host)

**Implementation Steps:**
1. Modify `register` endpoint in `auth.controller.ts` to:
   - After creating User, find `Player` records with matching phone/email where `userId IS NULL`
   - Update those Players to link to the new User
2. Add "As Attendee" filter to `getMySessions` to return sessions where user's linked Player is a participant

**Database Support:**
The schema already supports this via `Player.userId` → `User.id` relationship (see `prisma/schema.prisma` lines 99-125).

---

## License

ISC
