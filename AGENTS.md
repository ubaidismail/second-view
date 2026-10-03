# Product Requirements Document (PRD): Second View (Lean Web MVP)

**Product Name:** Second View  
**Tagline:** A quiet web sanctuary to share what weighs heaviest, answered by verified minds.  
**Document Version:** 2.1 (Lean Next.js Web MVP)  
**Target Platform:** Web Application Only (Responsive Web: Mobile & Desktop Browsers)  
**Technology Stack:** Next.js (App Router, React, TypeScript, Tailwind CSS)  
**Status:** Approved for Lean Web Build & Fast Iteration  

---

## 1. Executive Summary & Product Vision

### 1.1 The Core Problem
When people carry severe professional, emotional, or existential dilemmas, public social platforms (Reddit, X, open wellness message boards) offer zero credible privacy guarantees and are flooded with unqualified, noisy commentary. Conversely, formal synchronous clinical therapy carries high financial commitments, weeks of scheduling latency, and is ill-suited for discreet, unhurried second opinions.

### 1.2 The Lean Web Solution
**Second View** is an encrypted, asynchronous, browser-based advisory sanctuary built with **Next.js**. Seekers submit sensitive struggles using instant client-side pseudonyms; accredited, verified professionals (psychologists, certified counselors, executive coaches) provide structured, deliberate second opinions within 24–48 hours.

> **Scope Constraint:** Strictly a **Web Application**. No native iOS/Android apps, no Electron/desktop packages, and no app store submission overhead. A single responsive Next.js application serves all mobile and desktop web browsers.

---

## 2. Streamlined Target Personas

### Persona A: The Anonymous Seeker
- **Profile:** Knowledge workers, founders, executives, or individuals navigating acute burnout, imposter phenomenon, ethical dilemmas, or personal grief.
- **Need:** Post a delicate struggle directly from their web browser with zero real-name tracking or digital footprint.
- **Key Experience:** Instant randomized pseudonym (e.g. *Anonymous Lark*), no tracking pixels/cookies, optional sensitivity veil.

### Persona B: The Verified Mentor / Advisor
- **Profile:** Licensed clinical psychologists (Psy.D, Ph.D), licensed counselors (LMFT, LCSW), and certified executive coaches.
- **Need:** Review pending anonymous struggles in-browser and write structured, high-signal perspectives during spare hours.
- **Key Experience:** Prominent credential badge, streamlined async markdown composer, liability-safe advisory framework.

---

## 3. Simplified 3-Pillar Web Architecture (Next.js)

```
[1. Sanctuary Feed (`/feed`)] ──► [2. Anonymous Composer (`/share`)] ──► [3. Verified Thread (`/thread/:id`)]
                 ▲                                                                    │
                 └─────────────────── [4. Mentor Application (`/mentor-apply`)] ──────┘
```

### 3.1 Screen 1: Lean Sanctuary Feed (`/feed`)
- Next.js Server Components for lightning-fast First Contentful Paint (< 1.0s).
- Clean category filters: *Career & Purpose, Emotional Wellbeing, Identity, Grief & Transitions*.
- Thread preview cards featuring:
  - Seeker handle (*e.g., Anonymous Cedar*) and dilemma summary.
  - Highlighted verified mentor excerpt badge (*e.g., Dr. Aris Thorne, Psy.D.*).
  - Dignified sentiment counter (*Found Peace*, *Replies*).
- Persistent 24/7 Crisis Lifeline banner (988 integration).

### 3.2 Screen 2: Integrated Web Composer (`/share`)
- Minimalist, distraction-free markdown/text editor with zero auto-sync to third-party trackers.
- Client-side alias generator (*"Writing as Anonymous Ember"* + Shuffle button).
- Single dropdown for target specialty lens (*Psychologist, Counselor, Executive Coach, Financial Mentor*).
- Sensitivity toggle (adds opt-in blur warning for community readers).
- Browser-side payload encryption indicator prior to submission.

### 3.3 Screen 3: Struggle & Verified Advice Thread (`/thread/:id`)
- Deep reading typography optimized for vulnerable personal narratives.
- Primary highlighted callout: **Verified Second Opinion** with credential checkmark and structured 3-part format:
  1. *Core Psychological/Practical Reframe*
  2. *Identity Decoupling Insight*
  3. *Actionable Micro-Step*
- Community peer reflection module separate from accredited clinical answers.

### 3.4 Screen 4: Lightweight Mentor Sign-Up (`/mentor-apply`)
- Lean, single-page Next.js Server Action form:
  - Full Name, Licensing Jurisdiction/Board, License/NPI Registry Number, Professional Title.
  - Credential verification document upload (or public state registry link).
  - Agreement to non-binding ethical & HIPAA-safe terms.

---

## 4. Explicit MVP Scope Boundaries (What We Are Cutting)

