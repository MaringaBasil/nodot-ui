# ♻️ NODOT
**Nothing to Dump. Everything Has Value.**

A South African circular-economy super-platform.

> **The Killer Combo:** Locate → Scan → Pickup → Get Paid

---

## 🚀 Vision
NODOT is not just a recycling app; it is South Africa’s waste operating system. It connects citizens, informal waste pickers, businesses, and municipalities into a single ecosystem to drive the circular economy.

---

## 🔥 Features

### 1. Smart Recycling (Next-Level Core)
*   **Smart Item Recognition (AI++):** Scan item → auto-detect material, brand, and recyclability. Warns if not locally recyclable.
*   **Weight Estimation:** Camera-based estimation with manual override. Shows estimated earnings before pickup.
*   **Condition Grading:** A (Clean), B (Used), C (Damaged). Prices auto-adjust.

### 2. Hyper-Local Recycling Ecosystem
*   **Community Recycling Hubs:** Users register as micro-collection points (earn commission).
*   **Informal Waste Picker Mode ♻️:** Simplified UI, daily route suggestions, instant cash-out, offline mode. Empowering existing pickers.
*   **Business Recycling Accounts:** Scheduled pickups, monthly reports, compliance certificates for offices & malls.

### 3. Gamification & Social Features 🎮
*   **Recycling Streaks:** Daily/weekly streaks with bonus multipliers.
*   **Area Leaderboards:** Suburb, campus, or company competitions.
*   **Challenges:** Sponsored prizes for hitting targets (e.g., "Recycle 10kg plastic this week").
*   **Share Impact:** WhatsApp-friendly sharing of CO₂ saved and earnings.

### 4. Marketplace Expansion 🛒
*   **Refurbished Items Market:** "Facebook Marketplace but green" for furniture, electronics, DIY materials.
*   **Donation Mode:** Donate to NGOs, schools, shelters with pickup included.
*   **Barter System:** Swap items instead of selling.

### 5. Logistics & Operations Power-Ups 🚚
*   **Smart Pickup Routing:** Group pickups by location to reduce fuel costs.
*   **Scheduled Recurring Pickups:** Weekly/monthly for households & businesses.
*   **Dynamic Pricing:** Adjusts based on demand, location, and cleanliness.

### 6. Financial & Payments Upgrades 💰
*   **Wallet System:** Earnings, withdrawals, bonuses.
*   **Airtime & Data Rewards:** MTN, Vodacom, Telkom integration.
*   **Micro-Loans for Pickers:** Advance payments repaid via recycling income.

### 7. Trust, Safety & Quality Control 🔐
*   **Ratings & Reviews:** Rate drivers, recyclers, and pickup experiences.
*   **Verified Recyclers Badge:** License verification and compliance checks.
*   **Fraud Detection:** Fake weight detection and duplicate item scans.

### 8. Sustainability & Impact Tracking 🌍
*   **Personal Impact Dashboard:** Kg recycled, trees saved, CO₂ avoided.
*   **Corporate ESG Reports:** Downloadable PDFs and monthly stats.
*   **Carbon Credit Integration:** Track verified volumes for future credit sales.

### 9. Offline & Low-Data Mode 📶
*   **Critical for SA:** Cached maps, SMS pickup requests, future USSD integration.

### 10. Accessibility & Inclusion
*   **Multi-language:** English, isiZulu, isiXhosa, Afrikaans.
*   **Voice Commands & Big Icons:** Accessible design.

### 11. Admin Superpowers 🧠
*   **Heatmaps:** Recycling activity and blackspot detection (illegal dumping).
*   **Policy Data:** Insights for municipalities.

### 12. Behaviour-Change Features
*   **Smart Nudges:** AI notifications ("You’re 2kg away from a bonus").
*   **Bin Day Sync:** Reminders aligned with municipal schedules.
*   **Anti-Contamination Coach:** Instructions like "Rinse bottle" or "Remove label".

### 13. Community & Township-First
*   **Street Captain Program:** Trusted locals manage collections for commission.
*   **School Recycling Leagues:** Monthly competitions for prizes.
*   **Church / NGO Drives:** Event-based bulk recycling.

### 14. Physical World Integration
*   **QR-Coded NODOT Bags:** Linked to users for fraud prevention.
*   **Smart Drop-Off Lockers:** "Recycling ATMs" at partner shops.
*   **NODOT Stickers:** Verified collection point branding.

### 15. Government & Municipality Mode 🏛️
*   **Illegal Dump Reporting:** Photo + location reporting with rewards.
*   **Waste Heatmaps:** Predict dumping risks.
*   **Compliance-as-a-Service:** Auto-reports for businesses.

