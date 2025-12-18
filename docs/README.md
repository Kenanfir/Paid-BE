# Paid Backend Documentation

Welcome to the **Paid** backend API documentation. This is a Node.js/TypeScript bill-splitting application with face detection-assisted player identification.

## 📚 Documentation Index

### Core Documentation

| Document | Description |
|----------|-------------|
| [Database Schema](./database.md) | **Database-first contract** — ERD, table definitions, enums, business rules |
| [Architecture](./architecture.md) | System design, component interactions, middleware pipeline |
| [Project Structure](./project-structure.md) | Codebase organization and file structure |
| [Development Guide](./development.md) | Setup, scripts, workflow, debugging |
| [Testing](./testing.md) | Test configuration and execution |

### API Contracts

| Endpoint Group | Document | Description |
|----------------|----------|-------------|
| Authentication | [auth.md](./api-contract/auth.md) | Login, register, OAuth, magic links |
| Sessions | [session.md](./api-contract/session.md) | Create sessions, manage players, expenses, splits |
| Players | [player.md](./api-contract/player.md) | View obligations, mark paid, upload proofs |
| Users | [user.md](./api-contract/user.md) | User profile management |

### Postman Collections

| Collection | Description |
|------------|-------------|
| [Full Collection](./postman.json) | Complete API collection with all endpoints |
| [Auth Routes](./postman/auth-routes.json) | Authentication endpoints |
| [User Routes](./postman/user-routes.json) | User management endpoints |
| [Session Routes](./postman/session-routes.json) | Session/event endpoints |
| [Player Routes](./postman/player-routes.json) | Player operations and payment endpoints |

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env

# Run migrations
pnpm prisma:migrate
pnpm prisma:generate

# Start development server
pnpm dev
```

**API Base URL:** `http://localhost:3000/api`  
**Health Check:** `GET /api/health`

---

## 🛠 Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** JWT tokens + Magic links
- **Face Detection:** pgvector for embeddings
- **Security:** Helmet, CORS, bcryptjs

---

## 📋 App Flow

The bill-splitting workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CREATE SESSION                                              │
│     Host creates session with name and date                     │
├─────────────────────────────────────────────────────────────────┤
│  2. ADD PLAYERS                                                 │
│     Host adds participants (Felly, Jessica, James, etc.)        │
├─────────────────────────────────────────────────────────────────┤
│  3. ADD IMAGE (Optional)                                        │
│     Upload group photo → Face detection → Confirm mappings      │
├─────────────────────────────────────────────────────────────────┤
│  4. ADD EXPENSES                                                │
│     Court: 2x IDR 60,000 = IDR 120,000                          │
│     Shuttlecock: 1x IDR 15,000 = IDR 15,000                     │
│     Total: IDR 135,000                                          │
├─────────────────────────────────────────────────────────────────┤
│  5. GENERATE SPLIT                                              │
│     IDR 135,000 ÷ 5 players = IDR 27,000 per person             │
├─────────────────────────────────────────────────────────────────┤
│  6. COLLECT PAYMENTS                                            │
│     Players mark paid → Upload proof → Host verifies            │
├─────────────────────────────────────────────────────────────────┤
│  7. CLOSE SESSION                                               │
│     All verified → Session complete                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Quick Links

- [Common API Conventions](./api-contract/auth.md#common-api-conventions)
- [Database ERD](./database.md#entity-relationship-diagram)
- [Session Status Flow](./api-contract/session.md#session-status-enum)
- [Payment Status Flow](./api-contract/player.md#payment-status-flow)
- [Environment Variables](./development.md#environment-variables)

---

*Last updated: December 2024*