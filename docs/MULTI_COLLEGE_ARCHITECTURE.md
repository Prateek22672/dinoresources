# TeamDino — Multi-College Architecture Plan

**Status:** Proposal for approval · **Date:** 24 July 2026
**Author:** Engineering · **Decision owner:** Prateek

---

## 1. What we are solving

TeamDino today serves **one college (GITAM)** from **one Supabase project**, at `teamdino.in`.

We now want to serve **SRM** and **one more college** without:

1. Disturbing the running GITAM service (it earns money today),
2. Confusing existing GITAM students ("is this still my website?"),
3. Creating a maintenance burden that slows every future feature.

This document gives the recommended architecture, the honest trade-offs, and a
phased rollout where **GITAM is never at risk at any step**.

---

## 2. Verdict on the proposed approach

> **Proposal:** keep GITAM on the current Supabase; put SRM + the third college on a second Supabase.

**Verdict: Yes — this works, and I recommend it — but only with one non-negotiable condition.**

### The condition: ONE codebase. Never fork the repo.

The real danger is not the database split. It is this:

> "Let's just copy the project and make a second version for SRM."

If we do that, within three months we have two codebases that have drifted, every
bug must be fixed twice, and GITAM stops receiving improvements because all the
effort goes into reconciling the two. **This is the single most common way
multi-tenant expansions fail.**

So: **one repo, one deployment, one build.** Which college a visitor sees — and
which database they talk to — is decided at *runtime from configuration*, not by
having separate code.

### Why the two-database split is still worth it

There is a genuine engineering argument that one database with a `college_id`
column would be simpler. That is true in isolation. But your priority is
**protecting the paying GITAM base while we test whether expansion works at all**,
and the split buys exactly that:

| Benefit | Why it matters to you |
|---|---|
| **Zero blast radius** | No migration, bad query, or accidental delete on the new colleges can ever touch GITAM data. |
| **Clean exit** | If the expansion doesn't work, delete the second project. GITAM is untouched — nothing to unwind. |
| **Independent load & quota** | An SRM launch spike cannot slow GITAM's exam-week traffic. |
| **Independent trust boundary** | GITAM student data is never co-resident with another college's. Easy to state to a college administration. |

### The cost — stated honestly

| Cost | Size | Mitigation |
|---|---|---|
| Every migration must run on both projects | 30 migrations today, ~2–4/month ongoing | One `npm run db:push:all` script that applies to both, in order |
| Every edge function deploys twice | 10 functions | One `npm run fn:deploy:all` script |
| Cross-college analytics needs two queries | Low — reports only | Admin fetches both and merges in the UI |
| Two sets of secrets to rotate | Low | Documented in the deploy doc |

**This cost is acceptable. Code duplication would not be.** The scripts make the
double-deploy a non-event; a forked codebase would be permanent.

### The key insight that makes this easy

SRM and the third college **share one database**. That means we need proper
tenant separation (`college_id` + Row Level Security) *regardless* of how many
Supabase projects exist.

So we build tenant-awareness **once**, properly. After that, "which database" is
just one more line in a config file. The architecture below is therefore
**database-count agnostic** — we can merge to one project later, or split to
three, without rewriting the app.

---

## 3. Domain strategy — protecting the GITAM audience

This is your main worry, and it is the right worry. It is solved almost entirely
by **where each college lives**, not by code.

### Recommended: apex stays GITAM, new colleges get subdomains

| College | URL | What the student sees |
|---|---|---|
| **GITAM** (existing) | `teamdino.in` | **Exactly what they see today.** No college picker, no mention of other colleges, no visual change whatsoever. |
| SRM | `srm.teamdino.in` | Its own landing page, its own name, its own colours. |
| Third college | `<slug>.teamdino.in` | Same. |

**Why this is the safe option:**

- A GITAM student **cannot accidentally encounter** SRM content. There is no
  shared page, no dropdown, no "choose your college" screen on `teamdino.in`.
  Their experience is bit-for-bit unchanged.
- Each college feels like a **product built for them**, not a shared portal —
  which also sells better to the college itself.
