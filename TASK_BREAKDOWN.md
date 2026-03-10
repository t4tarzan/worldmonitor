# WorldMonitor Onboarding - Complete Task Breakdown

## 📋 Task Organization

This document provides a detailed, actionable task list for implementing the complete "Get My Monitor" onboarding flow with custom domain integration and billing.

---

## 🎯 PHASE 1: Frontend Components (Week 1)

### Task 1.1: Onboarding Modal Container
**File**: `src/components/onboarding/OnboardingModal.tsx`  
**Estimated Time**: 6 hours  
**Priority**: HIGH  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Modal opens when "Get My Monitor" button clicked
- [ ] Shows progress indicator (Step X of 5)
- [ ] Back/Next navigation buttons
- [ ] Cannot close during payment processing
- [ ] Escape key closes with confirmation dialog
- [ ] Responsive on mobile/tablet/desktop
- [ ] Smooth CSS transitions between steps
- [ ] Saves progress to localStorage
- [ ] Detects and resumes incomplete sessions

**Implementation Details**:
```typescript
interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
  sessionToken?: string;
}

interface OnboardingState {
  currentStep: number;
  stepData: {
    step1: AccountData;
    step2: PreferencesData;
    step3: DomainData;
    step4: BillingData;
    step5: ConfirmationData;
  };
  sessionToken: string;
}
```

**Test Cases**:
1. Modal opens on button click
2. Progress indicator updates correctly
3. Back button works on all steps except step 1
4. Cannot skip steps
5. Escape key shows confirmation dialog
6. Session persists on page refresh

---

### Task 1.2: Step 1 - Account Creation Form
**File**: `src/components/onboarding/steps/AccountCreation.tsx`  
**Estimated Time**: 8 hours  
**Priority**: HIGH  
**Dependencies**: Task 1.1

**Acceptance Criteria**:
- [ ] Email input with real-time validation
- [ ] Password input with strength indicator (weak/medium/strong)
- [ ] Full name input (optional)
- [ ] Google OAuth button integration
- [ ] GitHub OAuth button integration
- [ ] Terms & Privacy checkbox (required)
- [ ] Duplicate email check (debounced 500ms)
- [ ] Form validation before proceeding
- [ ] Loading spinner during submission
- [ ] Error messages display clearly
- [ ] Success state transitions to Step 2

**Validation Rules**:
```typescript
const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    asyncCheck: checkEmailAvailability
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    strength: calculatePasswordStrength
  },
  terms: {
    required: true,
    mustBeTrue: true
  }
};
```

**API Integration**:
- `POST /api/onboarding/account` - Create account
- `GET /api/onboarding/check-email/:email` - Check availability
- OAuth redirects handled by NextAuth

**Test Cases**:
1. Invalid email shows error
2. Weak password shows warning
3. Duplicate email prevented
4. Terms must be accepted
5. OAuth flows work correctly
6. Form submits successfully

---

### Task 1.3: Step 2 - Preferences Form
**File**: `src/components/onboarding/steps/PreferencesForm.tsx`  
**Estimated Time**: 10 hours  
**Priority**: HIGH  
**Dependencies**: Task 1.2

**Acceptance Criteria**:
- [ ] Multi-select focus areas (checkboxes with icons)
- [ ] Language dropdown (21 languages)
- [ ] Timezone auto-detection with manual override
- [ ] Theme selector (dark/light/auto) with preview
- [ ] Map view selector (3D globe/flat map) with preview
- [ ] Email alerts toggle
- [ ] Alert frequency dropdown (immediate/hourly/daily)
- [ ] Breaking news toggle
- [ ] Suggested monitors based on focus areas
- [ ] Enable/disable individual monitors
- [ ] Preview panel showing selections
- [ ] Save to session state

**Focus Areas**:
```typescript
const focusAreas = [
  { id: 'geopolitics', label: 'Geopolitics & Conflicts', icon: '🌍' },
  { id: 'finance', label: 'Financial Markets', icon: '💹' },
  { id: 'technology', label: 'Technology & Startups', icon: '💻' },
  { id: 'climate', label: 'Climate & Environment', icon: '🌱' },
  { id: 'infrastructure', label: 'Infrastructure & Energy', icon: '⚡' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: '🔒' }
];
```

**Monitor Suggestions Logic**:
```typescript
const suggestMonitors = (focusAreas: string[]) => {
  const suggestions = [];
  if (focusAreas.includes('geopolitics')) {
    suggestions.push({ name: 'Middle East Conflicts', type: 'region' });
  }
  if (focusAreas.includes('finance')) {
    suggestions.push({ name: 'Bitcoin Price Alerts', type: 'keyword' });
  }
  // ... more suggestions
  return suggestions.slice(0, 3); // Max 3 suggestions
};
```

