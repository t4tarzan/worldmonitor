# WorldMonitor - Complete Onboarding Flow Plan

## 🎯 Overview

This document outlines the complete user journey from clicking "Get My Monitor" to having a fully configured, personalized WorldMonitor instance with optional custom domain and billing integration.

---

## 📊 User Journey Map

```
Landing Page
    ↓
[Get My Monitor] Button Click
    ↓
Multi-Step Onboarding Modal
    ↓
Step 1: Account Creation
    ↓
Step 2: Preferences & Customization
    ↓
Step 3: Domain Selection (Free Subdomain or Custom Domain)
    ↓
Step 4: Plan Selection & Billing (if custom domain/premium features)
    ↓
Step 5: Confirmation & Setup
    ↓
Personalized Dashboard with Unique URL
```

---

## 🎨 Onboarding Flow - Detailed Steps

### Step 1: Account Creation (Modal Screen 1)
**Purpose**: Capture user identity and create account

**UI Elements**:
- Email input (with validation)
- Password input (min 8 chars, strength indicator)
- Full name input (optional)
- "Continue with Google" button (OAuth)
- "Continue with GitHub" button (OAuth)
- Terms & Privacy checkbox
- "Create Account" button

**Validation**:
- Email format validation
- Password strength check (weak/medium/strong)
- Duplicate email check (real-time)
- Terms acceptance required

**Backend Actions**:
- Create user record
- Hash password (bcrypt)
- Generate email verification token
- Send welcome email
- Create default preferences object
- Log registration event

**Data Captured**:
```json
{
  "email": "user@example.com",
  "password_hash": "...",
  "full_name": "John Doe",
  "auth_method": "email|google|github",
  "email_verified": false,
  "created_at": "2024-03-10T09:43:00Z"
}
```

---

### Step 2: Preferences & Customization (Modal Screen 2)
**Purpose**: Personalize the monitoring experience

**UI Elements**:

**Section A: Primary Focus Areas** (Multi-select)
- [ ] Geopolitics & Conflicts
- [ ] Financial Markets
- [ ] Technology & Startups
- [ ] Climate & Environment
- [ ] Infrastructure & Energy
- [ ] Cybersecurity
- [ ] Regional Focus (dropdown: Middle East, Europe, Asia, etc.)

**Section B: Data Preferences**
- Language: Dropdown (21 languages)
- Time Zone: Auto-detected (editable)
- Theme: Dark / Light / Auto
- Default Map View: 3D Globe / Flat Map

**Section C: Notification Preferences**
- Email Alerts: Toggle (default: ON)
- Alert Frequency: Immediate / Hourly / Daily
- Breaking News: Toggle (default: ON)

**Section D: Initial Monitors** (Pre-configured based on focus)
- Auto-suggest 3 monitors based on selected focus areas
- User can enable/disable each
- Examples:
  - "Middle East Conflicts" (if Geopolitics selected)
  - "Bitcoin Price Alerts" (if Financial Markets selected)
  - "AI Startup News" (if Technology selected)

**Backend Actions**:
- Update user preferences in database
- Create initial monitors based on selections
- Configure default dashboard layout
- Set up notification channels

**Data Captured**:
```json
{
  "preferences": {
    "focus_areas": ["geopolitics", "finance"],
    "language": "en",
    "timezone": "America/New_York",
    "theme": "dark",
    "map_view": "globe",
    "notifications": {
      "email": true,
      "frequency": "immediate",
      "breaking_news": true
    }
  },
  "initial_monitors": [
    {
      "name": "Middle East Conflicts",
      "type": "region",
      "enabled": true
    }
  ]
}
```

---

### Step 3: Domain Selection (Modal Screen 3)
**Purpose**: Choose how to access the personalized monitor

**UI Elements**:

**Option A: Free Subdomain** (Default, Highlighted)
```
┌─────────────────────────────────────────┐
│  🆓 Free Subdomain                      │
│                                         │
│  Your Monitor URL:                      │
│  ┌─────────────┐.worldmonitor.app      │
│  │ johndoe     │                        │
│  └─────────────┘                        │
│                                         │
│  ✓ Instant setup                        │
│  ✓ SSL included                         │
│  ✓ No configuration needed              │
│                                         │
│  [Select Free Subdomain] ←─ Primary    │
└─────────────────────────────────────────┘
```