- Browser storage, sessions and cookies are **naturally isolated per origin**.
  No cross-college session leakage to reason about.
- Google indexes each college separately — SRM searches surface SRM pages.
- The apex domain keeps all its existing SEO and backlinks.

### Why NOT paths (`teamdino.in/srm`)

Paths are cheaper to set up but weaker on the exact thing you care about:

- `teamdino.in` root must then decide what to show, which invites a college
  picker — the precise confusion you want to avoid.
- Shared origin means shared cookies/localStorage; more chances of leaking
  state between colleges.
- Weaker branding and messier analytics.

**Recommendation: subdomains.** Cost is one wildcard DNS record (`*.teamdino.in`)
and a wildcard domain in the host — roughly 15 minutes of setup, no extra hosting fee.

> **Optional later:** `gitam.teamdino.in` can be added as an alias serving the
> identical GITAM experience, so all colleges have symmetric URLs — while
> `teamdino.in` continues to work exactly as today, forever.

---

## 4. Data architecture

### 4.1 Two Supabase projects

```
Project A — "teamdino-gitam"   (EXISTING — do not restructure)
└── GITAM only

Project B — "teamdino-campus"  (NEW)
├── SRM            (college_id = 'srm')
└── Third college  (college_id = '<slug>')
```

### 4.2 Tenant model inside each project

Every project — **including GITAM's** — gets the same schema, so the code is
identical everywhere:

```sql
-- The tenant registry. Project A holds 1 row; Project B holds 2.
create table colleges (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,      -- 'gitam' | 'srm' | '<slug>'
  display_name  text not null,             -- "GITAM"  (shown in UI)
  short_name    text not null,             -- "GITAM"
  active        boolean default true,
  config        jsonb default '{}'::jsonb, -- branding, terminology, grade rules
  created_at    timestamptz default now()
);
```

Then add a **nullable** `college_id` to each tenant-scoped table:

`profiles`, `subjects`, `years`, `subject_qa`, `subject_editorial`, `unit_topics`,
`resources`, `cart_items`, `orders`, `order_items`, `user_subject_access`,
`user_year_access`, `coupons`, `cart_charges`, `spin_segments`, `user_spins`,
`announcements`, `user_notices`, `support_tickets`, `feature_flags`,
`app_settings`, `user_exams`, `job_items`, `team_members`.

> **Why nullable, and why this is safe for GITAM:**
> We add the column, backfill every existing row to `gitam`, *then* make it
> required. At no point does an existing query break — a column that nothing
> reads yet cannot affect the running app. This is an additive migration.

### 4.3 Row Level Security

Access is enforced in the database, not just the UI:

```sql
-- Helper: which college does the current user belong to?
create or replace function public.current_college_id()
returns uuid language sql stable security definer as $$
  select college_id from public.profiles where id = auth.uid()
$$;

-- Applied to every tenant-scoped table:
create policy "same college only" on public.subjects
  for select to authenticated
  using (college_id = public.current_college_id());
```

**Result:** even if the frontend had a bug, an SRM student's session physically
cannot read another college's rows. In Project A this is a harmless no-op
(everything is `gitam`), so **GITAM behaviour is unchanged**.

---

## 5. How the app decides which college a visitor is

A single resolver runs once at startup, before anything renders:

```
1. Hostname          srm.teamdino.in        → 'srm'          ← primary signal
2. Path prefix       /srm/...               → 'srm'          ← fallback / shareable links
3. Query override    ?college=srm           → 'srm'          ← internal testing only
4. Stored preference localStorage           → last used
5. Default           teamdino.in            → 'gitam'        ← safety net
```

**The default is the safety net that protects you.** If DNS is misconfigured, a
config file is malformed, or the resolver throws — the app falls back to GITAM
and behaves exactly as it does today. There is no failure mode where a GITAM
student sees a broken or foreign experience.

Config lives in one file:

```ts
// src/config/colleges.ts
export const COLLEGES = {
  gitam: { db: 'A', name: 'GITAM', host: 'teamdino.in'     },
  srm:   { db: 'B', name: 'SRM',   host: 'srm.teamdino.in' },
  // third college added here — one line, no code change
} as const;
```

