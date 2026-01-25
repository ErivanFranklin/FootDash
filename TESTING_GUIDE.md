# Comprehensive Testing Guide for FootDash 🧪

This guide provides step-by-step instructions to run the application locally and test all implemented features (Gamification, Social Chat, Monetization).

---

## 🏗️ 1. Prerequisites & Setup

### A. Database
Ensure your local PostgreSQL database is running.
```bash
# If using the provided docker-compose
docker-compose up -d postgres
```

### B. Backend Configuration
Create or update `backend/.env` with the following:

```ini
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=footdash

# Authentication
JWT_SECRET=super-secret-dev-key

# Frontend URL (For Stripe Redirects)
FRONTEND_URL=http://localhost:4200

# Stripe (Test Mode Credentials)
# You can use these placeholder test keys or sign up at dashboard.stripe.com/test
STRIPE_SECRET_KEY=sk_test_PLACEHOLDER
STRIPE_WEBHOOK_SECRET=whsec_test_secret

# Feature Flags
FOOTBALL_API_MOCK=true
```

### C. Seed Data (Important!)
You need sample data (Users, Teams, Matches) to test the app.
```bash
cd backend
npm run migration:run
npm run seed:dev
```

---

## 🚀 2. Starting the Application

### Backend
Open a terminal:
```bash
cd backend
npm run start:dev
```
*Verify it's running at `http://localhost:3000`*

### Frontend
Open a **new** terminal:
```bash
cd frontend
npm start
```
*Verify it's running at `http://localhost:4200`*

---

## 🧪 3. Feature Testing Walkthrough

### Phase 1: Authentication
1.  **Register**: Go to `http://localhost:4200/register`. Create a new account (e.g., `test@example.com` / `password`).
2.  **Login**: You should be redirected to login. Log in with the new credentials.
3.  **Home API Check**: Verify you see the dashboard. This confirms JWT auth is working.

### Phase 2-4: Core Data (Teams/Matches)
1.  **Teams**: Navigate to **Teams** tab. Select a team (e.g., "Arsenal"). Verify details load.
2.  **Matches**: Navigate to **Matches** tab.
3.  **Match Details**: Click on a match card to open `MatchDetailsPage`.

### Phase 6 Sprint 1: Gamification (Predictions) 🎲
1.  **Navigate**: Open a specific **Match Details** page.
2.  **Vote**: Look for the "Who will win?" section.
3.  **Action**: Click "Home" or "Away".
4.  **Verify**: use a visual check that the percentage bar updates.
    *   *Note: In mock mode, percentages might be static or random depending on the seed.*
5.  **Leaderboard**: Go to `/leaderboard` (if added to menu) or manually type URL. Verify your user appears.

### Phase 6 Sprint 2: Social Chat 💬
1.  **Navigate**: Open **Match Details** page.
2.  **Locate**: Scroll down to the **Live Chat** section.
3.  **Send Message**: Type "Hello World" and hit Send.
4.  **Real-time Test**:
    *   Open a 2nd browser window (Incognito).
    *   Login as a different user (create one called `chat-tester@example.com`).
    *   Go to the same match.
    *   Send a message from window 2.
    *   **Verify**: Message appears instantly in window 1.

### Phase 6 Sprint 3: Monetization (Pro) 🏆
1.  **Check Status**: Navigate to **Analytics** tab or try to open a "Pro" feature (Match Analytics).
    *   *Expected*: Redirected to `/pro` page if not subscribed.
2.  **Subscribe**:
    *   On `/pro` page, click **"Start 7-Day Free Trial"**.
    *   You will be redirected to the Stripe Test Checkout page.
3.  **Payment**:
    *   Use Stripe Test Card: `4242 4242 4242 4242`
    *   Any future date, any CVC.
4.  **Success**:
    *   After payment, you are redirected back to `/payments/success`.
5.  **Verify Access**:
    *   Navigate back to the protected Analytics feature.
    *   *Expected*: You now have access.

---

## 🛠️ Troubleshooting

-   **Chat not connecting?**
    *   Check Browser Console for `Socket.io connection refused`.
    *   Ensure Backend is running on port 3000.
    *   Ensure Frontend `environment.ts` points `websocketUrl` to `http://localhost:3000`.

-   **Stripe Error?**
    *   Ensure `FRONTEND_URL` in `backend/.env` exactly matches your browser URL (usually `http://localhost:4200`).
    *   Ensure `STRIPE_SECRET_KEY` is valid (starts with `sk_test_`).

-   **Database Errors?**
    *   Run `npm run migration:run` in backend again to ensure scheama is up to date.