**Test Cases**:
1. At least one focus area must be selected
2. Timezone auto-detects correctly
3. Theme preview updates in real-time
4. Suggested monitors change based on focus
5. All preferences saved to state

---

### Task 1.4: Step 3 - Domain Selection
**File**: `src/components/onboarding/steps/DomainSelection.tsx`  
**Estimated Time**: 12 hours  
**Priority**: HIGH  
**Dependencies**: Task 1.3

**Acceptance Criteria**:
- [ ] Two option cards: Free Subdomain (default) and Custom Domain
- [ ] Free subdomain input with real-time availability
- [ ] Subdomain validation (3-30 chars, alphanumeric + hyphens)
- [ ] Reserved subdomain blocking
- [ ] Availability check debounced (300ms)
- [ ] Custom domain input with format validation
- [ ] Pro plan badge on custom domain option
- [ ] Clear pricing indication
- [ ] Visual selection state (border highlight)
- [ ] Loading states for availability checks
- [ ] Success/error icons for validation

**Subdomain Validation**:
```typescript
const validateSubdomain = (subdomain: string): ValidationResult => {
  // Length check
  if (subdomain.length < 3 || subdomain.length > 30) {
    return { valid: false, error: 'Must be 3-30 characters' };
  }
  
  // Format check
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(subdomain)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and hyphens' };
  }
  
  // Cannot start/end with hyphen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return { valid: false, error: 'Cannot start or end with hyphen' };
  }
  
  return { valid: true };
};
```

**API Integration**:
- `GET /api/onboarding/subdomain/check/:subdomain` - Check availability
- `POST /api/onboarding/subdomain/reserve` - Reserve subdomain

**Test Cases**:
1. Reserved subdomains rejected
2. Invalid formats show errors
3. Availability check works
4. Custom domain shows Pro requirement
5. Selection state persists

---

### Task 1.5: Step 4 - Plan Selection & Billing
**File**: `src/components/onboarding/steps/PlanSelection.tsx`  
**Estimated Time**: 14 hours  
**Priority**: HIGH  
**Dependencies**: Task 1.4, Stripe integration

**Acceptance Criteria**:
- [ ] Conditional rendering (skip if free subdomain selected)
- [ ] Three-tier comparison table
- [ ] Highlight required plan for custom domain
- [ ] Monthly/Annual toggle with savings calculation
- [ ] Stripe Elements card input
- [ ] Card validation (number, expiry, CVC)
- [ ] Billing address form
- [ ] Trial period messaging (14 days free)
- [ ] Total calculation with tax (if applicable)
- [ ] Secure payment processing
- [ ] Payment error handling with retry
- [ ] Success confirmation

**Pricing Display**:
```typescript
const pricingTiers = {
  free: {
    name: 'Hobbyist',
    price: 0,
    features: [
      'Subdomain only',
      '3 custom monitors',
      '5 saved views',
      'Email alerts',
      'Community support'
    ]
  },
  pro: {
    name: 'Professional',
    monthly: 9.97,
    annual: 99,
    features: [
      'Custom domain',
      '15 custom monitors',
      'Unlimited saved views',
      'Email + Webhook alerts',
      'Priority support'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    monthly: 29.97,
    annual: 299,
    features: [
      'Everything in Pro',
      'Unlimited monitors',
      'API access',
      'White-label',
      'Dedicated support'
    ]
  }
};
```

**Stripe Integration**:
```typescript
const handlePayment = async (paymentMethod: string) => {
  const response = await fetch('/api/onboarding/checkout', {
    method: 'POST',
    body: JSON.stringify({
      planTier: selectedPlan,
      billingCycle: billingCycle,
      paymentMethodId: paymentMethod,
      trialDays: 14
    })
  });
  
  const { clientSecret, subscriptionId } = await response.json();
  
  // Confirm payment with Stripe
  const result = await stripe.confirmCardPayment(clientSecret);
  
  if (result.error) {
    setError(result.error.message);
  } else {
    setSubscriptionId(subscriptionId);
    proceedToNextStep();
  }
};
```

**Test Cases**:
1. Skips for free subdomain users
2. Shows for custom domain users
3. Card validation works
4. Payment processing succeeds
5. Error handling works
6. Trial messaging clear

---

### Task 1.6: Step 5 - Confirmation & Setup
**File**: `src/components/onboarding/steps/Confirmation.tsx`  
**Estimated Time**: 8 hours  
**Priority**: MEDIUM  
**Dependencies**: Task 1.5