| Out of Scope for Lean Web MVP | Reason & Replacement |
|---|---|
| ❌ **Desktop App (Electron, Mac, Windows)** | Redundant overhead. Web browser delivers complete desktop parity. |
| ❌ **Native iOS & Android Apps** | High maintenance and store review friction. Replaced by responsive Next.js web application. |
| ❌ **Real-Time Synchronous Chat / DMs** | Creates emotional urgency and on-call burnout. Strictly asynchronous (24–48h deliberate turnaround). |
| ❌ **Complex Billing / Paywalls** | Free community fellowship model for MVP to maximize initial advice velocity. |
| ❌ **Gamified Social Mechanics** | No algorithmic engagement, follower counts, or vanity likes. Only dignified resonance (*"Found Peace"*). |

---

## 5. Technology & Architecture (Next.js Web-Only)

- **Framework:** **Next.js 14+ (App Router)** with TypeScript for robust type-safety and server-side rendering.
- **Styling:** Tailwind CSS with fluid mobile-to-desktop responsive breakpoints and the *Serene Sanctuary* color scheme.
- **Backend / API:** Next.js Route Handlers & Server Actions; edge middleware for privacy headers.
- **Database & Storage:** PostgreSQL (Supabase/Prisma) with Row-Level Security (RLS) and encrypted blob storage for verification documents.
- **Authentication:** Passwordless magic links or privacy-focused SSO (Apple, Google, Proton); zero seeker email linkage to public forum IDs.
- **Privacy & Security:**
  - Zero third-party analytics pixels (no Meta, Google Ads, or invasive session replay tools).
  - Client-side pseudonym generation (Seeker email isolated in secure enclave).
  - Ephemeral draft handling in sessionStorage (auto-clears on tab close unless submitted).

---

## 6. Comprehensive MVP Success Metrics & Validation Triggers

To measure product-market fit, user safety, and operational viability, the MVP evaluates 4 key metric categories:

### 6.1 Seeker Engagement & Psychological Safety
| Metric | MVP Target | Measurement Method | What It Validates |
|---|---|---|---|
| **Composer Completion Rate** | **≥ 65%** | `(Submissions / /share visits) * 100` | Composer feels frictionless, safe, and reassuring. |
| **Seeker Relief Score ("Found Peace")** | **≥ 88%** | Explicit seeker feedback button on received verified response | Measures whether the verified perspective substantively alleviated distress. |
| **Sensitivity Veil Usage** | **15% – 30%** | Toggle rate on submitted struggles | Confirms seekers actively use and trust privacy self-moderation controls. |
| **Return Reader Engagement** | **≥ 35% weekly** | Anonymous repeat sessions reading public guidance archives | Validates resonance of de-identified wisdom across the broader community. |

### 6.2 Mentor Supply & Response Velocity
| Metric | MVP Target | Measurement Method | What It Validates |
|---|---|---|---|
| **Median Response Time** | **< 36 Hours** | Timestamp delta: submission to first verified answer | Confirms asynchronous volunteer/fellowship model is prompt without clinician burnout. |
| **Answer Fulfillment Rate** | **≥ 90% within 48h** | Percentage of published struggles receiving accredited response | Ensures seekers are not left unanswered or abandoned. |
| **Mentor Application Velocity** | **≥ 15 verified clinicians/mo** | Completed `/mentor-apply` submissions passing audit | Validates professional willingness to contribute pro-bono perspectives. |
| **Mentor Retention & Cadence** | **≥ 2 formulated answers/wk** | Active advisor weekly participation rate | Proves sustainable advisor routine without on-call exhaustion. |

### 6.3 Trust, Quality & Safety
| Metric | MVP Target | Measurement Method | What It Validates |
|---|---|---|---|
| **Credential Verification Rate** | **100% Manual Audit** | Pre-publication license check against state registry | Zero unqualified or unvetted pseudo-coaches posting as verified advisors. |
| **Crisis Escalation Trigger Accuracy** | **100% 988 banner display** | Keyword match test suite (self-harm, crisis phrases) | Guarantees immediate emergency intervention rails for high-acuity visitors. |
| **Zero Identity Footprint Audit** | **0 Data Leaks / 0 PII links** | Database penetration testing & automated code audit | Validates complete cryptographic detachment of seeker email from handle. |

### 6.4 Technical Performance (Next.js)
| Metric | MVP Target | Measurement Method | What It Validates |
|---|---|---|---|
| **First Contentful Paint (FCP)** | **< 1.0s** | Lighthouse & Core Web Vitals on mobile web | Fast loading under weak connectivity or stressful moments. |
| **Cumulative Layout Shift (CLS)** | **< 0.05** | Core Web Vitals score | Stable, tranquil reading experience without jarring layout shifts. |
