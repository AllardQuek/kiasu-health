Here's the updated document with lighter drafting (progressive disclosure approach) and clearer onboarding:

***

# KiasuHealth: Product Vision & Requirements Document

## Purpose
This document outlines the product vision and technical requirements for **KiasuHealth**. For the hackathon execution plan, see `KiasuHealth_Hackathon_Plan.md`.

***

## Executive Summary
**KiasuHealth** turns everyday health habits into a **social, kiasu-style health game** where Singaporeans track key metrics (Apple Health, Strava, meal photos), join small group challenges, and earn playful health perks and bragging rights based on **AI-verified performance**. **Elastic Agent Builder** acts as an impartial referee—aggregating data, checking proofs, and triggering rewards and nudges—to deliver sustained lifestyle change through **friendly competition and accountability**.

**Tagline (options)**
- "Be kiasu about your health."
- "Out-healthy your kakis, one week at a time."
- "Turn kiasu into better health."

## Go-to-Market Strategy

KiasuHealth launches with a dual approach:

- **Employers (B2B2C):** Sell to HR teams as a turnkey office health league platform. Employers set up leagues, invite staff via Telegram, and manage rewards. Fast adoption, easier logistics, aligns with Healthier SG incentives.
- **Consumers (B2C viral loop):** Anyone can start a league, invite friends/family, and compete for health perks and bragging rights. Viral features: QR code invites, shareable leaderboards, GIFs. Grassroots adoption builds social proof and complements employer leagues.

**Best practice:** Launch with employer pilots, then open up to public leagues for viral spread. This leverages both structured B2B sales and organic B2C growth.

***

## Problem Statement

### The Core Issue
Singaporeans struggle with **sustained health habit consistency** despite awareness and tracking tools. Existing solutions operate in **fragmented silos**:
- **Fitness apps** (Strava, Healthy 365) track solo metrics without social accountability.
- **Food trackers** ignore activity and mental wellness.
- **Gamification** feels generic (badges/points) without meaningful stakes.
- **Cultural gap**: Singapore's kiasu/competitive nature and tight social circles remain underused in health.

**Result**: People install health apps, use them for a few weeks, then churn once the novelty fades.

### The Deeper Challenge
**Surface problem**: Fragmented data across wearables, apps, and government platforms (Apple Health, Strava, HealthHub, Healthy 365).

**Root cause**: No meaningful accountability—humans need **social stakes + peer pressure** to sustain behaviour; accountability apps and partner-based systems consistently show higher adherence than solo trackers.

**Missing piece**: A **social health game** that uses simple weekly challenges, group accountability, and culturally relevant rewards (hawker balance, family duels, kiasu bragging rights) to turn data into behaviour change.

***

## Solution Vision Pyramid

```
┌─────────────────────────────────────┐
│  GOAL: Improve Population Health   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  MECHANISM: Aggregate Data Sources  │
│  (Apple Health, Strava, Meal,       │
│   HealthHub) → Unified Insights     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  MOTIVATION: Instill Accountability │
│  via Social Stakes + Competition    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  EXECUTION: Social Health Game      │
│  Join challenges → Small groups →   │
│  Weekly reveals → Fun rewards       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  ENFORCEMENT: Elastic Agent Builder │
│  AI Referee - Judge, Verify, Act    │
└─────────────────────────────────────┘
```

***

## System Architecture

### 1. Data Aggregation Layer

**Sources**:
- **Apple Health**: Steps, heart rate, sleep, blood pressure.
- **Strava**: GPS runs, cycling, trail times.
- **Meal Photos**: Vision AI nutrition extraction (supports hawker-focused recommendations).
- **HealthHub SG**: Healthier SG points, screening records.
- **Manual Input**: Mood, medication compliance.

**Integration**: OAuth APIs → Elasticsearch indexing (time-series + images).

**Fairness Engine**: Age/gender/baseline-adjusted benchmarks via ES ML models so older or less fit users can fairly compete with fitter kakis.

***

### 2. Social Health Game Engine (Accountability Core)

#### Onboarding: Simple First, Advanced Later

**Design Philosophy**: Minimize cognitive load during onboarding, unlock customization once users see value.

**First-Time User (Week 1)**
- **Zero-brain join**: "Join office 10k steps + meal balance challenge this week"
- **One-tap setup**: Connect Apple Health or Strava
- **See results**: Simple score and rank appear automatically
- **Default lineup**: Metrics are pre-configured (steps + meal balance + optional activity)