### 16. Trust & Identity Expansion
*   **Tiered Verification:** Bronze/Silver/Gold levels for higher payouts.
*   **Reputation Wallet:** Good behavior unlocks priority and bonuses.
*   **Dispute Resolution:** AI-assisted arbitration.

### 17. Extreme Low-Tech Support
*   **WhatsApp Bot:** Request pickups and check balance via chat.
*   **USSD:** Feature phone support for the mass market.

### 18. Innovation & Future-Proofing
*   **Material Passports:** Lifecycle tracking.
*   **Brand Take-Back Programs:** Sponsored recovery by major brands.
*   **Green Score API:** External integration of user recycling status.

### 19. Admin God Mode (VC Candy)
*   **Predictive Supply Forecasting:** Sell forward contracts.
*   **Market Price Engine:** Real-time material pricing.
*   **Scenario Simulator:** Policy-grade intelligence.

---

## 🛠️ Tech Stack & Architecture

### Frontend
*   **Mobile:** React Native (Expo) - Android-first.
*   **Web:** React - Admin + Business dashboard.
*   **Language:** TypeScript everywhere.

### Backend
*   **Runtime:** Node.js / NestJS.
*   **Database:** PostgreSQL + PostGIS.
*   **Caching:** Redis (pricing & routing).

### AI & Services
*   **Vision:** Vision API (item scan).
*   **Logic:** Local rules engine (SA recyclability).
*   **Maps:** Mapbox.

### Folder Structure
```
src/
│
├── app/                    # App entry & routing
│   ├── Auth/
│   ├── Citizen/
│   ├── Picker/
│   ├── Business/
│   ├── Admin/
│
├── components/
│   ├── common/             # Buttons, Modals, Cards
│   ├── maps/               # MapView, Heatmap
│   ├── scan/               # Camera, AI results
│   ├── wallet/             # Balance, Withdraw
│   ├── gamification/       # Badges, Streaks
│
├── features/
│   ├── pickup/
│   ├── marketplace/
│   ├── rewards/
│   ├── routing/
│   ├── impact/
│
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── pricing.engine.ts
│   ├── scan.service.ts
│
├── store/
│   ├── auth.store.ts
│   ├── user.store.ts
│   ├── wallet.store.ts
│
├── hooks/
│   ├── useLocation.ts
│   ├── useOffline.ts
│   ├── useCamera.ts
│
├── utils/
│   ├── constants.ts
│   ├── validators.ts
│
└── i18n/                   # isiZulu, isiXhosa, Afrikaans
```

---

## 🗺️ User Journeys

### 👤 Citizen (Normal User)
1.  **Locate:** Map shows nearby bins/pickups.
2.  **Scan:** AI identifies item, price, and recyclability.
3.  **Action:** Request pickup or drop-off.
4.  **Reward:** Wallet credited, streak updated.
    *   *Motivation:* Money, convenience, pride.

### ♻️ Informal Waste Picker
1.  **Login:** Picker Mode (simplified, big buttons).
2.  **Route:** Auto-suggested efficient route.
3.  **Collect:** Scan or manual entry.
4.  **Drop:** Deliver to hub.
5.  **Payout:** Instant cash/airtime.
    *   *Motivation:* Daily income, zero friction.

### 🏢 Business
1.  **Register:** Set up business profile.
2.  **Schedule:** Recurring pickups.
3.  **Track:** Dashboard with waste stats.
4.  **Comply:** Download certificates.
    *   *Motivation:* Compliance, ESG reporting.

### 🏛️ Municipality
1.  **Monitor:** Heatmap dashboard.
2.  **Alerts:** Illegal dumping notifications.
3.  **Analyze:** Participation trends.
    *   *Motivation:* Data-driven governance.

---

## 💰 Funding Strategy

*   **Grants & Donors:** Focus on Picker Mode, Community Hubs, Impact Dashboard (Job creation, Environmental education).
*   **ESG & Corporates:** Focus on Business accounts, ESG reports, Brand take-back programs.
*   **VC / Impact Investors:** Focus on Dynamic pricing, Waste data monopoly, Scalability.

---

## 📅 Phase-1 Roadmap (90 Days)

### Month 1: Core Foundation
*   Authentication & User Profiles.
*   Maps (Bins + Pickups).
*   Pickup Request Flow.
*   Wallet (Manual payouts).

### Month 2: Operations & Admin
*   Picker Mode (Simplified).
*   Admin Dashboard.
*   Basic Pricing Engine.

### Month 3: Pilot & Launch
*   Pilot rollout in one city.
*   Partner recycler onboarding.
*   Grant applications.

> **Note:** Complex features like Carbon Credits, Marketplace, and Smart Bins are deferred to later phases to ensure a fast, focused launch.
