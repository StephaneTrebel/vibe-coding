# Teen Budget App - Project Plan

## Overview

A web-based budget application designed for young adults (17-20) to learn financial management, track spending in Euros, set savings goals, and develop healthy money habits.

---

## Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | Svelte + SvelteKit | Minimal bundle size, simple syntax, fast performance |
| **Backend** | Rust + Axum | High performance, memory safety, excellent async support |
| **Database** | SQLite | Simple, portable, sufficient for single-user/small-scale |
| **Deployment** | Docker Compose | Easy local/server deployment, all components unified |

### Why Axum for Rust Backend?

- Built on Tokio (industry-standard async runtime)
- Ergonomic API design with type-safe extractors
- Excellent middleware ecosystem (tower)
- Active maintenance by Tokio team
- Good documentation and growing community

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│  ┌─────────────────────┐    ┌─────────────────────────┐ │
│  │   Frontend          │    │   Backend               │ │
│  │   Svelte + Vite     │───▶│   Rust + Axum           │ │
│  │   Port: 5173        │    │   Port: 3000            │ │
│  └─────────────────────┘    └───────────┬─────────────┘ │
│                                         │               │
│                              ┌──────────▼─────────────┐ │
│                              │   SQLite Database      │ │
│                              │   /data/budget.db      │ │
│                              └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
teen-budget-app/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── svelte.config.js
│   ├── vite.config.js
│   └── src/
│       ├── routes/
│       │   ├── +page.svelte          # Dashboard
│       │   ├── +layout.svelte        # App shell
│       │   ├── transactions/
│       │   ├── budget/
│       │   └── goals/
│       ├── lib/
│       │   ├── components/
│       │   ├── stores/
│       │   └── api.js
│       └── app.css
├── backend/
│   ├── Dockerfile
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       ├── routes/
│       ├── models/
│       ├── db/
│       └── error.rs
└── data/                              # SQLite volume mount
```

---

## Core Features (MVP)

### Authentication
- [ ] User registration with email/password
- [ ] Login/logout functionality
- [ ] JWT-based session management
- [ ] Password hashing (Argon2)

### Dashboard
- [ ] Current balance display (in €)
- [ ] Recent transactions list
- [ ] Monthly spending summary chart
- [ ] Quick-add transaction button

### Transactions
- [ ] Add income (allowance, job, gifts, other)
- [ ] Add expense with category selection
- [ ] Edit/delete transactions
- [ ] Transaction history with filters

### Categories
- [ ] Predefined expense categories:
  - Food & Drinks
  - Transportation
  - Entertainment
  - Shopping
  - Subscriptions
  - Education
  - Other
- [ ] Predefined income categories:
  - Allowance
  - Part-time job
  - Gifts
  - Other

### Budget
- [ ] Set monthly budget limit
- [ ] Budget vs actual spending view
- [ ] Visual progress indicator

### Savings Goals
- [ ] Create savings goal with target amount
- [ ] Track progress toward goal
- [ ] Mark goal as achieved

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Monthly budgets table
CREATE TABLE budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month TEXT NOT NULL,  -- Format: YYYY-MM
    amount REAL NOT NULL,
    UNIQUE(user_id, month),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Savings goals table
CREATE TABLE savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    achieved BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user |
| POST | `/api/auth/login` | Login, receive JWT |
| POST | `/api/auth/logout` | Invalidate session |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List user transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

### Budget
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budget/:month` | Get budget for month |
| POST | `/api/budget` | Set/update monthly budget |

### Savings Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List savings goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal progress |
| DELETE | `/api/goals/:id` | Delete goal |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Balance, monthly stats |

---

## Rust Dependencies (Cargo.toml)

```toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.7", features = ["runtime-tokio", "sqlite"] }
tower-http = { version = "0.5", features = ["cors", "trace"] }
jsonwebtoken = "9"
argon2 = "0.5"
chrono = { version = "0.4", features = ["serde"] }
dotenvy = "0.15"
tracing = "0.1"
tracing-subscriber = "0.3"
```

---

## UI/UX Design Principles

- **Clean, modern aesthetic** appropriate for young adults
- **Mobile-first responsive design** (primary usage on phones)
- **Euro formatting** with proper locale (€ symbol, comma decimal)
- **Quick transaction entry** (minimal taps/clicks)
- **Visual feedback** (progress bars, charts)
- **Color-coded categories** for easy recognition

---

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:3000

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:/app/data/budget.db
      - JWT_SECRET=${JWT_SECRET}
```

---

## Development Phases

### Phase 1: Foundation
1. Set up project structure
2. Configure Docker Compose
3. Create Rust backend skeleton with Axum
4. Set up SQLite with SQLx migrations
5. Create Svelte frontend skeleton

### Phase 2: Core Features
1. Implement authentication (register/login)
2. Build transaction CRUD operations
3. Create dashboard with balance display
4. Add basic spending chart

### Phase 3: Budget & Goals
1. Implement monthly budget feature
2. Add savings goals functionality
3. Create budget vs actual comparison view

### Phase 4: Polish
1. Refine UI/UX
2. Add form validation
3. Error handling improvements
4. Testing and bug fixes

---

## Future Enhancements (Post-MVP)

- Multiple currency support
- Recurring transactions
- Export to CSV
- Dark mode
- Achievement badges
- Financial tips/education section
- PWA support for mobile installation
