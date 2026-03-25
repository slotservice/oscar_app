# OSCAR MVP — System Architecture & Technical Specification

## 1. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                           │
│                                                     │
│  ┌──────────────┐          ┌──────────────────┐     │
│  │  Mobile App   │          │   Admin Panel     │     │
│  │ (React Native │          │   (React + Vite)  │     │
│  │  + Expo)      │          │                  │     │
│  │  Tablet-first │          │  Desktop web     │     │
│  └──────┬───────┘          └────────┬─────────┘     │
└─────────┼──────────────────────────┼────────────────┘
          │         REST API         │
          ▼                          ▼
┌─────────────────────────────────────────────────────┐
│                  BACKEND (Node + Express)            │
│                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │   Auth      │ │  API Routes│ │  Rules Engine   │  │
│  │ (JWT)       │ │  (REST)    │ │  (Threshold +   │  │
│  │             │ │            │ │   Tag-based)    │  │
│  └────────────┘ └────────────┘ └────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │            Prisma ORM                         │   │
│  └──────────────────┬───────────────────────────┘   │
└─────────────────────┼───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│                                                     │
│  Users · Plants · Rounds · Checklist · Labs         │
│  Observations · Suggestions · Issues · Rules        │
└─────────────────────────────────────────────────────┘
```

### Design Principles
- **Simple**: No unnecessary abstraction. Direct routes, direct queries.
- **Modular**: Each domain (checklist, labs, suggestions) has its own route file.
- **Scalable**: Multi-tenant by plant. Add plants without code changes.
- **Offline-aware**: Auto-save on every input. Future: local-first sync.

---

## 2. Database Schema

### Tables & Relationships

```
users ──┬── user_plants ──┬── plants
        │                 │
        │                 ├── checklist_sections ── checklist_items
        │                 ├── lab_fields
        │                 ├── observation_tags
        │                 ├── threshold_rules
        │                 └── tag_rules
        │
        └── daily_rounds ──┬── checklist_entries
                           ├── lab_entries
                           ├── observation_entries
                           ├── suggestions
                           └── issues
```

### Key Tables

| Table | Purpose |
|---|---|
| `users` | Operators, supervisors, admins |
| `plants` | Wastewater facilities |
| `user_plants` | User ↔ Plant assignments |
| `checklist_sections` | Grouped sections (Arrival, Mechanical, etc.) |
| `checklist_items` | Individual checklist tasks |
| `lab_fields` | Configurable lab parameters (DO, pH, etc.) |
| `observation_tags` | Selectable observation tags |
| `threshold_rules` | Lab value threshold rules |
| `tag_rules` | Observation tag trigger rules |
| `daily_rounds` | One record per operator per plant per day |
| `checklist_entries` | OK / Attention / N/A per item |
| `lab_entries` | Numeric lab values per round |
| `observation_entries` | Selected tags per round |
| `suggestions` | Generated suggestions per round |
| `issues` | Operator-entered issues & actions |

### Data Retention
- All records stored indefinitely (10-year requirement)
- Active analysis window: last 5–10 days of lab data for trend evaluation

---

## 3. API Design

Base URL: `/api`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/register` | Create user (admin) |
| GET | `/auth/me` | Current user profile |

### Plants
| Method | Endpoint | Description |
|---|---|---|
| GET | `/plants` | User's assigned plants |
| GET | `/plants/:id` | Plant details |

### Daily Rounds
| Method | Endpoint | Description |
|---|---|---|
| POST | `/rounds` | Start new daily round |
| GET | `/rounds/:id` | Get round with all data |
| PUT | `/rounds/:id` | Update round (notes, sign-off) |
| GET | `/rounds/:id/summary` | Full round summary |

### Checklist
| Method | Endpoint | Description |
|---|---|---|
| GET | `/rounds/:roundId/checklist` | All sections + items + entries |
| PUT | `/rounds/:roundId/checklist/:itemId` | Save checklist entry |

### Labs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/rounds/:roundId/labs` | Lab fields with entries |
| PUT | `/rounds/:roundId/labs/:fieldId` | Save lab value |