Two Supabase clients are created, and the resolver picks one. **Every existing
`supabase.from(...)` call keeps working** because the client is chosen at the
module boundary — we are not rewriting 30 tables' worth of queries.

---

## 6. What admin can change per college

Everything below is stored in `colleges.config` (JSONB) and edited from a new
**Admin → College Settings** tab. No code deploy needed to change any of it.

### Identity & branding
- Display name, short name, tagline
- Logo, favicon, OG share image
- Accent colour (reuses the existing accent system)
- Landing-page headline and hero copy

### Terminology
Different colleges use different words for the same thing. Free-text overrides:

| Concept | GITAM | Another college might say |
|---|---|---|
| Semester marks | "Sessional" | "Mid-term", "CIA" |
| Result metric | "SGPA" | "GPA", "CGPA" |
| Course unit | "Unit" | "Module" |

### ⚠️ Grade rules — **the highest-risk item**

The SGPA calculator currently encodes **GITAM's scheme** (Sessional 1 = 30%,
Sessional 2 = 45%, Lab/External = 25%) and GITAM's grade chart.

**Other colleges use different weights and different grade points.** If we ship
the GITAM formula to SRM, every SGPA it produces is wrong — and a calculator that
gives wrong marks destroys trust on day one, which is the worst possible launch.

**Therefore:** grade rules move into per-college config —

```jsonc
"grading": {
  "components": [ {"label":"Sessional 1","weight":30}, … ],
  "scale": [ {"grade":"O","points":10,"min":90}, … ],
  "passMark": 40
}
```

GITAM's existing values are seeded as-is, so **the GITAM calculator produces
byte-identical results to today**. Each new college's chart must be confirmed
against their official academic handbook **before** that college goes live.

### Commerce & features
- Subject price, year-combo price, currency
- Coupons, cart charges (GST / donation), spin-wheel odds
- Feature flags per college (Jobs, Agent, Spin, Study-With-AI…) — reuses the
  existing `feature_flags` table, now scoped by `college_id`
- Security level, purchase validity days, single-device login

---

## 7. Payments

- **One Razorpay account** serves all colleges — no second merchant onboarding.
- Each Supabase project runs **its own copy** of `create-cart-order` and
  `verify-cart-payment`, with its own service-role secret, writing to its own
  `orders` table.
- `college_id` and `college_slug` are stamped into Razorpay order **notes**, so
  the Razorpay dashboard can be filtered by college for reconciliation.
- **GITAM's payment path is not modified at all.** The functions are redeployed
  unchanged in behaviour; the new college_id field is additive.

> Rule: no change ships to `verify-cart-payment` on Project A in the same release
> as the multi-college work. Payments stay frozen while we expand.

---

## 8. Admin panel

- Admin operates **one college at a time**, chosen from a switcher in the header.
- A GITAM admin logs into Project A; an SRM admin logs into Project B. Their
  credentials are naturally separate — an SRM admin has no technical ability to
  touch GITAM data.
- The **Overview** dashboard can show combined revenue/user counts by querying
  both projects and merging client-side (read-only, no writes).
- All existing admin tabs (Users, Subjects, Content, Coupons, Charges, Tickets,
  Analytics, Security, Database) become **college-scoped automatically** once the
  queries carry `college_id`.

---

## 9. Rollout — five phases, GITAM safe at every one

### Phase 0 — Preparation *(no user-visible change)*
- Create Supabase Project B.
- Write `db:push:all` and `fn:deploy:all` scripts.
- **Take a verified backup of Project A** and practise restoring it.
- ✅ *GITAM impact: none. Nothing deployed.*

### Phase 1 — Tenant schema, GITAM untouched in behaviour
- Add `colleges` table + `college_id` columns (nullable) to Project A.
- Backfill every existing row to `gitam`. Set `NOT NULL`. Enable RLS policies
  that, with one college, allow exactly what is allowed today.
- ✅ *GITAM impact: none — additive columns, and RLS that matches current access.*
- 🔍 **Gate:** full regression pass on GITAM (login, library, store, payment,
  admin) before proceeding.