**Option B: Custom Domain** (Premium)
```
┌─────────────────────────────────────────┐
│  ⭐ Custom Domain (Pro Plan)            │
│                                         │
│  Use your own domain:                   │
│  ┌─────────────────────────────────┐   │
│  │ monitor.mycompany.com           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✓ Professional branding                │
│  ✓ White-label option                   │
│  ✓ Custom SSL certificate               │
│  ✓ Priority support                     │
│                                         │
│  Requires: Pro Plan ($9.97/mo)          │
│                                         │
│  [Select Custom Domain]                 │
└─────────────────────────────────────────┘
```

**Subdomain Validation**:
- Real-time availability check
- 3-30 characters
- Alphanumeric + hyphens only
- No profanity filter
- Reserved names check (admin, api, www, etc.)

**Custom Domain Validation**:
- DNS ownership verification
- Valid domain format
- Not already in use
- SSL certificate generation

**Backend Actions**:
- Reserve subdomain in database
- Create DNS record (for subdomain)
- Generate unique instance ID
- Set up routing configuration
- For custom domain: Create verification token

**Data Captured**:
```json
{
  "domain_type": "subdomain|custom",
  "subdomain": "johndoe",
  "custom_domain": null,
  "full_url": "https://johndoe.worldmonitor.app",
  "instance_id": "uuid-here",
  "domain_verified": true,
  "ssl_enabled": true
}
```

---

### Step 4: Plan Selection & Billing (Modal Screen 4)
**Purpose**: Choose subscription tier and process payment (if applicable)

**Conditional Display**:
- **Show if**: User selected custom domain OR wants premium features
- **Skip if**: User selected free subdomain and free plan

**UI Elements**:

**Plan Comparison Table**:
```
┌──────────────┬──────────────┬──────────────┐
│   Hobbyist   │ Professional │  Enterprise  │
│     FREE     │   $9.97/mo   │  $29.97/mo   │
├──────────────┼──────────────┼──────────────┤
│ Subdomain    │ Custom Domain│ Custom Domain│
│ 3 Monitors   │ 15 Monitors  │ Unlimited    │
│ 5 Saved Views│ Unlimited    │ Unlimited    │
│ Email Alerts │ Email+Webhook│ All Channels │
│              │ Priority     │ Dedicated    │
│              │ Support      │ Support      │
│              │              │ White-label  │
│              │              │ API Access   │
└──────────────┴──────────────┴──────────────┘
```

**If Custom Domain Selected**:
- Minimum plan: Professional ($9.97/mo)
- Highlight: "Custom domain requires Pro plan"
- Show monthly/annual toggle (annual = 2 months free)

**Payment Form** (Stripe Checkout):
- Card number
- Expiry date
- CVC
- Billing address
- "Start 14-day free trial" button
- "No charge until [date]" message

**Backend Actions**:
- Create Stripe customer
- Create Stripe subscription (with trial if applicable)
- Store payment method
- Update user plan_tier
- Create subscription record
- Send confirmation email
- Log billing event

**Data Captured**:
```json
{
  "plan_tier": "pro",
  "billing_cycle": "monthly|annual",
  "stripe_customer_id": "cus_xxx",
  "stripe_subscription_id": "sub_xxx",
  "trial_end": "2024-03-24T09:43:00Z",
  "next_billing_date": "2024-03-24T09:43:00Z",
  "payment_method": {
    "last4": "4242",
    "brand": "visa"
  }
}
```

---

### Step 5: Confirmation & Setup (Modal Screen 5)
**Purpose**: Finalize setup and provide access

**UI Elements**:

**Setup Progress Indicator**:
```
✓ Creating your account
✓ Configuring preferences
✓ Setting up your domain
✓ Initializing monitors
⏳ Preparing your dashboard...
```

**Success Screen**:
```
┌─────────────────────────────────────────┐
│           🎉 You're All Set!            │
│                                         │
│  Your WorldMonitor is ready at:         │
│                                         │
│  🔗 https://johndoe.worldmonitor.app    │
│     [Copy Link] [Visit Now]             │
│                                         │
│  📧 Confirmation sent to:               │
│     user@example.com                    │
│                                         │
│  🎯 Your monitors are active:           │
│     • Middle East Conflicts             │
│     • Bitcoin Price Alerts              │
│     • AI Startup News                   │
│                                         │
│  📚 Quick Start Guide:                  │
│     • Customize your dashboard          │
│     • Add more monitors                 │
│     • Invite team members (Pro)         │
│                                         │
│  [Go to Dashboard] ←─ Primary Button    │
└─────────────────────────────────────────┘
```

