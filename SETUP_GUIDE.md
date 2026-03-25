# Oscar MVP — Setup & Testing Guide

## Step 0: Install Prerequisites

### A) Node.js (v18 or higher)
1. Go to https://nodejs.org
2. Download the **LTS** version (recommended)
3. Run the installer — check "Add to PATH" during install
4. Restart your terminal after installing
5. Verify:
   ```
   node -v
   npm -v
   ```

### B) PostgreSQL (v14 or higher)
1. Go to https://www.postgresql.org/download/windows/
2. Download and run the installer
3. During install:
   - Set a password for the `postgres` user (remember this!)
   - Keep the default port `5432`
   - Check "Add to PATH" if prompted
4. Verify:
   ```
   psql --version
   ```

---

## Step 1: Create the Database

Open a terminal and run:

```bash
psql -U postgres
```

Enter your PostgreSQL password, then run:

```sql
CREATE DATABASE oscar_dev;
\q
```

---

## Step 2: Configure Environment

Copy the example env file:

```bash
cd c:\Spider\Project\Shad\Project\packages\backend
copy .env.example .env
```

Edit `packages/backend/.env` and set your database password:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/oscar_dev"
JWT_SECRET="oscar-secret-key-change-in-production"
PORT=3000
```

Replace `YOUR_PASSWORD_HERE` with the PostgreSQL password you set during install.

---

## Step 3: Install Dependencies

Open a terminal at the project root (`c:\Spider\Project\Shad\Project`):

```bash
# Install backend + admin + shared packages
npm install

# Install mobile app (separate — not in workspaces)
cd packages/mobile
npm install
cd ../..
```

---

## Step 4: Set Up the Database Schema

```bash
cd packages/backend
npx prisma generate
npx prisma migrate dev --name init
```

This creates all 15 database tables.

---

## Step 5: Seed Demo Data

```bash
cd packages/backend
npx ts-node prisma/seed.ts
```

You should see:

```
Seeding Oscar database...
  Users created
  Plant created
  Checklist sections & items created (28 items)
  Lab fields created (9 fields)
  Threshold rules created (6 rules)
  Observation tags & tag rules created (10 tags)

Seed complete!
─────────────────────────────────────
  Admin login:    admin@oscar.app / admin123
  Operator login: operator@oscar.app / operator123
  Plant:          Greenfield WWTP
─────────────────────────────────────
```

---

## Step 6: Start the Backend API

```bash
cd packages/backend
npm run dev
```

You should see: `Oscar API running on port 3000`

**Test it:** Open your browser and go to:
```
http://localhost:3000/api/health
```

You should see: `{"status":"ok","timestamp":"..."}`

---

## Step 7: Start the Admin Panel

Open a **new terminal** (keep the backend running):

```bash
cd packages/admin
npm run dev
```

You should see: `Local: http://localhost:5173/`

**Test it:** Open your browser and go to:
```
http://localhost:5173
```

### Admin Panel Login:
- **Email:** admin@oscar.app
- **Password:** admin123

### What you can do in the Admin Panel:
1. **Dashboard** — See plants and users overview
2. **Plants** — Add/edit wastewater plants
3. **Users** — Create operators, assign them to plants
4. **Checklist Config** — Add/remove/reorder checklist sections and items
5. **Thresholds** — Configure lab value rules (caution/critical limits)
6. **Round History** — View all completed daily rounds with details

---

## Step 8: Start the Mobile App

Open a **third terminal** (keep backend + admin running):

```bash
cd packages/mobile
npx expo start
```

### Option A: Test on your phone/tablet (recommended)
1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Your phone must be on the **same WiFi network** as your computer
3. Scan the QR code shown in the terminal
4. The app opens in Expo Go

### Option B: Test in web browser
```bash
npx expo start --web
```
Opens at http://localhost:8081

### Option C: Test in Android Emulator
1. Install Android Studio
2. Create an AVD (Android Virtual Device) — pick a tablet
3. Start the emulator
4. Press `a` in the Expo terminal

### Mobile App Login:
- **Email:** operator@oscar.app
- **Password:** operator123

