# WorldMonitor Launch Implementation Plan

## Project Overview
Transform WorldMonitor into a production-ready SaaS platform with sitdeck.com-inspired UI/UX, deployed on Vercel with Neon Postgres, featuring tiered pricing and customizable monitoring capabilities.

## Phase 1: Landing Page & Marketing Site ✓

### Design Inspiration from SitDeck
- **Typography**: Inter font family (clean, modern, professional)
- **Color Scheme**: Dark theme with green accents (#0a0f0a background, emerald highlights)
- **Hero Section**: Large, bold headlines with clear value proposition
- **Visual Hierarchy**: Clear sections with ample whitespace
- **CTAs**: Prominent "Sign Up Free" and "View Demo" buttons

### Landing Page Components
1. **Hero Section**
   - Headline: "Real-Time Global Intelligence Dashboard"
   - Subheadline: "Monitor conflicts, markets, infrastructure, and threats with AI-powered insights"
   - Primary CTA: "Start Free" → leads to demo
   - Secondary CTA: "View Live Demo"
   - Hero Image/Video: Animated dashboard preview or banner from unsplash/pexels

2. **Features Grid** (inspired by sitdeck's widget showcase)
   - 170+ RSS Feeds
   - AI-Powered Analysis
   - Interactive Maps (3D Globe + Flat)
   - Real-Time Monitoring
   - 45+ Data Layers
   - Multi-Language Support (21 languages)

3. **Live Demo Section**
   - Embedded iframe of actual dashboard
   - Interactive tour highlights
   - "Try it yourself" CTA

4. **Use Cases Section**
   - Geopolitical Analysts
   - Financial Traders
   - Security Professionals
   - Journalists & Researchers
   - Government Agencies

5. **Pricing Section** (sitdeck-inspired tiers)
   - **Free Tier**: Full dashboard access, basic monitors
   - **Pro Tier** ($9.97/mo): Custom domains, advanced alerts
   - **Enterprise Tier** ($29.97/mo): White-label, API access, priority support

6. **Social Proof**
   - GitHub stars counter
   - User testimonials
   - Featured in media

7. **Footer**
   - Links to docs, GitHub, Twitter
   - Legal pages (Privacy, Terms)

## Phase 2: Onboarding Flow (SitDeck-Style)

### Registration Process
1. **Email Signup**
   - Clean form: Email + Password
   - Social auth options (Google, GitHub)
   - "Continue with Free Plan" default

2. **Welcome Screen**
   - Brief product tour (3-4 slides)
   - Customization options:
     - Select primary interests (Geopolitics, Finance, Tech, etc.)
     - Choose default map view
     - Set language preference

3. **Dashboard Initialization**
   - Auto-configure based on selections
   - Show quick tips overlay
   - Highlight key features

### User Dashboard
- Personalized feed based on interests
- Saved views and custom monitors
- Usage metrics (for paid tiers)
- Billing management

## Phase 3: Database Schema (Neon Postgres)

### Tables Structure

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  plan_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_tier VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Custom monitors table
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'keyword', 'region', 'source', 'custom'
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Custom domains table (for paid plans)
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(255) UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- API keys table (for enterprise)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT false
);

-- Saved views table
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage analytics table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Phase 4: Deployment Strategy

### Vercel Configuration
1. **Environment Variables**
   - `DATABASE_URL`: Neon Postgres connection string
   - `NEXTAUTH_SECRET`: Authentication secret
   - `STRIPE_SECRET_KEY`: Payment processing
   - `STRIPE_WEBHOOK_SECRET`: Webhook verification
   - All existing API keys from `.env.example`

2. **Build Settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Serverless Functions**
   - Auth endpoints (`/api/auth/*`)
   - Database operations (`/api/db/*`)
   - Stripe webhooks (`/api/webhooks/stripe`)
   - User management (`/api/users/*`)

### Domain Setup
- Primary: `worldmonitor.app` (existing)
- Variants: `tech.worldmonitor.app`, `finance.worldmonitor.app`, `happy.worldmonitor.app`
- Custom domains for enterprise users

## Phase 5: Demo API & Free Tier

### Free Tier Features
- Full dashboard access (read-only for some features)
- 3 custom monitors
- Basic alerts (email only)
- 5 saved views
- Community support

### Demo Mode
- No signup required
- All features visible
- Sample data pre-loaded
- "Upgrade to save" prompts
- Session-based (localStorage)

### Customization Options
1. **Monitor Types**
   - Keyword monitors (track specific terms)
   - Region monitors (geographic focus)
   - Source monitors (specific RSS feeds)
   - Composite monitors (multi-signal)

2. **Alert Delivery**
   - Email (all tiers)
   - Webhook (Pro+)
   - SMS (Enterprise)
   - Slack/Discord integration (Enterprise)

3. **Data Streams**
   - News feeds (customizable sources)
   - Satellite imagery (NASA FIRMS)
   - Market data (crypto, stocks)
   - Infrastructure monitoring

## Phase 6: UI Components to Build

### New Components Needed
1. **LandingPage.tsx** - Marketing homepage
2. **PricingSection.tsx** - Tier comparison table
3. **AuthModal.tsx** - Login/signup modal
4. **OnboardingWizard.tsx** - Multi-step setup
5. **UserDashboard.tsx** - Account management
6. **MonitorBuilder.tsx** - Custom monitor creator
7. **BillingPortal.tsx** - Subscription management
8. **DomainManager.tsx** - Custom domain setup

### Styling Approach
- Use existing theme system (dark/light)
- Add sitdeck-inspired components
- Maintain consistency with current design
- Use Tailwind CSS utilities (if not already)
- Inter font family throughout

## Phase 7: Authentication & Authorization

### NextAuth.js Integration
- Email/password authentication
- OAuth providers (Google, GitHub)
- JWT-based sessions
- Role-based access control

### Middleware
- Protected routes
- Plan tier verification
- Rate limiting per tier
- API key validation

## Phase 8: Payment Integration

### Stripe Setup
1. **Products & Prices**
   - Free: $0
   - Pro: $9.97/month
   - Enterprise: $29.97/month

2. **Checkout Flow**
   - Embedded Stripe Checkout
   - Upgrade/downgrade handling
   - Proration logic

3. **Webhooks**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Timeline Estimate

- **Week 1**: Landing page, hero sections, pricing page
- **Week 2**: Database setup, authentication, onboarding flow
- **Week 3**: Monitor builder, user dashboard, billing
- **Week 4**: Testing, deployment, documentation
- **Week 5**: Beta launch, feedback iteration

## Success Metrics

- User signups (target: 100 in first month)
- Conversion rate (free → paid): 5%
- Dashboard engagement: 70% daily active users
- Performance: <2s initial load time
- Uptime: 99.9%

## Next Steps

1. ✅ Clone repository
2. ✅ Analyze sitdeck.com UI/UX
3. ✅ Review codebase structure
4. 🔄 Create landing page components
5. ⏳ Set up Neon Postgres database
6. ⏳ Implement authentication
7. ⏳ Build onboarding flow
8. ⏳ Deploy to Vercel
9. ⏳ Launch beta