### Observations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/rounds/:roundId/observations` | Tags + entries |
| POST | `/rounds/:roundId/observations` | Add observation |
| DELETE | `/rounds/:roundId/observations/:id` | Remove observation |

### Suggestions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/rounds/:roundId/evaluate` | Run rules engine |
| GET | `/rounds/:roundId/suggestions` | Get suggestions |
| PUT | `/rounds/:roundId/suggestions/:id/ack` | Acknowledge |

### Issues
| Method | Endpoint | Description |
|---|---|---|
| GET | `/rounds/:roundId/issues` | List issues |
| POST | `/rounds/:roundId/issues` | Create issue |
| PUT | `/rounds/:roundId/issues/:id` | Update issue |

### History
| Method | Endpoint | Description |
|---|---|---|
| GET | `/history` | Rounds by plant + date range |
| GET | `/history/:roundId` | Full historical round |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| CRUD | `/admin/plants/*` | Manage plants |
| CRUD | `/admin/plants/:id/sections/*` | Manage sections |
| CRUD | `/admin/sections/:id/items/*` | Manage checklist items |
| CRUD | `/admin/plants/:id/lab-fields/*` | Manage lab fields |
| CRUD | `/admin/plants/:id/thresholds/*` | Manage threshold rules |
| CRUD | `/admin/plants/:id/tags/*` | Manage observation tags |
| CRUD | `/admin/plants/:id/tag-rules/*` | Manage tag rules |
| CRUD | `/admin/users/*` | Manage users |

---

## 4. Rules Engine Design

### Overview
The rules engine is **NOT AI**. It is a simple, deterministic evaluation system.

### Rule Types

**1. Threshold Rules** — evaluate lab values against configured limits:
```
IF lab_value < critical_low  → RED   + suggestion
IF lab_value < caution_low   → YELLOW + suggestion
IF lab_value > caution_high  → YELLOW + suggestion
IF lab_value > critical_high → RED   + suggestion
```

**2. Tag Rules** — trigger on selected observation tags:
```
IF observation_tag == "Cloudy clarifier" → suggestion + severity
```

**3. Trend Analysis** — compare current values to recent history (5–10 days):
```
IF current_value deviates significantly from rolling average → suggestion
IF consecutive days of declining/rising trend → suggestion
```

### Condition Scoring
Each round gets an overall condition based on the worst triggered rule:
- **GREEN** — All values normal, no tags triggered
- **YELLOW** — At least one caution-level rule triggered
- **RED** — At least one critical-level rule triggered

### Execution Flow
```
1. Operator submits lab data + observations
2. System loads plant's threshold rules + tag rules
3. System loads last 5–10 days of lab data
4. Evaluate each threshold rule against current values
5. Evaluate each tag rule against selected observations
6. Evaluate trends (rolling average deviation)
7. Generate suggestion records with severity
8. Compute overall condition (worst severity wins)
9. Store suggestions + update round condition
10. Return suggestions to operator
```

---

## 5. Mobile App Screen Structure

```
Auth Stack
  └── LoginScreen

Main Stack
  ├── PlantSelectScreen
  ├── DashboardScreen (plant overview)
  │
  ├── Round Flow (linear)
  │   ├── RoundScreen (section menu)
  │   ├── ChecklistScreen (per section)
  │   ├── LabEntryScreen
  │   ├── ObservationsScreen
  │   ├── SuggestionsScreen
  │   ├── IssuesScreen
  │   └── SummaryScreen (sign-off)
  │
  └── HistoryScreen
```

### Screen Responsibilities

| Screen | What it does |
|---|---|
| Login | Email + password → JWT |
| Plant Select | Pick from assigned plants |
| Dashboard | Today's status, recent rounds, start new round |
| Round | Section menu with completion indicators |
| Checklist | OK / Attention / N/A buttons per item, notes |
| Lab Entry | Numeric fields grouped together |
| Observations | Tag selector with optional notes |
| Suggestions | Rule-generated suggestions with acknowledge |
| Issues | Add/edit issues and actions taken |
| Summary | Full round overview + sign-off button |
| History | Past rounds with date filter |

---

## 6. Admin Panel Structure