### What you can do in the Mobile App:
1. **Login** with operator credentials
2. **Select Plant** (Greenfield WWTP)
3. **Start Daily Round**
4. **Complete Checklist** — Tap OK / Attention / N/A for each item
5. **Enter Lab Data** — Type numeric values (auto-saves)
6. **Select Observations** — Tap tags like "Cloudy clarifier"
7. **Run Evaluation** — System generates suggestions with green/yellow/red
8. **Add Issues** — Report problems, flag for supervisor
9. **Summary & Sign Off** — Review everything and sign off
10. **View History** — See past daily rounds

---

## Testing Walkthrough (Recommended Flow)

### Test 1: Complete a Daily Round (Mobile)

1. Login as `operator@oscar.app / operator123`
2. Select "Greenfield WWTP"
3. Tap "Start Daily Round"
4. Go through each checklist section:
   - Tap **OK** for most items
   - Tap **Attention** on one or two items — add a note
   - Tap **N/A** for any that don't apply
5. Go to "Labs & Operating Data":
   - Enter these values to trigger suggestions:
     - **DO:** `0.3` (below critical threshold of 0.5)
     - **pH:** `7.0` (normal)
     - **Temperature:** `72` (normal)
     - **MLSS:** `800` (below critical threshold of 1000)
     - **Ammonia:** `12` (above critical threshold of 10)
6. Go to "Process Observations":
   - Select "Cloudy clarifier"
   - Select "Excess foam"
7. Go to "Review Suggestions":
   - Tap **"Run Evaluation"**
   - You should see RED condition with suggestions like:
     - "DO: 0.3 mg/L — Check aeration performance"
     - "MLSS: 800 mg/L — Biomass inventory out of range"
     - "Ammonia: 12 mg/L — Elevated ammonia"
     - "Cloudy clarifier observed — Review settling"
   - Tap "Acknowledge" on each
8. Go to "Issues & Actions":
   - Add an issue: "Low DO detected — checked blower #2, found tripped breaker"
   - Toggle "Flag for Supervisor"
9. Go to "Summary & Sign Off":
   - Review the stats
   - Add notes: "Overall concerning day — multiple parameters off"
   - Tap **"Sign Off Daily Round"**

### Test 2: Review as Admin (Web Panel)

1. Open http://localhost:5173
2. Login as `admin@oscar.app / admin123`
3. Go to **Round History**
4. You should see the round you just completed
5. Click **"View"** to see full details:
   - Lab values, suggestions generated, issues reported
6. Go to **Thresholds**:
   - Try changing DO's critical low from 0.5 to 1.0
   - This changes when RED alerts trigger
7. Go to **Checklist Config**:
   - Try adding a new item to "Arrival / Grounds"

### Test 3: API Direct Testing (Optional)

Use a tool like Postman, Insomnia, or curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@oscar.app","password":"operator123"}'

# Copy the token from the response, then:

# Get plants
curl http://localhost:3000/api/plants \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Health check
curl http://localhost:3000/api/health
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `npm install` fails | Make sure Node.js is installed and terminal was restarted |
| Database connection error | Check your `.env` file — is the password correct? Is PostgreSQL running? |
| `prisma migrate` fails | Make sure the `oscar_dev` database exists (Step 1) |
| Seed fails | Make sure migrations ran first (Step 4) |
| Admin panel blank | Make sure backend is running on port 3000 |
| Mobile can't connect | Make sure phone is on same WiFi. Try `npx expo start --tunnel` |
| Port 3000 in use | Change PORT in `.env` file |
| Expo errors | Try `npx expo start --clear` to clear cache |

---

## Summary of Running Services

| Service | URL | Port |
|---|---|---|
| Backend API | http://localhost:3000/api | 3000 |
| Admin Panel | http://localhost:5173 | 5173 |
| Mobile (web) | http://localhost:8081 | 8081 |

**You need 3 terminals running simultaneously:**
1. Backend: `cd packages/backend && npm run dev`
2. Admin: `cd packages/admin && npm run dev`
3. Mobile: `cd packages/mobile && npx expo start`