**Acceptance Criteria**:
- [ ] Animated progress indicator (5 steps)
- [ ] Success screen with confetti animation
- [ ] Display personalized URL (clickable)
- [ ] Copy link button with toast notification
- [ ] Email confirmation message
- [ ] List of active monitors (from Step 2)
- [ ] Quick start guide links
- [ ] Custom domain DNS instructions (if applicable)
- [ ] "Go to Dashboard" primary button
- [ ] Auto-redirect after 10 seconds (optional)

**Progress Animation**:
```typescript
const setupSteps = [
  { label: 'Creating your account', duration: 1000 },
  { label: 'Configuring preferences', duration: 1500 },
  { label: 'Setting up your domain', duration: 2000 },
  { label: 'Initializing monitors', duration: 1500 },
  { label: 'Preparing your dashboard', duration: 1000 }
];
```

**DNS Instructions Component**:
```typescript
const DNSInstructions = ({ domain }: { domain: string }) => (
  <div className="dns-instructions">
    <h3>Custom Domain Setup Required</h3>
    <p>Add this DNS record to activate {domain}:</p>
    <code>
      Type: CNAME
      Name: {domain.split('.')[0]}
      Value: cname.worldmonitor.app
      TTL: 3600
    </code>
    <button onClick={copyDNSInstructions}>Copy Instructions</button>
  </div>
);
```

**Test Cases**:
1. Progress animation completes
2. Confetti shows on success
3. Copy link works
4. DNS instructions show for custom domains
5. Redirect works

---

## 🔧 PHASE 2: Backend API Endpoints (Week 2)

### Task 2.1: Onboarding Session Management
**File**: `api/onboarding/session.ts`  
**Estimated Time**: 6 hours  
**Priority**: HIGH  
**Dependencies**: Database schema

**Endpoints**:
1. `POST /api/onboarding/start` - Create new session
2. `GET /api/onboarding/session/:token` - Retrieve session
3. `PUT /api/onboarding/session/:token` - Update step data
4. `DELETE /api/onboarding/session/:token` - Cancel session

**Implementation**:
```typescript
// POST /api/onboarding/start
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const sessionToken = randomBytes(32).toString('hex');
  
  const result = await pool.query(
    `INSERT INTO onboarding_sessions (session_token, current_step, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '24 hours')
     RETURNING id, session_token, current_step, expires_at`,
    [sessionToken, 1]
  );
  
  return res.status(201).json({
    success: true,
    session: result.rows[0]
  });
}
```

**Test Cases**:
1. Session created with unique token
2. Session retrieved successfully
3. Step data updates correctly
4. Expired sessions rejected
5. Invalid tokens return 404

---

### Task 2.2: Account Creation API
**File**: `api/onboarding/account.ts`  
**Estimated Time**: 8 hours  
**Priority**: HIGH  
**Dependencies**: Task 2.1

**Endpoint**: `POST /api/onboarding/account`

**Request Body**:
```typescript
interface AccountCreationRequest {
  sessionToken: string;
  email: string;
  password: string;
  fullName?: string;
  authMethod: 'email' | 'google' | 'github';
  oauthToken?: string;
}
```

**Implementation**:
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { sessionToken, email, password, fullName, authMethod } = req.body;
  
  // Validate email
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Check duplicate
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  
  // Hash password
  const passwordHash = await hash(password, 10);
  
  // Create user
  const user = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, plan_tier)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, created_at`,
    [email.toLowerCase(), passwordHash, fullName, 'free']
  );
  
  // Update session
  await pool.query(
    `UPDATE onboarding_sessions
     SET user_id = $1, step_data = jsonb_set(step_data, '{step1}', $2)
     WHERE session_token = $3`,
    [user.rows[0].id, JSON.stringify({ email, fullName, authMethod }), sessionToken]
  );
  
  // Generate JWT
  const token = sign({ userId: user.rows[0].id, email }, JWT_SECRET, { expiresIn: '7d' });
  
  // Send verification email
  await sendVerificationEmail(email);
  
  return res.status(201).json({
    success: true,
    user: user.rows[0],
    token
  });
}
```

**Test Cases**:
1. Valid account created
2. Duplicate email rejected
3. Password hashed correctly
4. JWT token generated
5. Verification email sent
6. Session updated

---

### Task 2.3: Preferences API
**File**: `api/onboarding/preferences.ts`  
**Estimated Time**: 6 hours  
**Priority**: HIGH  
**Dependencies**: Task 2.2

**Endpoint**: `PUT /api/onboarding/preferences`

**Request Body**:
```typescript
interface PreferencesRequest {
  sessionToken: string;
  focusAreas: string[];
  language: string;
  timezone: string;
  theme: 'dark' | 'light' | 'auto';
  mapView: 'globe' | 'flat';
  notifications: {
    email: boolean;
    frequency: 'immediate' | 'hourly' | 'daily';
    breakingNews: boolean;
  };
  initialMonitors: Array<{
    name: string;
    type: string;
    enabled: boolean;
  }>;
}
```