**If Custom Domain**:
```
⚠️ Custom Domain Setup Required

Your monitor is ready at:
https://johndoe.worldmonitor.app (temporary)

To activate monitor.mycompany.com:
1. Add DNS record:
   Type: CNAME
   Name: monitor
   Value: cname.worldmonitor.app
   
2. We'll verify and activate within 24 hours
3. You'll receive an email when ready

[Copy DNS Instructions] [I've Added DNS Record]
```

**Backend Actions**:
- Finalize instance creation
- Deploy user-specific configuration
- Send welcome email with credentials
- Create onboarding checklist
- Schedule follow-up emails
- Log completion event

**Data Captured**:
```json
{
  "onboarding_completed": true,
  "completed_at": "2024-03-10T09:50:00Z",
  "instance_status": "active",
  "onboarding_duration_seconds": 420,
  "steps_completed": 5,
  "conversion_source": "landing_page"
}
```

---

## 💰 Pricing & Billing Logic

### Free Tier (Hobbyist)
- **Cost**: $0/month
- **Includes**:
  - Subdomain only (username.worldmonitor.app)
  - 3 custom monitors
  - 5 saved views
  - Email alerts
  - Community support
- **Limitations**:
  - No custom domain
  - No webhooks
  - No API access
  - No white-label

### Pro Tier (Professional)
- **Cost**: $9.97/month or $99/year (save $20)
- **Includes**:
  - Custom domain support
  - 15 custom monitors
  - Unlimited saved views
  - Email + Webhook alerts
  - Priority support
  - Advanced analytics
- **Add-ons**:
  - Additional custom domain: +$5/month
  - Team members (up to 5): +$5/user/month

### Enterprise Tier
- **Cost**: $29.97/month or $299/year (save $60)
- **Includes**:
  - Everything in Pro
  - Unlimited monitors
  - Unlimited custom domains
  - API access (10k requests/month)
  - White-label option
  - SMS alerts
  - Slack/Discord integration
  - Dedicated support
  - SLA guarantee (99.9% uptime)
- **Add-ons**:
  - Additional API requests: $10/10k requests
  - Team members (unlimited): +$10/user/month

### Billing Rules
1. **Trial Period**: 14 days free for Pro/Enterprise
2. **Proration**: Immediate upgrade charges prorated amount
3. **Downgrade**: Takes effect at end of billing period
4. **Cancellation**: Access until end of paid period
5. **Failed Payment**: 3 retry attempts over 7 days, then downgrade to free
6. **Refund Policy**: 30-day money-back guarantee

---

## 🗄️ Extended Database Schema

### New Tables for Onboarding