**Engaged User (Week 2+)**
- **Unlock customization**: "Want more control? Customize your lineup"
- **Simple choices**: Pick your "captain metric" (2x points) + one personal boost
- **Progressive depth**: Users who want it can dive deeper; others stick with defaults

**League Organizer**
- **Admin controls**: Configure which metrics, point values, boosters for their league
- **Templates**: Pre-made challenge types (Office Fitness, Family Health, Runner's Club)

#### Metric System (Simplified)

**Standard Metrics (Auto-tracked)**:
- **Steps**: Daily step count (target: 10k)
- **Meal Balance**: Photo-based calorie tracking (lower calories = better score). Recommendations can be hawker-focused where relevant.
- **Activity Time**: Runs, walks, cycling (Strava or Apple Health)
- **Sleep**: Quality and duration (Apple Health)
- **Optional Boosts**: BP, heart rate, mood check-ins

**Scoring (Behind the Scenes)**:
- Age/gender/fitness-adjusted benchmarks for fairness
- Weekly totals with daily consistency bonuses
- "Captain" multiplier (2x) on user's chosen metric (advanced users only)

**Why This Works**:
- New users don't need to understand "drafting"—they just join and compete
- Power users get meaningful choices without overwhelming beginners
- Product can A/B test complexity levels

#### Mini-Leagues (Small Group Challenges)
- **Size**: 4–8 players (office, family, neighbourhood)
- **Join**: QR code or Telegram link invite
- **Duration**: Weekly challenges (Mon–Sun)
- **Rewards**: Health perks, SG vouchers, playful badges, bragging rights—not cash

#### Weekly Reveal Cycle
- **Daily**: Private tracking + mid-week "On pace?" nudges (via DM only)
- **Sunday 8PM**: "KiasuHealth Reveal" broadcast with standings
- **Suspense**: No live scores during week; one reveal moment builds anticipation
- **Privacy by default**: Food photos and raw meal descriptions never appear in the group. Weekly reveal shows scores, ranks, and badges only (e.g. "Your meal balance was weak this week (e.g. hawker meals)" — not what or where you ate).

#### Social Features
- **Reaction messages (emoji-only)**: Auto-generated celebration and gentle nudges
- **League Tables**: Overall standings + head-to-head records
- **Boosters** (unlocked after Week 1):
  - **Off Day Pass**: Miss one day penalty-free
  - **Power Day**: 3x points on one metric for one day
  - **Win Streak Multiplier**: Bonus rewards for consistency

#### Innovative Rewards System (Non-Monetary, Health-Linked)

**Health Perks**  
- Free healthier kopi/tea at office pantry
- Healthy snack boxes (nuts, fruit)
- Priority booking for fitness classes or wellness talks

**SG Vouchers & Benefits**  
- Healthier SG style points → grocery/healthy food vouchers
- MCCY arts/cultural vouchers, nature park passes
- Grab/FoodPanda credits for healthier restaurant options

**Bragging Rights & Recognition**  
- "Kiasu Champion", "Most Improved", "Comeback Kaki" badges
- Office leaderboards, weekly Telegram shoutouts
- Social media share templates with achievements

**Experiences & Wellness Services**  
- Group activity vouchers (zoo, museum, NParks guided walks)
- Free basic health screenings
- Massage vouchers, fitness class passes

> Rewards are **non-gambling, health-linked, and employer/govt-friendly**—designed to nudge behaviour towards movement, screenings, and community.

***

### 3. Elastic Agent Builder (AI Referee)

#### Core Responsibilities
- **Judging**: Verify all performance claims
- **Refereeing**: Enforce rules, detect anomalies
- **Actions**: Trigger rewards, log HealthHub, send nudges
- **Recommendations**: RAG-powered personalized insights

#### Custom Tools
- **Vision RAG**: Meal photo → classifies hawker vs non-hawker → (if hawker) lookup SFA hawker nutrition DB → calorie/sodium scoring
- **GPS Validator**: Strava API cross-check → route verification
- **Weather Tool**: Rainy day adjustments for outdoor activity scoring
- **Reward Engine**: Distribute health perks and vouchers
- **LTA Routes**: Nearby trail recommendations and walkability scores

#### Agentic Workflows

**1. Data Ingestion Workflow**  
User sends photo in **private DM** → grammy passes image URL to Agent Builder → Agent Builder calls `analyze_meal_photo` tool (vision + SFA RAG) → calls `write_meal_score` to store *score only* in time-series index → returns detailed reply to grammy → grammy sends private DM reply to user only

**2. Weekly Judgment Workflow**  
Sunday 7PM trigger → ES|QL aggregates all metrics → age-adjusted benchmarks → rank league → assign rewards → Telegram broadcast → update HealthHub

**3. Personalization Workflow**  
Daily check: metric trending down → RAG analysis → smart recommendation ("Your meal balance is weak—if hawker-related, try this lower-cal stall nearby") → weather + route check → send nudge

**MCP Integration**: Optional edge (NullClaw) for offline tracking → sync to Elastic when online

***

## User Stories & Features

### Story 1: Office Professional – Frictionless Join
**As a** desk worker wanting fitness accountability, **I want** to join my colleagues' health challenge with one tap, **so that** I can start competing immediately without setup complexity.

**Features**:
- **One-tap join**: Click Telegram invite link → auto-setup with default metrics
- **Auto-connect**: Apple Health permission → instant score calculation
- **Live nudges**: "You're 3rd—Sarah ahead by 2k steps 😅"
- **Rewards**: Winner gets free kopi for a week, runners-up get badges

**Onboarding Flow**: 
1. Receive Telegram invite (10 seconds)
2. Tap "Join Challenge" (5 seconds)
3. Connect Apple Health (15 seconds)
4. See first score update (instant)

**Total time to first value**: ~30 seconds

***

### Story 2: Family Health League
**As a** parent wanting healthier family habits, **I want** to create a household challenge where everyone's progress combines, **so that** we make health a fun family goal.

**Features**:
- **Family Squad**: Auto-combine everyone's metrics into team score
- **Kid-friendly**: Simple "our family's health points" display
- **Shared rewards**: Family activity vouchers (zoo, museum, nature walk)
- **Transparency**: Kids see how each person contributes

**Agentic Flow**: Create family league → invite via WhatsApp → auto-sync data → weekly team score reveal

***

### Story 3: Anonymous Fitness Challenge
**As a** runner wanting private accountability, **I want** to challenge matched runners without public exposure, **so that** I push harder without social media pressure.

**Features**:
- **Smart matching**: Agent pairs by fitness level from Strava history
- **Private mode**: 1v1 or small group (max 4), identities hidden until end
- **GPS verification**: Strava API validates routes automatically
- **Rewards**: Winner gets "Speed Demon" badge + optional reveal

**Agentic Flow**: Opt into matching → receive challenge → track privately → Sunday reveal + optional rematch

***

### Story 4: Chronic Patient – Gentle Health Goals
**As a** prediabetic adult, **I want** to track my improvement over 3 months with supportive nudges, **so that** health goals feel achievable not overwhelming.

**Features**:
- **Long-term challenge**: "Improve HbA1c by 0.3 in 12 weeks"
- **Multi-source tracking**: Steps + meal + HealthHub lab results
- **Probability tracking**: ES model shows "72% on track" with explanations
- **Milestone rewards**: Weekly health perks for consistent effort
- **Safety net**: Agent suggests easier goals if falling behind

**Agentic Flow**: Set 3-month goal → weekly check-ins → adjust recommendations → HealthHub verification → reward milestones

***

### Story 5: Elderly Community Walk
**As a** senior wanting social activity, **I want** simple voice-based neighbourhood walk challenges, **so that** I stay active through friendly local competition.

**Features**:
- **Voice setup**: Mandarin/Hokkien "join walk challenge"
- **Auto-tracking**: Apple Health captures steps, no manual logging
- **Local focus**: "Bedok aunties—5k steps daily" neighbourhood leagues
- **Social meetups**: Top participants meet at hawker center weekly
- **Family connection**: Kids notified of mom's achievements

**Agentic Flow**: Voice enrollment → auto-track steps → weekly rank → voucher + social gathering

***

## Competitive Differentiation

| Feature        | ChatGPT Health | Goals/StickK | Strava      | Healthy 365           | **KiasuHealth**                               |
|----------------|----------------|--------------|-------------|-----------------------|----------------------------------------------|
| **Core Value** | 1:1 Health assistant | Commitment contracts | Runs only | Steps/meals tracking | **Social accountability + competition** |
| **Data Sources** | Medical records + apps | Single commitment | Runs only | Steps/meals, govt | **Omni** (Health + Strava + meal (including hawker) + HealthHub) |
| **Verification** | Passive | Honor/partner | GPS | QR scans | **AI referee** (vision RAG + API cross-check) |
| **Rewards**    | None | Money stakes | Kudos | Govt points | **Health perks + vouchers + bragging rights** |
| **Social**     | Solo | 1:1 partners | Public leaderboards | Mostly solo | **Small groups + anonymous challenges** |
| **Game Mechanics** | Q&A | Linear tracking | Segments | Badges & points | **Weekly challenges + optional lineup customization** |
| **Cultural Fit** | Global | Western self-help | Global runners | Generic SG | **Kiasu, hawker, auntie-uncle banter** |
| **Onboarding** | Chat-based | Manual setup | Profile setup | App download | **One-tap Telegram join** |

**X-Factor**: Same data sources as others, but **primary feature is kiasu social accountability**, not solo insights or generic gamification.

**Without the accountability layer, we'd just be another health data aggregator—redundant vs ChatGPT Health and Apple Health analyzers.**

***

## Expected Outcomes (Measurable)

| Metric             | Target                          | Baseline Comparison                   | Measurement Method           |
|--------------------|----------------------------------|---------------------------------------|------------------------------|
| **Onboarding Completion** | 85% complete setup in <60 seconds | Typical health apps 50–60% | Time-to-first-value tracking |
| **Habit Consistency** | 75–80% maintain 6-week streaks | Health apps <30% retention | Retention cohort analysis |
| **Weekly Engagement** | 70–80% open app 5+ days/week | Typical health apps ~35% | Daily active users |
| **Social Adoption** | 60% users join group challenges | Strava clubs ~35% active | League creation/join rates |
| **Reward Redemption** | High redemption of health perks | Healthy 365: partial voucher use | Reward logs |
| **Healthier SG Points** | 500k points via KiasuHealth Year 1 | Healthier SG app growth targets | API tracking |
| **Health Outcomes** | 30% BP/HbA1c improvement (chronic users) | Healthier SG pilot ~15% | HealthHub data (opt-in) |
| **Viral Spread** | 1M SG users Year 1 via office/family | WhatsApp/Telegram sharing loops | Referral attribution |

***

## Technology Stack

### Frontend / Bot Layer
- **Telegram Bot**: Primary interface (high SG adoption, zero install friction) — bot logic runs as a grammy webhook handler inside the Next.js backend; no separate bot process
- **grammy**: TypeScript-first Telegram bot framework; serverless-compatible, runs natively on Vercel edge/serverless functions
- **Web Dashboard**: Optional live leaderboard via Next.js App Router page (future; scaffolded for free alongside the API)
- **Voice Support**: Mandarin/Hokkien via Whisper ASR for seniors (future)

### Backend – Next.js 16 + Elastic Stack
- **Next.js 16 (App Router + TypeScript)**: Unified API layer — replaces standalone Express/FastAPI. API routes handle `/photo`, `/standings`, `/reveal`, and the Telegram webhook in one repo.
- **Vercel**: Zero-config deployment. `git push` = live. Telegram webhook URL is the Vercel domain — no tunnelling tools needed during demo.
- **`@elastic/elasticsearch` (Node.js SDK)**: Official TypeScript client for Elasticsearch; used in `lib/elastic.ts`
- **Elasticsearch**: Time-series health data + image embeddings
- **Agent Builder**: Custom tools (vision RAG, APIs) + workflows (judgment, rewards, nudges)
- **ES|QL**: Ranking queries, age-adjusted benchmarks
- **MCP**: Tool exposure for optional local agents

> **Why not Python + FastAPI?** Elastic's official JS/TS SDK is first-class, grammy (Telegram) runs in the same Node.js runtime, and Vercel eliminates all DevOps overhead. Single language (TypeScript) across bot, API, and optional dashboard reduces context-switching. Revert to FastAPI only if the team is majority Python-fluent with no Next.js experience.
>
> **Next.js version**: 16 is the current stable release (March 2026). `npx create-next-app@latest` will scaffold it automatically.

### Integrations
- **Apple Health SDK**: Steps, vitals, sleep
- **Strava API**: GPS runs, cycling
- **Rewards System**: Mock distribution for demo; future Healthier SG/partner integration
- **HealthHub API**: Healthier SG points, screening records
- **SFA Open Data**: Hawker nutrition database (used when photos are identified as hawker meals)
- **LTA/OneMap**: Trail routes, walkability, weather
- **MCCY**: Arts and cultural vouchers

### Optional Edge
- **NullClaw**: Local offline tracking → sync to Elastic when online

***

## MVP Scope (48hr Hackathon)

### Core Demo Flow (Simple Onboarding Focus)

**Phase 1: Frictionless Join (30 seconds)**
1. Judge 1 receives Telegram invite link
2. Taps "Join Office Health Challenge"
3. Connects Apple Health (or uses pre-loaded mock data)
4. Sees initial score and position

**Phase 2: Activity & Verification (1 minute)**
1. Judge sends `/photo` in a **private DM** with the KiasuHealth bot (never in the group chat)
2. Bot replies privately: calories estimate, balance score (e.g. 3/10), and a one-line tip
3. Only the **balance score** is written to Elastic for ranking; photo and raw nutrition details stay in the DM
4. Mock Strava data syncs (pre-loaded runs)
5. Scores update in real-time

**Phase 3: AI Judgment & Reveal (30 seconds)**
1. Elastic Agent Builder aggregates all metrics
2. ES|QL ranks with age-adjustment
3. Sunday reveal: standings + kiasu GIFs

**Phase 4: Rewards & Nudges (30 seconds)**
1. Winner gets mock health perk notification
2. Personalized RAG recommendation for next week
3. Optional: show "customize lineup" teaser

**Total Demo**: ~2.5 minutes

**Bonus Demo Path**: Show advanced user customizing their captain metric to demonstrate progressive depth without overwhelming beginners.

### Technical Implementation
- **Agent Tools**: Vision RAG (SFA nutrition), weather API, mock rewards
- **Workflows**: Ingest → verify → rank → reward → nudge
- **Data**: Pre-loaded mock week for 4 judges
- **Telegram Bot**: Live interaction on stage

### Success Criteria
- ✅ <30 second onboarding (judge joins with one tap)
- ✅ Live photo verification (meal plate → calorie score; hawker demo supported)
- ✅ Multi-source ranking (steps + meal + Strava)
- ✅ Auto-reward simulation (health perk notification)
- ✅ Cultural wow moment (kiasu GIFs, hawker angle)
- ✅ Progressive disclosure shown (simple first, advanced optional)

***

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Onboarding complexity** | High drop-off | One-tap Telegram join, default metrics, progressive disclosure of advanced features |
| **Privacy concerns** | Medium-High | **Private DM food logging**: photos stay between user and bot; only score shared with league. First-use disclosure: "Food photos stay between you and KiasuHealth. Only your score is shared with your league." PDPA-compliant; no group-chat CCTV effect. Local-first option available. |
| **Cheating** (fake data) | Medium | Vision RAG detects stock images, Strava API validates routes, anomaly detection |
| **Social pressure backfires** | Medium | Private challenges available, positive framing ("most improved" awards), opt-out friendly |
| **Fairness disputes** | Medium | Age-adjusted benchmarks, transparent scoring, personal boost options |
| **Reward sustainability** | Medium | Partner with Healthier SG, employers sponsor leagues, freemium for premium boosters |

***

## Success Metrics (Hack Judging)

**Elastic Agent Builder Showcase (30%)**
- ✅ Multi-tool orchestration (vision + API + workflow)
- ✅ ES|QL custom ranking logic with age-adjustment
- ✅ RAG personalized recommendations

**Impact & Wow (30%)**
- ✅ Tackles real SG health crisis (sedentary lifestyles, chronic disease)
- ✅ Cultural twist (hawker, kiasu psychology, health rewards)
- ✅ Clear differentiation: social accountability, not solo insights

**Technical Execution (30%)**
- ✅ <30 second onboarding in live demo
- ✅ Realistic integrations (Strava, Health mocked credibly)
- ✅ Clean, Elastic-centric architecture

**Presentation (10%)**
- ✅ Clear narrative: "Not another health app—kiasu accountability engine"
- ✅ Memorable hook: judges competing live with kiasu GIFs

***

**Key Product Decisions Made:**
1. **Drafting is optional and progressive** - New users get defaults, engaged users unlock customization
2. **Onboarding optimized for <30 seconds** - One-tap Telegram join removes friction
3. **Rewards are non-monetary and health-linked** - Avoids gambling perception, aligns with Healthier SG
4. **Cultural differentiation is core** - Kiasu accountability is the wedge, not just "better health insights"