### Phase 2 — Tenant-aware code, still single-college
- Ship the resolver, config file, and dual-client setup — with **only GITAM
  configured**. Resolver always returns `gitam`.
- ✅ *GITAM impact: none — same database, same behaviour, new plumbing dormant.*
- 🔍 **Gate:** GITAM verified in production for **one week** before any new
  college is switched on.

### Phase 3 — Project B built and seeded
- Apply all migrations + functions to Project B.
- Create `srm` college row, its branding, **its verified grade chart**, prices,
  and seed content.
- Point `srm.teamdino.in` at the app.
- ✅ *GITAM impact: none — a separate database and a separate hostname.*

### Phase 4 — Private SRM pilot
- Invite a small SRM group. Iterate on content, pricing, terminology.
- `teamdino.in` still shows zero evidence that SRM exists.
- ✅ *GITAM impact: none.*

### Phase 5 — Public SRM launch, then the third college
- Announce SRM on its own channels only.
- Third college = **one config row + content seeding**. No new engineering.

---

## 10. Operating rules

1. **One repo. One deployment. Never fork.** Non-negotiable.
2. **Migrations are additive first.** Add nullable → backfill → constrain. Never
   a destructive change in the same release as a feature.
3. **Every migration runs on both projects, in the same order**, via the script.
   Drift between projects is the main long-term risk — the script exists to
   prevent it.
4. **Payments frozen during expansion.** No behavioural change to the payment
   functions while multi-college work is in flight.
5. **A new college is config + content, never code.** If adding college #4
   requires code, the abstraction has leaked and must be fixed.
6. **Grade rules verified against the official handbook** before a college
   goes live. No exceptions.
7. **The resolver always defaults to GITAM** on any failure.

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Schema drift between projects** | Medium | High | Single migration script, applied to both; a CI check comparing schema hashes |
| **Wrong grade chart for a new college** | Medium | **High — kills trust instantly** | Verify against official handbook; pilot phase before public launch |
| GITAM student confused by expansion | Low | High | Apex domain unchanged; no picker; no cross-links |
| Forked codebase creeping in | Medium | **Very high** | Rule #1; single repo, code review |
| Second project cost | Low | Low | Supabase free tier covers a pilot; upgrade when revenue justifies |
| Admin confusion across projects | Low | Medium | Explicit college name + colour in admin header at all times |

---

## 12. Cost

| Item | Cost |
|---|---|
| Supabase Project B | ₹0 on free tier for the pilot; ~$25/mo when it outgrows it |
| Wildcard DNS + domain | ₹0 (existing domain) |
| Hosting | ₹0 — same deployment serves all subdomains |
| Razorpay | ₹0 — same account |

**Pilot cost ≈ ₹0.** Real cost is engineering time, not infrastructure.

---

## 13. Decisions needed from you

1. **Confirm subdomains** (`srm.teamdino.in`) over paths (`teamdino.in/srm`).
   *Recommendation: subdomains — it is the strongest protection for the GITAM audience.*
2. **Name the third college** and its slug.
3. **Obtain both colleges' official grading schemes** (component weights + grade
   chart). This is the long-pole item — please start it now, it needs no engineering.
4. **Should GITAM admins see combined cross-college analytics**, or stay fully
   separate?
5. **Pricing per college** — same ₹11/₹29, or different?

---

## 14. Summary

**Your instinct is sound.** Keeping GITAM on its own database while the new
colleges share a second one is a reasonable, defensible architecture — it buys
real blast-radius protection for the audience you cannot afford to lose, and it
lets you abandon the experiment cleanly if it doesn't work.

The thing to guard against is not the database split — it is **code duplication**.
Build tenant-awareness once, drive everything from config, and adding college #4
becomes an afternoon of data entry instead of a project.

And the confusion problem you were worried about is solved almost entirely by the
URL strategy: **`teamdino.in` stays exactly as it is today, forever.** GITAM
students will never see a college picker, never see SRM, and never have a reason
to wonder whether they are in the right place.