```
Sidebar Layout
  ├── Dashboard (system overview)
  ├── Plants (CRUD)
  ├── Users (CRUD + plant assignment)
  ├── Checklist Config (sections + items per plant)
  ├── Thresholds (lab rules per plant)
  └── Round History (view all rounds)
```

---

## 7. Tech Stack

| Layer | Technology | Reasoning |
|---|---|---|
| Mobile | React Native + Expo | Cross-platform, tablet support, large ecosystem, fast dev |
| Admin | React + Vite | Fast, lightweight, shares TS types with backend |
| Backend | Node.js + Express + TypeScript | Simple, fast, huge ecosystem, easy to hire for |
| Database | PostgreSQL | Robust, relational, great for structured data, 10-year retention |
| ORM | Prisma | Type-safe, auto-migrations, great DX |
| Auth | JWT (jsonwebtoken + bcrypt) | Simple, stateless, works offline |
| Hosting | Any cloud (AWS/GCP/Azure) | PostgreSQL + Node.js runs anywhere |

---

## 8. MVP Development Plan

### Phase 1 — Foundation (Week 1–2)
- Project scaffolding (monorepo)
- Database schema + migrations
- Auth system (login, JWT, roles)
- Plant management
- Basic mobile navigation

### Phase 2 — Core Flow (Week 3–4)
- Daily round creation
- Checklist sections + items
- Status buttons (OK / Attention / N/A)
- Lab data entry
- Observation tags
- Auto-save on every input

### Phase 3 — Intelligence (Week 5)
- Threshold rules engine
- Tag-based rules
- Trend analysis (5–10 day window)
- Suggestion generation
- Condition scoring (green/yellow/red)

### Phase 4 — Management (Week 6)
- Admin panel (web)
- Plant configuration
- User management
- Checklist configuration
- Threshold configuration
- Round history view

### Phase 5 — Polish (Week 7–8)
- Summary & sign-off flow
- History timeline
- UI polish (tablet optimization)
- Error handling
- Testing
- Deployment setup

---

## 9. Estimated Timeline

| Phase | Duration | Deliverable |
|---|---|---|
| Foundation | 2 weeks | Auth, schema, navigation |
| Core Flow | 2 weeks | Complete daily round workflow |
| Intelligence | 1 week | Rules engine + suggestions |
| Management | 1 week | Admin panel |
| Polish | 2 weeks | Testing, UI, deployment |
| **Total** | **~8 weeks** | **Working MVP** |

---

## 10. Code Structure

```
oscar-mvp/
├── package.json                 # Workspace root
├── ARCHITECTURE.md              # This document
├── docs/                        # Client requirements
│
├── packages/
│   ├── shared/                  # Shared TypeScript types
│   │   └── src/
│   │       └── index.ts         # Types + constants
│   │
│   ├── backend/                 # Express API + Rules Engine
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Database schema
│   │   │   └── seed.ts          # Demo data
│   │   └── src/
│   │       ├── index.ts         # Server entry
│   │       ├── config.ts        # Environment config
│   │       ├── middleware/
│   │       │   └── auth.ts      # JWT middleware
│   │       ├── routes/
│   │       │   ├── auth.ts
│   │       │   ├── plants.ts
│   │       │   ├── rounds.ts
│   │       │   ├── checklist.ts
│   │       │   ├── labs.ts
│   │       │   ├── observations.ts
│   │       │   ├── suggestions.ts
│   │       │   ├── issues.ts
│   │       │   ├── admin.ts
│   │       │   └── history.ts
│   │       └── engine/
│   │           └── rules.ts     # Rules engine
│   │
│   ├── mobile/                  # React Native (Expo)
│   │   ├── App.tsx
│   │   └── src/
│   │       ├── api/client.ts
│   │       ├── theme/index.ts
│   │       ├── hooks/useAutoSave.ts
│   │       ├── navigation/AppNavigator.tsx
│   │       ├── screens/         # 11 screens
│   │       └── components/      # 5 reusable components
│   │
│   └── admin/                   # React web admin
│       └── src/
│           ├── App.tsx
│           ├── api/client.ts
│           └── pages/           # 6 pages
```
