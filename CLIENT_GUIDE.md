# OSCAR Beta — Client Delivery Guide

## What is OSCAR?

OSCAR is a wastewater plant operations management system. It helps operators record daily plant data, automatically evaluates plant stability using a 40-rule scoring engine, and provides supervisory oversight through an admin dashboard.

---

## What's Included

### 1. Mobile App (iOS & Android)
The operator's daily tool. Built with React Native + Expo.

**Screens:**
- **Login** — Secure JWT authentication
- **Plant Select** — Choose from assigned facilities
- **Dashboard** — Today's status, stability score, start/continue round
- **Daily Round** — Section menu with completion indicators
- **Checklist** — 28 items across 4 sections (OK / Attention / N/A + photo capture)
- **Lab & Operating Data** — 12 fields (8 required daily + 4 optional), auto-save
- **Process Observations** — 11 structured checkbox flags
- **Suggestions** — OSCAR Stability Index score (0-100), triggered rules with severity, acknowledge
- **Issues & Actions** — Report problems, flag for supervisor
- **Summary & Sign Off** — Review everything and sign off the round
- **History** — View past rounds with condition badges
- **Monthly Report** — Aggregated monthly summary with trends and recommendations

**Features:**
- Dark / Light mode toggle
- Auto-login (token persisted securely)
- Operator levels: Veteran sees only data entry, Experienced sees partial checklist, Trainee sees everything
- Image capture for checklist attention items
- Required field indicators (red asterisk)

### 2. Admin Panel (Web)
The management dashboard. Built with React + Vite.

**Pages:**
- **Dashboard** — Plant and user overview
- **Plants** — Add/edit/delete facilities
- **Users** — Manage operators with roles (Admin/User) and levels (Veteran/Experienced/Trainee)
- **Checklist Config** — Add/remove sections and items, set operator level per item
- **Thresholds** — Configure lab value alert limits per plant
- **Lab Fields** — Manage lab data fields (name, unit, required/optional)
- **Observation Tags** — Manage structured operator observation flags
- **Round History** — View all rounds, stability scores, category breakdowns, monthly reports
- **Logic Matrix** — Read-only view of all 40 OSCAR scoring rules

### 3. Backend API (Node.js + Express)
The server that powers everything. 11 route modules, JWT auth, Prisma ORM.

### 4. OSCAR Scoring Engine
The intelligence layer. Located in `packages/backend/src/engine/scoring/`.

**How it works:**
1. Start each day at **100 points**
2. Evaluate 40 rules across 5 categories
3. Subtract deductions (capped per category)
4. Apply composite escalation rules
5. Smooth the display score (60% today + 25% yesterday + 15% two days ago)
6. Calculate confidence based on data completeness
7. Output: Score, Status Band, Primary Concern, Guidance

**Categories & Weights:**
| Category | Max Points | What It Evaluates |
|---|---|---|
| Solids Stability | 25 | MLSS trends, wasting balance |
| Clarifier Stability | 25 | Blanket depth, RAS, settling |
| Biological Support | 25 | DO, temperature, ammonia |
| Hydraulic Stability | 15 | Flow changes and surges |
| Operator Concern Flags | 10 | Visual/operational observations |

**Status Bands:**
| Score | Status | Meaning |
|---|---|---|
| 85-100 | Stable | Plant operating normally |
| 70-84 | Slight Drift | Early trend change, monitor |
| 50-69 | Moderate Concern | Multiple indicators show stress |
| 0-49 | High Risk | Elevated instability risk |

### 5. Database (PostgreSQL)
16 tables covering users, plants, rounds, checklists, labs, observations, suggestions, issues, and rules.

---

## Demo Credentials

| Account | Email | Password | Role | Level |
|---|---|---|---|---|
| Admin | admin@oscar.app | admin123 | ADMIN | EXPERIENCED |
| Operator | operator@oscar.app | operator123 | USER | TRAINEE |
| Veteran | veteran@oscar.app | veteran123 | USER | VETERAN |