**Implementation**:
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { sessionToken, focusAreas, language, timezone, theme, mapView, notifications, initialMonitors } = req.body;
  
  // Get session
  const session = await pool.query(
    'SELECT user_id FROM onboarding_sessions WHERE session_token = $1',
    [sessionToken]
  );
  
  if (session.rows.length === 0) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const userId = session.rows[0].user_id;
  
  // Update user preferences
  await pool.query(
    `UPDATE users
     SET preferences = $1
     WHERE id = $2`,
    [JSON.stringify({ focusAreas, language, timezone, theme, mapView, notifications }), userId]
  );
  
  // Create initial monitors
  for (const monitor of initialMonitors.filter(m => m.enabled)) {
    await pool.query(
      `INSERT INTO monitors (user_id, name, type, config, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, monitor.name, monitor.type, JSON.stringify({}), true]
    );
  }
  
  // Update session
  await pool.query(
    `UPDATE onboarding_sessions
     SET current_step = 3,
         step_data = jsonb_set(step_data, '{step2}', $1)
     WHERE session_token = $2`,
    [JSON.stringify(req.body), sessionToken]
  );
  
  return res.status(200).json({ success: true });
}
```

**Test Cases**:
1. Preferences saved correctly
2. Monitors created
3. Session updated to step 3
4. Invalid session rejected

---

### Task 2.4: Domain Availability API
**File**: `api/onboarding/domain-check.ts`  
**Estimated Time**: 10 hours  
**Priority**: HIGH  
**Dependencies**: Database functions

**Endpoints**:
1. `GET /api/onboarding/subdomain/check/:subdomain`
2. `POST /api/onboarding/subdomain/reserve`
3. `POST /api/onboarding/custom-domain/verify`

**Subdomain Check**:
```typescript
// GET /api/onboarding/subdomain/check/:subdomain
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { subdomain } = req.query;
  
  // Use database function
  const result = await pool.query(
    'SELECT check_subdomain_availability($1) as available',
    [subdomain]
  );
  
  if (result.rows[0].available) {
    // Suggest if taken
    const suggestion = await pool.query(
      'SELECT suggest_subdomain($1) as suggestion',
      [subdomain]
    );
    
    return res.status(200).json({
      available: true,
      subdomain: subdomain
    });
  } else {
    const suggestion = await pool.query(
      'SELECT suggest_subdomain($1) as suggestion',
      [subdomain]
    );
    
    return res.status(200).json({
      available: false,
      suggestion: suggestion.rows[0].suggestion
    });
  }
}
```

**Subdomain Reserve**:
```typescript
// POST /api/onboarding/subdomain/reserve
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { sessionToken, subdomain } = req.body;
  
  // Check availability again (prevent race condition)
  const available = await pool.query(
    'SELECT check_subdomain_availability($1) as available',
    [subdomain]
  );
  
  if (!available.rows[0].available) {
    return res.status(409).json({ error: 'Subdomain no longer available' });
  }
  
  // Get session
  const session = await pool.query(
    'SELECT user_id FROM onboarding_sessions WHERE session_token = $1',
    [sessionToken]
  );
  
  // Create instance (reserves subdomain)
  const instance = await pool.query(
    `INSERT INTO user_instances (user_id, instance_name, subdomain, domain_type)
     VALUES ($1, $2, $3, $4)
     RETURNING id, subdomain, deployment_url`,
    [session.rows[0].user_id, subdomain, subdomain, 'subdomain']
  );
  
  return res.status(201).json({
    success: true,
    instance: instance.rows[0],
    url: `https://${subdomain}.worldmonitor.app`
  });
}
```

**Test Cases**:
1. Available subdomain returns true
2. Taken subdomain returns false with suggestion
3. Reserved subdomain blocked
4. Race condition handled
5. Instance created successfully

---

### Task 2.5: Instance Creation API
**File**: `api/onboarding/instance.ts`  
**Estimated Time**: 12 hours  
**Priority**: HIGH  
**Dependencies**: Task 2.4, DNS service

**Endpoint**: `POST /api/onboarding/instance`

**Implementation**:
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { sessionToken, domainType, subdomain, customDomain } = req.body;
  
  // Get session and user
  const session = await pool.query(
    `SELECT os.user_id, u.plan_tier
     FROM onboarding_sessions os
     JOIN users u ON os.user_id = u.id
     WHERE os.session_token = $1`,
    [sessionToken]
  );
  
  const userId = session.rows[0].user_id;
  const planTier = session.rows[0].plan_tier;
  
  // Validate custom domain requires Pro+
  if (domainType === 'custom' && planTier === 'free') {
    return res.status(403).json({ error: 'Custom domain requires Pro plan' });
  }
  
  // Create instance
  const instance = await pool.query(
    `INSERT INTO user_instances 
     (user_id, instance_name, subdomain, custom_domain, domain_type, deployment_status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, subdomain, custom_domain, deployment_url`,
    [
      userId,
      subdomain || customDomain,
      domainType === 'subdomain' ? subdomain : null,
      domainType === 'custom' ? customDomain : null,
      domainType,
      'deploying'
    ]
  );
  
  const instanceId = instance.rows[0].id;
  
  // Set up DNS for subdomain
  if (domainType === 'subdomain') {
    await createDNSRecord(subdomain);
    await provisionSSL(subdomain);
    
    // Update deployment status
    await pool.query(
      `UPDATE user_instances
       SET deployment_status = 'deployed',
           deployment_url = $1,
           domain_verified = true
       WHERE id = $2`,
      [`https://${subdomain}.worldmonitor.app`, instanceId]
    );
  }
  
  // Set up verification for custom domain
  if (domainType === 'custom') {
    const verificationToken = randomBytes(32).toString('hex');
    
    await pool.query(
      `INSERT INTO domain_verifications 
       (instance_id, domain, verification_method, verification_token, verification_record)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        instanceId,
        customDomain,
        'dns',
        verificationToken,
        `worldmonitor-verification=${verificationToken}`
      ]
    );
  }
  
  return res.status(201).json({
    success: true,
    instance: instance.rows[0],
    verificationRequired: domainType === 'custom'
  });
}
```

**Test Cases**:
1. Subdomain instance created
2. DNS record created
3. SSL provisioned
4. Custom domain creates verification
5. Plan tier enforced

---

### Task 2.6: Billing Integration API
**File**: `api/onboarding/billing.ts`  
**Estimated Time**: 14 hours  
**Priority**: HIGH  
**Dependencies**: Stripe SDK

**Endpoints**:
1. `POST /api/onboarding/checkout` - Create checkout session
2. `POST /api/onboarding/subscription` - Create subscription

**Checkout Session**:
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { sessionToken, planTier, billingCycle, paymentMethodId } = req.body;
  
  // Get user
  const session = await pool.query(
    `SELECT os.user_id, u.email
     FROM onboarding_sessions os
     JOIN users u ON os.user_id = u.id
     WHERE os.session_token = $1`,
    [sessionToken]
  );
  
  const userId = session.rows[0].user_id;
  const email = session.rows[0].email;
  
  // Create Stripe customer
  const customer = await stripe.customers.create({
    email,
    payment_method: paymentMethodId,
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  });
  
  // Get price ID
  const priceId = billingCycle === 'annual' 
    ? process.env[`STRIPE_PRICE_ID_${planTier.toUpperCase()}_ANNUAL`]
    : process.env[`STRIPE_PRICE_ID_${planTier.toUpperCase()}`];
  
  // Create subscription with trial
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    trial_period_days: 14,
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
  
  // Save to database
  await pool.query(
    `INSERT INTO subscriptions 
     (user_id, plan_tier, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      planTier,
      subscription.status,
      customer.id,
      subscription.id,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000)
    ]
  );
  
  // Update user plan
  await pool.query(
    'UPDATE users SET plan_tier = $1 WHERE id = $2',
    [planTier, userId]
  );
  
  return res.status(201).json({
    success: true,
    subscriptionId: subscription.id,
    clientSecret: subscription.latest_invoice.payment_intent.client_secret
  });
}
```

**Test Cases**:
1. Customer created in Stripe
2. Subscription created with trial
3. Database updated
4. Client secret returned
5. Error handling works

---

## 🌐 PHASE 3: Domain Management (Week 3)

### Task 3.1: DNS Configuration Service
**File**: `server/services/dns-manager.ts`  
**Estimated Time**: 10 hours  
**Priority**: MEDIUM  
**Dependencies**: DNS provider API (Vercel, Cloudflare, or Route53)

**Functions**:
- `createDNSRecord(subdomain: string)` - Create CNAME record
- `deleteDNSRecord(subdomain: string)` - Remove record
- `checkDNSPropagation(domain: string)` - Verify DNS

**Implementation** (using Vercel DNS API):
```typescript
import { VercelClient } from '@vercel/client';

const vercel = new VercelClient({ token: process.env.VERCEL_TOKEN });

export async function createDNSRecord(subdomain: string): Promise<boolean> {
  try {
    await vercel.createDNSRecord({
      domain: 'worldmonitor.app',
      name: subdomain,
      type: 'CNAME',
      value: 'cname.vercel-dns.com',
      ttl: 3600
    });
    
    return true;
  } catch (error) {
    console.error('DNS creation failed:', error);
    return false;
  }
}

export async function checkDNSPropagation(domain: string): Promise<boolean> {
  const dns = require('dns').promises;
  
  try {
    const records = await dns.resolveCname(domain);
    return records.includes('cname.vercel-dns.com') || records.includes('cname.worldmonitor.app');
  } catch (error) {
    return false;
  }
}
```

**Test Cases**:
1. DNS record created successfully
2. Propagation check works
3. Error handling for failures
4. Record deletion works

---

### Task 3.2: SSL Certificate Management
**File**: `server/services/ssl-manager.ts`  
**Estimated Time**: 8 hours  
**Priority**: MEDIUM  
**Dependencies**: Let's Encrypt or Vercel SSL

**Functions**:
- `provisionSSL(domain: string)` - Request certificate
- `renewSSL(domain: string)` - Renew before expiry
- `checkSSLExpiry(domain: string)` - Check expiration date

**Implementation** (Vercel handles SSL automatically):
```typescript
export async function provisionSSL(domain: string): Promise<boolean> {
  // Vercel automatically provisions SSL for verified domains
  // Just need to ensure domain is added to project
  
  try {
    await vercel.addDomain({
      name: domain
    });
    
    // Wait for SSL provisioning (usually < 5 minutes)
    await waitForSSL(domain, 300000); // 5 min timeout
    
    return true;
  } catch (error) {
    console.error('SSL provisioning failed:', error);
    return false;
  }
}

async function waitForSSL(domain: string, timeout: number): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const status = await vercel.getDomain(domain);
    
    if (status.verified && status.ssl) {
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10s
  }
  
  throw new Error('SSL provisioning timeout');
}
```

**Test Cases**:
1. SSL provisioned successfully
2. Timeout handled
3. Renewal works
4. Expiry check accurate

---

### Task 3.3: Custom Domain Verification
**File**: `server/services/domain-verifier.ts`  
**Estimated Time**: 12 hours  
**Priority**: HIGH  
**Dependencies**: Task 3.1

**Functions**:
- `verifyDNS(domain: string, token: string)` - Check TXT record
- `verifyHTTP(domain: string, token: string)` - Check file
- `scheduleVerification(instanceId: string)` - Queue verification job

**Implementation**:
```typescript
export async function verifyDNS(domain: string, expectedToken: string): Promise<boolean> {
  const dns = require('dns').promises;
  
  try {
    const records = await dns.resolveTxt(domain);
    const flatRecords = records.flat();
    
    return flatRecords.some(record => 
      record.includes(`worldmonitor-verification=${expectedToken}`)
    );
  } catch (error) {
    return false;
  }
}

export async function scheduleVerification(instanceId: string): Promise<void> {
  // Get verification record
  const result = await pool.query(
    `SELECT id, domain, verification_token, attempts
     FROM domain_verifications
     WHERE instance_id = $1 AND verified = false`,
    [instanceId]
  );
  
  if (result.rows.length === 0) return;
  
  const { id, domain, verification_token, attempts } = result.rows[0];
  
  // Exponential backoff: 1min, 5min, 15min, 1hr, 6hr, 24hr
  const delays = [60, 300, 900, 3600, 21600, 86400];
  const delay = delays[Math.min(attempts, delays.length - 1)];
  
  // Schedule next check
  await pool.query(
    `UPDATE domain_verifications
     SET next_check_at = NOW() + INTERVAL '${delay} seconds',
         attempts = attempts + 1
     WHERE id = $1`,
    [id]
  );
  
  // Attempt verification
  const verified = await verifyDNS(domain, verification_token);
  
  if (verified) {
    await pool.query(
      `UPDATE domain_verifications
       SET verified = true, verified_at = NOW()
       WHERE id = $1`,
      [id]
    );
    
    await pool.query(
      `UPDATE user_instances
       SET domain_verified = true, deployment_status = 'deployed'
       WHERE id = $2`,
      [instanceId]
    );
    
    // Provision SSL
    await provisionSSL(domain);
    
    // Send confirmation email
    await sendDomainVerifiedEmail(instanceId);
  }
}
```

**Cron Job** (runs every 5 minutes):
```typescript
// api/cron/verify-domains.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get pending verifications
  const pending = await pool.query(
    `SELECT instance_id
     FROM domain_verifications
     WHERE verified = false
       AND next_check_at <= NOW()
       AND attempts < 10`
  );
  
  // Process each
  for (const row of pending.rows) {
    await scheduleVerification(row.instance_id);
  }
  
  return res.status(200).json({ processed: pending.rows.length });
}
```

**Test Cases**:
1. DNS verification works
2. HTTP verification works
3. Retry logic with backoff
4. Email sent on success
5. Gives up after 10 attempts

---

## 💳 PHASE 4: Billing & Subscription (Week 3-4)

### Task 4.1: Stripe Integration Service
**File**: `server/services/stripe-service.ts`  
**Estimated Time**: 10 hours  
**Priority**: HIGH  
**Dependencies**: Stripe SDK

**Functions**:
- `createCustomer(email, name)` - Create Stripe customer
- `createSubscription(customerId, priceId, trial)` - Create subscription
- `upgradeSubscription(subscriptionId, newPriceId)` - Upgrade plan
- `cancelSubscription(subscriptionId)` - Cancel subscription
- `processRefund(chargeId, amount)` - Process refund

**Already implemented in previous tasks, but add**:
```typescript
export async function upgradeSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId
    }],
    proration_behavior: 'always_invoice'
  });
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  }
}
```

**Test Cases**:
1. Customer creation works
2. Subscription created
3. Upgrade prorates correctly
4. Cancellation works
5. Refunds processed

---

### Task 4.2: Subscription Lifecycle Manager
**File**: `server/services/subscription-manager.ts`  
**Estimated Time**: 8 hours  
**Priority**: MEDIUM  
**Dependencies**: Task 4.1

**Functions**:
- `handleTrialExpiring(userId)` - Send reminder 3 days before
- `handlePlanChange(userId, newPlan)` - Process upgrade/downgrade
- `handleCancellation(userId)` - Downgrade to free
- `enforcePlanLimits(userId)` - Check and enforce limits

**Implementation**:
```typescript
export async function enforcePlanLimits(userId: string): Promise<void> {
  // Get user plan
  const user = await pool.query(
    'SELECT plan_tier FROM users WHERE id = $1',
    [userId]
  );
  
  const planTier = user.rows[0].plan_tier;
  const limits = PLAN_LIMITS[planTier];
  
  // Check monitor count
  const monitorCount = await pool.query(
    'SELECT COUNT(*) as count FROM monitors WHERE user_id = $1 AND is_active = true',
    [userId]
  );
  
  if (monitorCount.rows[0].count > limits.monitors) {
    // Disable excess monitors
    await pool.query(
      `UPDATE monitors
       SET is_active = false
       WHERE user_id = $1
         AND is_active = true
         AND id NOT IN (
           SELECT id FROM monitors
           WHERE user_id = $1 AND is_active = true
           ORDER BY created_at ASC
           LIMIT $2
         )`,
      [userId, limits.monitors]
    );
    
    // Notify user
    await sendLimitExceededEmail(userId, 'monitors');
  }
}

const PLAN_LIMITS = {
  free: { monitors: 3, savedViews: 5, apiRequests: 0 },
  pro: { monitors: 15, savedViews: 999999, apiRequests: 1000 },
  enterprise: { monitors: 999999, savedViews: 999999, apiRequests: 10000 }
};
```

**Test Cases**:
1. Trial expiring email sent
2. Plan change processed
3. Limits enforced
4. Downgrade handled gracefully

---

### Task 4.3: Usage Tracking Service
**File**: `server/services/usage-tracker.ts`  
**Estimated Time**: 6 hours  
**Priority**: LOW  
**Dependencies**: None

**Functions**:
- `trackMonitorCreation(userId)` - Increment monitor count
- `trackAPIRequest(userId)` - Increment API usage
- `getUsageStats(userId)` - Get current usage
- `checkLimit(userId, resource)` - Check if at limit

**Implementation**:
```typescript
export async function trackAPIRequest(userId: string): Promise<boolean> {
  // Get current month usage
  const usage = await pool.query(
    `SELECT COUNT(*) as count
     FROM usage_logs
     WHERE user_id = $1
       AND action = 'api.request'
       AND created_at >= DATE_TRUNC('month', NOW())`,
    [userId]
  );
  
  const currentUsage = parseInt(usage.rows[0].count);
  
  // Get plan limit
  const user = await pool.query(
    'SELECT plan_tier FROM users WHERE id = $1',
    [userId]
  );
  
  const limit = PLAN_LIMITS[user.rows[0].plan_tier].apiRequests;
  
  if (currentUsage >= limit) {
    return false; // Limit exceeded
  }
  
  // Log request
  await pool.query(
    `INSERT INTO usage_logs (user_id, action, created_at)
     VALUES ($1, 'api.request', NOW())`,
    [userId]
  );
  
  return true;
}
```

**Test Cases**:
1. Usage tracked correctly
2. Limits enforced
3. Stats accurate
4. Monthly reset works

---

## 🧪 PHASE 5: Testing (Week 4)

### Task 5.1: Unit Tests
**Files**: `tests/unit/onboarding/*.test.ts`  
**Estimated Time**: 12 hours  
**Priority**: HIGH

**Test Files**:
1. `account-validation.test.ts` - Email, password validation
2. `subdomain-validation.test.ts` - Subdomain format, availability
3. `domain-verification.test.ts` - DNS, HTTP verification
4. `billing-calculations.test.ts` - Pricing, prorations
5. `plan-limits.test.ts` - Limit enforcement

**Example Test**:
```typescript
describe('Subdomain Validation', () => {
  test('accepts valid subdomain', () => {
    expect(validateSubdomain('johndoe')).toEqual({ valid: true });
  });
  
  test('rejects too short subdomain', () => {
    expect(validateSubdomain('ab')).toEqual({
      valid: false,
      error: 'Must be 3-30 characters'
    });
  });
  
  test('rejects invalid characters', () => {
    expect(validateSubdomain('john_doe')).toEqual({
      valid: false,
      error: 'Only lowercase letters, numbers, and hyphens'
    });
  });
  
  test('rejects reserved subdomain', async () => {
    const available = await checkSubdomainAvailability('admin');
    expect(available).toBe(false);
  });
});
```

---

### Task 5.2: Integration Tests
**Files**: `tests/integration/onboarding/*.test.ts`  
**Estimated Time**: 16 hours  
**Priority**: HIGH

**Test Scenarios**:
1. Complete onboarding flow (free subdomain)
2. Complete onboarding flow (custom domain + Pro)
3. Stripe webhook handling
4. DNS verification flow
5. Email delivery
6. Session persistence

**Example Test**:
```typescript
describe('Complete Onboarding Flow - Free Subdomain', () => {
  let sessionToken: string;
  let userId: string;
  let authToken: string;
  
  test('Step 1: Create account', async () => {
    const response = await request(app)
      .post('/api/onboarding/account')
      .send({
        sessionToken,
        email: 'test@example.com',
        password: 'Test123!@#',
        fullName: 'Test User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('test@example.com');
    authToken = response.body.token;
    userId = response.body.user.id;
  });
  
  test('Step 2: Set preferences', async () => {
    const response = await request(app)
      .put('/api/onboarding/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionToken,
        focusAreas: ['geopolitics', 'finance'],
        language: 'en',
        theme: 'dark'
      });
    
    expect(response.status).toBe(200);
  });
  
  // ... more steps
});
```

---

### Task 5.3: E2E Tests
**Files**: `e2e/onboarding/*.spec.ts`  
**Estimated Time**: 20 hours  
**Priority**: MEDIUM

**Test Scenarios**:
1. Full user journey with Playwright
2. OAuth flows
3. Payment processing (test mode)
4. Error scenarios
5. Mobile responsiveness

**Example Test**:
```typescript
test('Complete onboarding with free subdomain', async ({ page }) => {
  // Navigate to landing page
  await page.goto('https://worldmonitor.app/landing.html');
  
  // Click "Get My Monitor"
  await page.click('text=Get My Monitor');
  
  // Wait for modal
  await page.waitForSelector('[data-testid="onboarding-modal"]');
  
  // Step 1: Account creation
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Test123!@#');
  await page.check('[name="terms"]');
  await page.click('text=Create Account');
  
  // Step 2: Preferences
  await page.waitForSelector('text=Preferences');
  await page.check('text=Geopolitics');
  await page.check('text=Finance');
  await page.click('text=Continue');
  
  // Step 3: Domain selection
  await page.waitForSelector('text=Domain Selection');
  await page.fill('[name="subdomain"]', 'testuser');
  await page.waitForSelector('text=✓ Available');
  await page.click('text=Continue');
  
  // Step 5: Confirmation (skip billing for free)
  await page.waitForSelector('text=You\'re All Set!');
  
  // Verify URL
  const url = await page.textContent('[data-testid="instance-url"]');
  expect(url).toContain('testuser.worldmonitor.app');
  
  // Go to dashboard
  await page.click('text=Go to Dashboard');
  
  // Verify redirect
  await page.waitForURL(/testuser\.worldmonitor\.app/);
});
```

---

## 📊 Summary

**Total Estimated Time**: 10-12 weeks (1 developer)  
**Total Tasks**: 23 major tasks  
**Lines of Code**: ~15,000 (estimated)

**Priority Breakdown**:
- HIGH: 15 tasks (critical path)
- MEDIUM: 6 tasks (important but not blocking)
- LOW: 2 tasks (nice to have)

**Next Steps**:
1. Review and approve this task breakdown
2. Set up development environment
3. Run database schema (`onboarding_schema.sql`)
4. Begin with Phase 1, Task 1.1
5. Test incrementally after each task
6. Deploy to staging after each phase

---

**This task breakdown is ready for implementation. Each task has clear acceptance criteria, test cases, and code examples.**