```sql
-- Onboarding sessions (track incomplete onboardings)
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  current_step INTEGER DEFAULT 1,
  step_data JSONB DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT false,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_token ON onboarding_sessions(session_token);

-- User instances (personalized monitor instances)
CREATE TABLE user_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255) UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,
  domain_type VARCHAR(50) DEFAULT 'subdomain' CHECK (domain_type IN ('subdomain', 'custom')),
  domain_verified BOOLEAN DEFAULT false,
  ssl_enabled BOOLEAN DEFAULT true,
  instance_config JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_instances_user_id ON user_instances(user_id);
CREATE INDEX idx_user_instances_subdomain ON user_instances(subdomain);
CREATE INDEX idx_user_instances_custom_domain ON user_instances(custom_domain);

-- Domain verification records
CREATE TABLE domain_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES user_instances(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  verification_method VARCHAR(50) DEFAULT 'dns' CHECK (verification_method IN ('dns', 'http', 'email')),
  verification_token VARCHAR(255) NOT NULL,
  verification_record TEXT, -- DNS TXT record or file content
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  last_check_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_domain_verifications_instance_id ON domain_verifications(instance_id);
CREATE INDEX idx_domain_verifications_domain ON domain_verifications(domain);

-- Onboarding analytics
CREATE TABLE onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  step_number INTEGER,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_analytics_user_id ON onboarding_analytics(user_id);
CREATE INDEX idx_onboarding_analytics_event_type ON onboarding_analytics(event_type);
CREATE INDEX idx_onboarding_analytics_created_at ON onboarding_analytics(created_at DESC);

-- Billing history
CREATE TABLE billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  invoice_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  status VARCHAR(50) CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX idx_billing_history_status ON billing_history(status);

-- Reserved subdomains
CREATE TABLE reserved_subdomains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert common reserved subdomains
INSERT INTO reserved_subdomains (subdomain, reason) VALUES
('www', 'system'),
('api', 'system'),
('admin', 'system'),
('dashboard', 'system'),
('app', 'system'),
('mail', 'system'),
('ftp', 'system'),
('blog', 'system'),
('shop', 'system'),
('store', 'system');

-- Team members (for Pro/Enterprise multi-user access)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES user_instances(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  permissions JSONB DEFAULT '["read"]'::jsonb,
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_members_instance_id ON team_members(instance_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_onboarding_sessions_updated_at BEFORE UPDATE ON onboarding_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_instances_updated_at BEFORE UPDATE ON user_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔄 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      LANDING PAGE                            │
│                                                              │
│  [Get My Monitor] ──────────────────────────────────────┐   │
└──────────────────────────────────────────────────────────┼───┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────┐
│              ONBOARDING MODAL - STEP 1/5                     │
│                   Account Creation                           │
│                                                              │
│  Email: [________________]                                   │
│  Password: [________________] [Strength: ████░░]            │
│  Full Name: [________________] (optional)                    │
│                                                              │
│  ─── OR ───                                                  │
│  [Continue with Google]  [Continue with GitHub]              │
│                                                              │
│  □ I agree to Terms & Privacy Policy                         │
│                                                              │
│  [Create Account] ──────────────────────────────────────┐   │
└──────────────────────────────────────────────────────────┼───┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────┐
│              ONBOARDING MODAL - STEP 2/5                     │
│              Preferences & Customization                     │
│                                                              │
│  Primary Focus Areas:                                        │
│  ☑ Geopolitics  ☑ Finance  ☐ Technology  ☐ Climate         │
│                                                              │
│  Language: [English ▼]  Theme: [Dark ▼]                     │
│  Map View: ⚫ 3D Globe  ⚪ Flat Map                          │
│                                                              │
│  Notifications:                                              │
│  Email Alerts: [ON]  Frequency: [Immediate ▼]              │
│                                                              │
│  Suggested Monitors:                                         │
│  ☑ Middle East Conflicts                                    │
│  ☑ Bitcoin Price Alerts                                     │
│  ☐ Tech Startup News                                        │
│                                                              │
│  [Back]  [Continue] ────────────────────────────────────┐   │
└──────────────────────────────────────────────────────────┼───┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────┐
│              ONBOARDING MODAL - STEP 3/5                     │
│                  Domain Selection                            │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │ 🆓 FREE SUBDOMAIN (Recommended)                 │        │
│  │                                                 │        │
│  │ [johndoe____].worldmonitor.app                 │        │
│  │ ✓ Available                                    │        │
│  │                                                 │        │
│  │ [Select Free Subdomain] ◄── Selected           │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │ ⭐ CUSTOM DOMAIN (Pro Plan Required)            │        │
│  │                                                 │        │
│  │ [monitor.mycompany.com_______________]         │        │
│  │                                                 │        │
│  │ Requires: Pro Plan ($9.97/mo)                  │        │
│  │ [Select Custom Domain]                         │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  [Back]  [Continue] ────────────────────────────────────┐   │
└──────────────────────────────────────────────────────────┼───┘
                                                           │
                                                           ▼
                                              ┌────────────┴────────────┐
                                              │                         │
                                         Free Subdomain          Custom Domain
                                              │                         │
                                              │                         ▼
                                              │        ┌─────────────────────────────────┐
                                              │        │ ONBOARDING MODAL - STEP 4/5     │
                                              │        │    Plan Selection & Billing      │
                                              │        │                                  │
                                              │        │  ┌──────┬──────┬──────┐         │
                                              │        │  │ Free │ Pro  │ Ent  │         │
                                              │        │  │      │ ✓    │      │         │
                                              │        │  └──────┴──────┴──────┘         │
                                              │        │                                  │
                                              │        │  $9.97/month                     │
                                              │        │  ☑ Monthly  ☐ Annual (save 20%) │
                                              │        │                                  │
                                              │        │  Card: [________________]        │
                                              │        │  Exp: [__/__]  CVC: [___]       │
                                              │        │                                  │
                                              │        │  [Start 14-Day Free Trial]       │
                                              │        └──────────────────────────────────┘
                                              │                         │
                                              └─────────────┬───────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ONBOARDING MODAL - STEP 5/5                     │
│              Confirmation & Setup                            │
│                                                              │
│  ✓ Creating your account                                    │
│  ✓ Configuring preferences                                  │
│  ✓ Setting up your domain                                   │
│  ✓ Initializing monitors                                    │
│  ⏳ Preparing your dashboard...                             │
│                                                              │
│  ────────────────────────────────────                       │
│                                                              │
│  🎉 You're All Set!                                         │
│                                                              │
│  Your WorldMonitor:                                          │
│  🔗 https://johndoe.worldmonitor.app                        │
│                                                              │
│  [Go to Dashboard] ─────────────────────────────────────┐   │
└──────────────────────────────────────────────────────────┼───┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PERSONALIZED DASHBOARD                          │
│                                                              │
│  Welcome, John! 👋                                          │
│                                                              │
│  [Map View]                                                  │
│  [Active Monitors: 3]                                        │
│  [Breaking News Feed]                                        │
│  [Quick Actions]                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Complete Task Breakdown

### Phase 1: Frontend Components (UI/UX)

#### Task 1.1: Onboarding Modal Container
- **File**: `src/components/onboarding/OnboardingModal.tsx`
- **Description**: Main modal wrapper with step navigation
- **Acceptance Criteria**:
  - [ ] Modal opens on "Get My Monitor" click
  - [ ] Shows progress indicator (Step X of 5)
  - [ ] Supports back/forward navigation
  - [ ] Prevents closing during critical steps
  - [ ] Responsive design (mobile/tablet/desktop)
  - [ ] Smooth transitions between steps
  - [ ] Escape key closes modal (with confirmation)

#### Task 1.2: Step 1 - Account Creation Form
- **File**: `src/components/onboarding/steps/AccountCreation.tsx`
- **Description**: Email/password registration with OAuth options
- **Acceptance Criteria**:
  - [ ] Email input with real-time validation
  - [ ] Password input with strength indicator
  - [ ] Full name input (optional)
  - [ ] Google OAuth button (functional)
  - [ ] GitHub OAuth button (functional)
  - [ ] Terms & Privacy checkbox (required)
  - [ ] Duplicate email check (debounced)
  - [ ] Form validation before proceeding
  - [ ] Loading state during submission
  - [ ] Error handling with user-friendly messages

#### Task 1.3: Step 2 - Preferences Form
- **File**: `src/components/onboarding/steps/PreferencesForm.tsx`
- **Description**: Customization options for monitoring experience
- **Acceptance Criteria**:
  - [ ] Multi-select focus areas (checkboxes)
  - [ ] Language dropdown (21 languages)
  - [ ] Timezone auto-detection with manual override
  - [ ] Theme selector (dark/light/auto)
  - [ ] Map view selector (3D/flat)
  - [ ] Notification toggles
  - [ ] Alert frequency dropdown
  - [ ] Suggested monitors based on focus areas
  - [ ] Preview of selected preferences
  - [ ] Save preferences to state

#### Task 1.4: Step 3 - Domain Selection
- **File**: `src/components/onboarding/steps/DomainSelection.tsx`
- **Description**: Choose between free subdomain or custom domain
- **Acceptance Criteria**:
  - [ ] Free subdomain option (default selected)
  - [ ] Subdomain input with real-time availability check
  - [ ] Validation (3-30 chars, alphanumeric + hyphens)
  - [ ] Reserved subdomain blocking
  - [ ] Custom domain option (shows Pro badge)
  - [ ] Custom domain input with validation
  - [ ] Clear pricing indication
  - [ ] Visual distinction between free/paid options
  - [ ] Debounced availability API calls
  - [ ] Loading states for checks

#### Task 1.5: Step 4 - Plan Selection & Billing
- **File**: `src/components/onboarding/steps/PlanSelection.tsx`
- **Description**: Subscription tier selection and payment
- **Acceptance Criteria**:
  - [ ] Conditional rendering (skip if free subdomain)
  - [ ] Three-tier comparison table
  - [ ] Highlight required plan for custom domain
  - [ ] Monthly/Annual toggle
  - [ ] Stripe Elements integration
  - [ ] Card input validation
  - [ ] Billing address form
  - [ ] Trial period messaging
  - [ ] Secure payment processing
  - [ ] Payment error handling
  - [ ] Success confirmation

#### Task 1.6: Step 5 - Confirmation & Setup
- **File**: `src/components/onboarding/steps/Confirmation.tsx`
- **Description**: Final setup and success screen
- **Acceptance Criteria**:
  - [ ] Animated progress indicator
  - [ ] Success message with confetti animation
  - [ ] Display personalized URL
  - [ ] Copy link button
  - [ ] Email confirmation message
  - [ ] List of active monitors
  - [ ] Quick start guide links
  - [ ] Custom domain DNS instructions (if applicable)
  - [ ] "Go to Dashboard" button
  - [ ] Redirect after 5 seconds (optional)

### Phase 2: Backend API Endpoints

#### Task 2.1: Onboarding Session Management
- **File**: `api/onboarding/session.ts`
- **Endpoints**:
  - `POST /api/onboarding/start` - Create session
  - `GET /api/onboarding/session/:token` - Get session
  - `PUT /api/onboarding/session/:token` - Update step data
  - `DELETE /api/onboarding/session/:token` - Cancel session
- **Acceptance Criteria**:
  - [ ] Create session with 24h expiry
  - [ ] Store step progress
  - [ ] Validate session token
  - [ ] Handle expired sessions
  - [ ] Clean up old sessions (cron job)

#### Task 2.2: Account Creation API
- **File**: `api/onboarding/account.ts`
- **Endpoint**: `POST /api/onboarding/account`
- **Acceptance Criteria**:
  - [ ] Email validation
  - [ ] Password hashing (bcrypt)
  - [ ] Duplicate email check
  - [ ] Create user record
  - [ ] Generate verification token
  - [ ] Send welcome email
  - [ ] Return JWT token
  - [ ] Log registration event

#### Task 2.3: Preferences API
- **File**: `api/onboarding/preferences.ts`
- **Endpoint**: `PUT /api/onboarding/preferences`
- **Acceptance Criteria**:
  - [ ] Validate preference data
  - [ ] Update user preferences
  - [ ] Create initial monitors
  - [ ] Configure dashboard layout
  - [ ] Return updated preferences

#### Task 2.4: Domain Availability API
- **File**: `api/onboarding/domain-check.ts`
- **Endpoints**:
  - `GET /api/onboarding/subdomain/check/:subdomain` - Check availability
  - `POST /api/onboarding/subdomain/reserve` - Reserve subdomain
  - `POST /api/onboarding/custom-domain/verify` - Verify custom domain
- **Acceptance Criteria**:
  - [ ] Check subdomain availability
  - [ ] Validate subdomain format
  - [ ] Check reserved list
  - [ ] Reserve subdomain atomically
  - [ ] Validate custom domain format
  - [ ] Create DNS verification token
  - [ ] Check DNS records
  - [ ] Update verification status

#### Task 2.5: Instance Creation API
- **File**: `api/onboarding/instance.ts`
- **Endpoint**: `POST /api/onboarding/instance`
- **Acceptance Criteria**:
  - [ ] Create user_instances record
  - [ ] Generate instance config
  - [ ] Set up routing
  - [ ] Configure SSL
  - [ ] Create DNS records (subdomain)
  - [ ] Initialize monitors
  - [ ] Return instance details

#### Task 2.6: Billing Integration API
- **File**: `api/onboarding/billing.ts`
- **Endpoints**:
  - `POST /api/onboarding/checkout` - Create Stripe checkout
  - `POST /api/onboarding/subscription` - Create subscription
- **Acceptance Criteria**:
  - [ ] Create Stripe customer
  - [ ] Create checkout session
  - [ ] Handle trial period
  - [ ] Process payment
  - [ ] Create subscription record
  - [ ] Update user plan_tier
  - [ ] Send confirmation email
  - [ ] Log billing event

### Phase 3: Domain Management System

#### Task 3.1: DNS Configuration Service
- **File**: `server/services/dns-manager.ts`
- **Description**: Manage DNS records for subdomains and custom domains
- **Acceptance Criteria**:
  - [ ] Create CNAME records for subdomains
  - [ ] Generate verification tokens
  - [ ] Check DNS propagation
  - [ ] Update verification status
  - [ ] Handle DNS errors gracefully

#### Task 3.2: SSL Certificate Management
- **File**: `server/services/ssl-manager.ts`
- **Description**: Automatic SSL certificate provisioning
- **Acceptance Criteria**:
  - [ ] Generate SSL certificates (Let's Encrypt)
  - [ ] Auto-renewal before expiry
  - [ ] Store certificates securely
  - [ ] Handle certificate errors

#### Task 3.3: Custom Domain Verification
- **File**: `server/services/domain-verifier.ts`
- **Description**: Verify ownership of custom domains
- **Acceptance Criteria**:
  - [ ] DNS TXT record verification
  - [ ] HTTP file verification
  - [ ] Email verification (fallback)
  - [ ] Retry logic with backoff
  - [ ] Notification on success/failure

### Phase 4: Billing & Subscription Management

#### Task 4.1: Stripe Integration Service
- **File**: `server/services/stripe-service.ts`
- **Description**: Handle all Stripe operations
- **Acceptance Criteria**:
  - [ ] Create customers
  - [ ] Create subscriptions
  - [ ] Handle upgrades/downgrades
  - [ ] Process refunds
  - [ ] Handle failed payments
  - [ ] Sync with database

#### Task 4.2: Subscription Lifecycle Manager
- **File**: `server/services/subscription-manager.ts`
- **Description**: Manage subscription state changes
- **Acceptance Criteria**:
  - [ ] Handle trial expiration
  - [ ] Process plan changes
  - [ ] Handle cancellations
  - [ ] Enforce plan limits
  - [ ] Send billing reminders

#### Task 4.3: Usage Tracking Service
- **File**: `server/services/usage-tracker.ts`
- **Description**: Track usage against plan limits
- **Acceptance Criteria**:
  - [ ] Monitor count tracking
  - [ ] API request counting
  - [ ] Storage usage tracking
  - [ ] Alert when approaching limits
  - [ ] Block when limits exceeded

### Phase 5: Testing & Validation

#### Task 5.1: Unit Tests
- **Files**: `tests/unit/onboarding/*.test.ts`
- **Coverage**:
  - [ ] Account creation validation
  - [ ] Subdomain validation logic
  - [ ] Domain verification logic
  - [ ] Billing calculations
  - [ ] Plan limit enforcement

#### Task 5.2: Integration Tests
- **Files**: `tests/integration/onboarding/*.test.ts`
- **Coverage**:
  - [ ] Complete onboarding flow
  - [ ] Stripe webhook handling
  - [ ] DNS verification flow
  - [ ] Email delivery
  - [ ] Database transactions

#### Task 5.3: E2E Tests
- **Files**: `e2e/onboarding/*.spec.ts`
- **Coverage**:
  - [ ] Full user journey (free subdomain)
  - [ ] Full user journey (custom domain + Pro)
  - [ ] OAuth flows
  - [ ] Payment processing
  - [ ] Error scenarios

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path - Free Subdomain
```
1. User clicks "Get My Monitor"
2. Enters email: test@example.com, password: Test123!@#
3. Selects focus: Geopolitics, Finance
4. Chooses language: English, theme: Dark
5. Enters subdomain: testuser (available)
6. Skips billing (free plan)
7. Sees success screen
8. Redirects to https://testuser.worldmonitor.app
9. Dashboard loads with 2 pre-configured monitors
✓ PASS
```

### Scenario 2: Happy Path - Custom Domain + Pro Plan
```
1. User clicks "Get My Monitor"
2. Completes account creation
3. Sets preferences
4. Selects custom domain: monitor.example.com
5. Sees Pro plan requirement
6. Enters payment details
7. Starts 14-day trial
8. Sees DNS setup instructions
9. Adds DNS record
10. System verifies within 5 minutes
11. Receives confirmation email
12. Accesses https://monitor.example.com
✓ PASS
```

### Scenario 3: Error - Subdomain Already Taken
```
1. User enters subdomain: admin
2. System shows "This subdomain is reserved"
3. User tries: johndoe
4. System shows "This subdomain is already taken"
5. User tries: johndoe2024
6. System shows "✓ Available"
7. User proceeds
✓ PASS
```

### Scenario 4: Error - Payment Failure
```
1. User selects Pro plan with custom domain
2. Enters invalid card: 4000000000000002
3. Stripe returns error
4. System shows "Payment failed. Please try another card."
5. User enters valid card
6. Payment succeeds
7. Subscription created
✓ PASS
```

### Scenario 5: Abandoned Onboarding
```
1. User starts onboarding
2. Completes Step 1 (account creation)
3. Closes modal at Step 2
4. Session saved with step_data
5. User returns next day
6. Clicks "Get My Monitor" again
7. System detects incomplete session
8. Shows "Continue where you left off?" prompt
9. User continues from Step 2
✓ PASS
```

### Scenario 6: OAuth Registration
```
1. User clicks "Continue with Google"
2. Redirects to Google OAuth
3. User authorizes
4. Returns with Google profile
5. System creates account (no password needed)
6. Skips to Step 2 (preferences)
7. Completes onboarding
✓ PASS
```

---

## 📊 Analytics & Tracking Events

### Events to Track

```javascript
// Onboarding started
{
  event: 'onboarding_started',
  source: 'landing_page',
  timestamp: '2024-03-10T09:43:00Z'
}

// Step completed
{
  event: 'onboarding_step_completed',
  step: 1,
  step_name: 'account_creation',
  duration_seconds: 45
}

// Domain selected
{
  event: 'domain_selected',
  domain_type: 'subdomain',
  subdomain: 'johndoe'
}

// Plan selected
{
  event: 'plan_selected',
  plan: 'pro',
  billing_cycle: 'monthly',
  trial_started: true
}

// Onboarding completed
{
  event: 'onboarding_completed',
  total_duration_seconds: 420,
  plan_tier: 'pro',
  domain_type: 'custom',
  conversion: true
}

// Onboarding abandoned
{
  event: 'onboarding_abandoned',
  last_step: 3,
  duration_seconds: 120
}
```

### Conversion Funnel Metrics

```
Landing Page Views: 10,000
├─ Get My Monitor Clicks: 3,000 (30%)
   ├─ Step 1 Completed: 2,400 (80%)
      ├─ Step 2 Completed: 2,160 (90%)
         ├─ Step 3 Completed: 1,944 (90%)
            ├─ Free Subdomain: 1,750 (90%)
            │  └─ Completed: 1,575 (90%)
            └─ Custom Domain: 194 (10%)
               ├─ Billing Started: 175 (90%)
                  └─ Payment Success: 140 (80%)

Overall Conversion: 17.15%
Paid Conversion: 1.4%
```

---

## 🚀 Implementation Priority

### Week 1: Core Onboarding Flow
- [ ] Task 1.1: Modal container
- [ ] Task 1.2: Account creation form
- [ ] Task 1.3: Preferences form
- [ ] Task 2.1: Session management API
- [ ] Task 2.2: Account creation API
- [ ] Task 2.3: Preferences API

### Week 2: Domain Management
- [ ] Task 1.4: Domain selection UI
- [ ] Task 2.4: Domain availability API
- [ ] Task 2.5: Instance creation API
- [ ] Task 3.1: DNS configuration service
- [ ] Task 3.2: SSL management
- [ ] Task 3.3: Domain verification

### Week 3: Billing Integration
- [ ] Task 1.5: Plan selection & billing UI
- [ ] Task 2.6: Billing integration API
- [ ] Task 4.1: Stripe service
- [ ] Task 4.2: Subscription manager
- [ ] Task 4.3: Usage tracker

### Week 4: Polish & Testing
- [ ] Task 1.6: Confirmation screen
- [ ] Task 5.1: Unit tests
- [ ] Task 5.2: Integration tests
- [ ] Task 5.3: E2E tests
- [ ] Bug fixes and optimization

---

## 📝 Next Steps

1. **Review this plan** - Ensure all stakeholders agree
2. **Set up database** - Run extended schema SQL
3. **Create component stubs** - Set up file structure
4. **Implement Week 1 tasks** - Core onboarding flow
5. **Test incrementally** - Don't wait until the end
6. **Iterate based on feedback** - Adjust as needed

---

**This plan is ready for implementation. All tasks are clearly defined with acceptance criteria and test scenarios.**
