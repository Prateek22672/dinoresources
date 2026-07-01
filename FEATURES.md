<div align="center">

# 🦕 TeamDino — Feature Documentation

**The ultimate student workspace** — notes, PYQs, Study-With-AI, placement prep, and free tools, with a full commerce + admin platform behind it.

`React + Vite + Tailwind · Supabase (Postgres + RLS + Edge Functions) · Razorpay · Groq`

</div>

---

## Contents

1. [Commerce](#1-commerce) · 2. [Subject pages](#2-subject-pages) · 3. [Dashboard](#3-dashboard) · 4. [Free tools](#4-free-tools-no-login) · 5. [Jobs / Placement](#5-jobs--placement-prep) · 6. [Agent](#6-agent) · 7. [Contributor](#7-contributor) · 8. [Admin console](#8-admin-console) · 9. [Security](#9-security) · 10. [Design & UX](#10-design--ux) · 11. [Backend](#11-backend-supabase)

> Each line is one feature, kept to 1–2 lines.

---

## 1. Commerce
- **Shopping cart** — server-side cart (`cart_items`); add individual subjects or full-year combos.
- **Store** — subjects grouped by year, with **year-filter chips**, **search + dropdown**, and an **initial filter to the student's profile year**.
- **Combo highlight** — a "Best value · Save X%" banner comparing the combo price vs. buying singly.
- **Razorpay checkout** — server computes the total (price never trusted from client); signature-verified before granting access.
- **Coupons** — admin-managed codes (% or flat), applied in the cart **and** on the Razorpay page; validated server-side.
- **Purchases** — order history with date, amount, status and items.
- **My Library** — only the subjects the user owns (kept separate from the Store).

## 2. Subject pages
- **Left nav** — Syllabus · Units 1–5 · PYQs.
- **Unit tabs** — **Study With AI** (Q&A), **Editorial** (YouTube), **Resources** (notes/PYQs).
- **Materials** — Google-Drive / YouTube / PDF links that **embed and play in-site**.
- **Editorial videos** — contributor-added YouTube that plays embedded, per unit.
- **Similar videos** — Groq suggests related videos; with a YouTube Data API key they embed and play in-site.
- **Access gating** — content locked behind `has_subject_access` (own subject **or** its year combo **or** an admin grant).
- **Focus mode** — hide the top header for distraction-free reading.

## 3. Dashboard
- **Guided home** — welcome hero with inline stats, a banner-card carousel, **My Library**, **Unlock more**, and tools.

## 4. Free tools (no login)
- **`/sgpa-calc` & `/attendance-calc`** — one page with **Grade Calc · CGPA Predictor · Attendance** tabs; cards redirect here (even after login).
- **GradeGuru calculator** — WGP/SGPA via the GITAM grade chart (S1 30% · S2 45% · LE 25%), course cards, step indicator.
- **What-If CGPA Predictor** — current standing + future-semester sliders → projected CGPA + required-SGPA-to-target.
- **Promo rail** — surfaces Store, Jobs, Agent Fury and FolioFYX beside the free tools.

## 5. Jobs / Placement Prep
- **`/jobs`** — company-by-company **Pattern · Materials · Questions** (PrepInsta-style).
- **Jobs contributor** — a **separate** `/contributor/jobs` page (not mixed with the subject studio).

## 6. Agent
- **Agent Fury** card (dashboard + landing) — "create your agents, e.g. email fetch & summarizer" → agentfury.foliofyx.in.
- **AI agent** (`/agent`) — Groq-powered assistant to summarize emails/notes & draft replies (key server-side).

## 7. Contributor
- **Subject studio** — add/edit Study-With-AI Q&A, upload materials, and add editorial videos per subject + unit.

## 8. Admin console
- **Analytics + Earnings** — total earned, payments done (today/month/total), avg order, signups, revenue, sales mix.
- **Users & Access** — search by email/username/id; grant/revoke subject & combo access; set roles.
- **Subjects & Pricing** — add a subject **under a year**, edit price/active, move/delete; per-year combo pricing.
- **Coupons** — create/edit/delete codes with limits, expiry and usage counts.
- **Cards & Features** — toggle which cards/features show site-wide (e.g. Jobs, Agent).
- **Support Tickets** — triage and reply to help requests.
- **Team** — edit the About-page team (name, role, photo, link), DB-backed.
- **Payments** — all transactions with status filters (paid/failed/refunded).
- **Audit Log** — every privileged admin action.
- **Security** — site-protection level: Off / L1 (no DevTools) / L2 (+no copy-paste) / L3 (strict).
- **Access Audit** — flags access with no verified payment (bypass), one-click revoke.
- **Account Sharing** — flags accounts logging in from 3+ IPs/devices, with drill-down + revoke.
- **Database** — live usage vs. the 500 MB free tier, table sizes, and one-click "smart cleanup".

## 9. Security
- **RLS everywhere** — incl. previously-exposed payment tables; **materials gated** so paid content can't leak via the API.
- **Payment integrity** — server-side pricing/coupons, HMAC signature verification, no client self-grant.
- **Login tracking** — server-read IP/device per login, powering sharing detection.

## 10. Design & UX
- **ChatGPT-style palette** — soft white + `#212121` dark family; **Inter** font; **light/dark toggle**.
- **B&W contrast cards** — solid cards that invert with the theme.
- **Premium landing** — full-bleed photo hero, dot-grid backdrop, floating pill nav (desktop) / bubble menu (mobile).
- **React Bits** — FuzzyText **404**, DecryptedText headings, FallingText footer, BubbleMenu mobile nav.
- **Premium 404 + splash**, polished Help dialog, fully **mobile-responsive**.

## 11. Backend (Supabase)
- **Migrations** — years/combos/access, cart/orders, subject Q&A, editorial, coupons, jobs, feature flags, login tracking, app settings, RLS hardening, db-usage + cleanup functions.
- **Edge functions** — `create-cart-order`, `verify-cart-payment`, `admin-grant-access`, `admin-revoke-access`, `log-login`, `groq-related`, `related-videos`, `groq-agent`.

---

<div align="center">
<sub>Crafted for the student community.</sub>
</div>