**Demo Plant:** Greenfield WWTP (Activated Sludge, Greenfield, KS)

---

## Testing Walkthrough

### Test 1: Complete a Daily Round (Mobile App)

1. Login as `operator@oscar.app / operator123`
2. Select "Greenfield WWTP"
3. Tap "Start Daily Round"
4. Go through each checklist section:
   - Tap **OK** for most items
   - Tap **Attention** on one or two items — add a note, take a photo
5. Go to "Labs & Operating Data":
   - Enter these values to trigger scoring rules:
     - **Influent Flow:** `0.5`
     - **MLSS:** `2500`
     - **DO:** `0.8` (low — will trigger biological rules)
     - **Temperature:** `65`
     - **RAS Rate:** `150`
     - **RAS Concentration:** `5000`
     - **WAS Rate:** `2000`
     - **Blanket Depth:** `3.5` (elevated — will trigger clarifier rules)
6. Go to "Process Observations":
   - Select "Cloudy effluent" and "Poor visible settling"
7. Go to "Review Suggestions":
   - Tap **"Run Evaluation"**
   - You should see: Stability Score, Status Band, triggered rules with severity and deductions
   - Acknowledge each suggestion
8. Go to "Issues & Actions":
   - Add: "Low DO detected — checked blower #2"
   - Toggle "Flag for Supervisor"
9. Go to "Summary & Sign Off":
   - Review stats
   - Tap **"Sign Off Daily Round"**

### Test 2: Review as Admin (Web Panel)

1. Open admin panel in browser
2. Login as `admin@oscar.app / admin123`
3. Go to **Round History** → View the completed round → See stability score + category breakdown
4. Go to **Monthly Report** → Select month → View aggregated report
5. Go to **Logic Matrix** → See all 40 scoring rules
6. Go to **Users** → Edit operator level for any user
7. Go to **Checklist Config** → Change minimum level on items

### Test 3: Operator Levels

1. Login to mobile as `veteran@oscar.app / veteran123`
2. Start a round — notice the checklist is **shorter** (veteran sees fewer items)
3. Login as `operator@oscar.app / operator123` — see the **full** checklist

---

## AWS Deployment Guide

### Prerequisites
- AWS Account
- AWS CLI installed and configured (`aws configure`)
- Domain name (optional but recommended)

### Architecture on AWS
```
[Mobile App]  →  [API Gateway / ALB]  →  [ECS or EC2]  →  [RDS PostgreSQL]
[Admin Panel] →  [S3 + CloudFront]
```

### Step 1: Create RDS PostgreSQL Database

1. Go to **AWS RDS Console** → Create Database
2. Settings:
   - Engine: PostgreSQL 16
   - Template: Free tier (for testing) or Production
   - DB Instance: `oscar-db`
   - Master username: `postgres`
   - Master password: (choose a strong password)
   - Storage: 20 GB (expandable)
   - VPC: Default or your custom VPC
   - Public access: Yes (for initial setup, restrict later)
3. Wait for the database to become "Available"
4. Note the **Endpoint** (e.g., `oscar-db.xxxx.us-east-1.rds.amazonaws.com`)

### Step 2: Deploy Backend to EC2

1. **Launch EC2 Instance:**
   - AMI: Amazon Linux 2023 or Ubuntu 22.04
   - Instance type: t3.small (or t3.micro for testing)
   - Security group: Allow ports 22 (SSH), 3000 (API), 443 (HTTPS)
   - Key pair: Create or select existing

2. **SSH into the instance:**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

3. **Install dependencies:**
   ```bash
   # Node.js 18
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs git

   # PM2 for process management
   sudo npm install -g pm2
   ```

4. **Clone and setup the project:**
   ```bash
   git clone <your-repo-url> oscar-app
   cd oscar-app

   # Install dependencies
   npm install
   cd packages/mobile && npm install && cd ../..

   # Create .env file
   cat > packages/backend/.env << EOF
   DATABASE_URL="postgresql://postgres:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/oscar_prod"
   JWT_SECRET="your-strong-secret-key-here"
   PORT=3000
   EOF

   # Run migrations
   cd packages/backend
   npx prisma migrate deploy
   npx ts-node prisma/seed.ts

   # Build
   npm run build

   # Start with PM2
   pm2 start dist/index.js --name oscar-api
   pm2 save
   pm2 startup
   ```

5. **Test:**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Step 3: Deploy Admin Panel to S3 + CloudFront

1. **Build the admin panel:**
   ```bash
   cd packages/admin

   # Update vite.config.ts — set API proxy to your EC2 IP or domain
   npm run build
   ```

2. **Create S3 bucket:**
   ```bash
   aws s3 mb s3://oscar-admin-panel
   aws s3 website s3://oscar-admin-panel --index-document index.html --error-document index.html
   ```

3. **Upload build files:**
   ```bash
   aws s3 sync dist/ s3://oscar-admin-panel --acl public-read
   ```

4. **(Optional) Create CloudFront distribution** for HTTPS and caching.

### Step 4: Configure Domain (Optional)

1. Go to **Route 53** → Create hosted zone for your domain
2. Create A record pointing to EC2 IP (for API)
3. Create CNAME pointing to CloudFront (for admin panel)
4. Install SSL certificate via **AWS Certificate Manager**

### Step 5: Build Mobile App for Production

1. **Update API URL:**
   Edit `packages/mobile/src/api/client.ts`:
   ```
   const API_BASE = 'https://your-api-domain.com/api';
   ```

2. **Build APK (Android):**
   ```bash
   cd packages/mobile
   eas build --platform android --profile production
   ```

3. **Build IPA (iOS):**
   ```bash
   eas build --platform ios --profile production
   ```
   Note: iOS requires an Apple Developer account ($99/year).

### Step 6: Security Hardening

- [ ] Change all default passwords (admin123, operator123, veteran123)
- [ ] Set a strong JWT_SECRET in production .env
- [ ] Restrict RDS public access (make it VPC-only)
- [ ] Add rate limiting to the API (e.g., `express-rate-limit`)
- [ ] Enable HTTPS on EC2 (via nginx reverse proxy + Let's Encrypt, or ALB)
- [ ] Set up automated database backups in RDS
- [ ] Configure EC2 security group to only allow necessary ports

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo |
| Admin Panel | React + Vite + TypeScript |
| Backend API | Node.js + Express + TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Auth | JWT (bcrypt + jsonwebtoken) |
| Scoring Engine | Custom TypeScript (40 rules, 5 categories) |

---

## Project Structure

```
oscar-app/
├── packages/
│   ├── shared/          → Shared TypeScript types & constants
│   ├── backend/         → Express API + Scoring Engine + Prisma
│   │   ├── prisma/      → Schema, migrations, seed data
│   │   └── src/
│   │       ├── engine/scoring/  → 40-rule OSCAR scoring engine
│   │       ├── routes/          → 11 API route modules
│   │       └── middleware/      → JWT auth
│   ├── mobile/          → React Native (Expo) mobile app
│   │   └── src/
│   │       ├── screens/         → 12 screens
│   │       ├── components/      → 6 reusable components
│   │       └── theme/           → Dark/Light mode
│   └── admin/           → React web admin panel
│       └── src/
│           ├── pages/           → 9 pages
│           └── theme/           → Dark/Light mode
├── CLIENT_GUIDE.md      → This document
├── ARCHITECTURE.md      → Technical architecture
├── project_status&plan.md → Implementation tracking
└── oscar_beta_developer_spec.xlsx → Scoring rules specification
```

---

## Support

For questions, feature requests, or issues:
- Contact Daniel (developer)
- All code is documented and expandable
- The scoring engine rules can be adjusted per plant through the admin panel (thresholds) or in code (scoring rules)
