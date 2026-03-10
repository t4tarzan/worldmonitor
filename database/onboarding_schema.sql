-- WorldMonitor Onboarding & Domain Management Schema Extension
-- This extends the base schema.sql with onboarding-specific tables

-- ============================================
-- ONBOARDING SESSIONS
-- ============================================

-- Track incomplete onboarding flows for resume functionality
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
  step_data JSONB DEFAULT '{
    "step1": {},
    "step2": {},
    "step3": {},
    "step4": {},
    "step5": {}
  }'::jsonb,
  completed BOOLEAN DEFAULT false,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_token ON onboarding_sessions(session_token);
CREATE INDEX idx_onboarding_sessions_expires_at ON onboarding_sessions(expires_at);

COMMENT ON TABLE onboarding_sessions IS 'Stores incomplete onboarding sessions for resume functionality';
COMMENT ON COLUMN onboarding_sessions.step_data IS 'JSON object storing data from each step for recovery';

-- ============================================
-- USER INSTANCES (Personalized Monitors)
-- ============================================

CREATE TABLE user_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255) UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,
  domain_type VARCHAR(50) DEFAULT 'subdomain' CHECK (domain_type IN ('subdomain', 'custom')),
  domain_verified BOOLEAN DEFAULT false,
  ssl_enabled BOOLEAN DEFAULT true,
  ssl_cert_expires_at TIMESTAMP,
  instance_config JSONB DEFAULT '{
    "theme": "dark",
    "language": "en",
    "timezone": "UTC",
    "map_view": "globe",
    "focus_areas": [],
    "notifications": {
      "email": true,
      "frequency": "immediate",
      "breaking_news": true
    }
  }'::jsonb,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted', 'pending')),
  deployment_status VARCHAR(50) DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'deploying', 'deployed', 'failed')),
  deployment_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP
);

CREATE INDEX idx_user_instances_user_id ON user_instances(user_id);
CREATE INDEX idx_user_instances_subdomain ON user_instances(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX idx_user_instances_custom_domain ON user_instances(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_user_instances_status ON user_instances(status);

COMMENT ON TABLE user_instances IS 'Personalized WorldMonitor instances for each user';
COMMENT ON COLUMN user_instances.instance_config IS 'User preferences and configuration for this instance';

-- ============================================
-- DOMAIN VERIFICATIONS
-- ============================================

CREATE TABLE domain_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES user_instances(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  verification_method VARCHAR(50) DEFAULT 'dns' CHECK (verification_method IN ('dns', 'http', 'email')),
  verification_token VARCHAR(255) NOT NULL,
  verification_record TEXT,
  dns_instructions JSONB DEFAULT '{
    "type": "CNAME",
    "name": "@",
    "value": "cname.worldmonitor.app",
    "ttl": 3600
  }'::jsonb,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  last_check_at TIMESTAMP,
  next_check_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_domain_verifications_instance_id ON domain_verifications(instance_id);
CREATE INDEX idx_domain_verifications_domain ON domain_verifications(domain);
CREATE INDEX idx_domain_verifications_verified ON domain_verifications(verified);
CREATE INDEX idx_domain_verifications_next_check_at ON domain_verifications(next_check_at) WHERE verified = false;

COMMENT ON TABLE domain_verifications IS 'Tracks custom domain ownership verification';
COMMENT ON COLUMN domain_verifications.verification_record IS 'Expected DNS TXT record or HTTP file content';

-- ============================================
-- RESERVED SUBDOMAINS
-- ============================================

CREATE TABLE reserved_subdomains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(255),
  reserved_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reserved_subdomains_subdomain ON reserved_subdomains(subdomain);

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
('store', 'system'),
('cdn', 'system'),
('static', 'system'),
('assets', 'system'),
('media', 'system'),
('files', 'system'),
('docs', 'system'),
('help', 'system'),
('support', 'system'),
('status', 'system'),
('billing', 'system'),
('account', 'system'),
('settings', 'system'),
('login', 'system'),
('signup', 'system'),
('register', 'system'),
('auth', 'system'),
('oauth', 'system'),
('sso', 'system'),
('test', 'system'),
('demo', 'system'),
('staging', 'system'),
('dev', 'system'),
('development', 'system'),
('production', 'system'),
('prod', 'system');

COMMENT ON TABLE reserved_subdomains IS 'List of subdomains that cannot be used by users';

-- ============================================
-- ONBOARDING ANALYTICS
-- ============================================

CREATE TABLE onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  step_number INTEGER,
  event_data JSONB,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_analytics_user_id ON onboarding_analytics(user_id);
CREATE INDEX idx_onboarding_analytics_session_id ON onboarding_analytics(session_id);
CREATE INDEX idx_onboarding_analytics_event_type ON onboarding_analytics(event_type);
CREATE INDEX idx_onboarding_analytics_created_at ON onboarding_analytics(created_at DESC);

COMMENT ON TABLE onboarding_analytics IS 'Tracks user behavior during onboarding for funnel analysis';

-- Common events to track:
-- 'onboarding_started', 'step_completed', 'step_abandoned', 'domain_selected', 
-- 'plan_selected', 'payment_initiated', 'payment_completed', 'onboarding_completed'

-- ============================================
-- BILLING HISTORY
-- ============================================

CREATE TABLE billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  invoice_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  status VARCHAR(50) CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'disputed')),
  payment_method VARCHAR(50),
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX idx_billing_history_status ON billing_history(status);
CREATE INDEX idx_billing_history_created_at ON billing_history(created_at DESC);

COMMENT ON TABLE billing_history IS 'Complete audit trail of all billing transactions';

-- ============================================
-- TEAM MEMBERS (Multi-user access)
-- ============================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES user_instances(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  permissions JSONB DEFAULT '["read"]'::jsonb,
  invited_by UUID REFERENCES users(id),
  invitation_email VARCHAR(255),
  invitation_token VARCHAR(255),
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_members_instance_id ON team_members(instance_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE UNIQUE INDEX idx_team_members_instance_user ON team_members(instance_id, user_id) WHERE status = 'active';

COMMENT ON TABLE team_members IS 'Allows multiple users to access a single instance (Pro/Enterprise feature)';

-- ============================================
-- INSTANCE CUSTOMIZATIONS
-- ============================================

CREATE TABLE instance_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES user_instances(id) ON DELETE CASCADE,
  customization_type VARCHAR(100) NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_instance_customizations_instance_id ON instance_customizations(instance_id);
CREATE INDEX idx_instance_customizations_type ON instance_customizations(customization_type);

COMMENT ON TABLE instance_customizations IS 'Stores white-label customizations (logo, colors, branding)';

-- Example customization types:
-- 'branding' - Logo, colors, fonts
-- 'layout' - Dashboard layout preferences
-- 'widgets' - Enabled/disabled widgets
-- 'integrations' - Third-party integrations

-- ============================================
-- DOMAIN ROUTING
-- ============================================

CREATE TABLE domain_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES user_instances(id) ON DELETE CASCADE,
  domain VARCHAR(255) UNIQUE NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  route_type VARCHAR(50) DEFAULT 'subdomain' CHECK (route_type IN ('subdomain', 'custom', 'alias')),
  ssl_enabled BOOLEAN DEFAULT true,
  redirect_to VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_domain_routes_instance_id ON domain_routes(instance_id);
CREATE INDEX idx_domain_routes_domain ON domain_routes(domain);

COMMENT ON TABLE domain_routes IS 'Maps domains to instances for routing';

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_onboarding_sessions_updated_at BEFORE UPDATE ON onboarding_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_instances_updated_at BEFORE UPDATE ON user_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instance_customizations_updated_at BEFORE UPDATE ON instance_customizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Active instances with user details
CREATE VIEW active_instances AS
SELECT 
  ui.id,
  ui.instance_name,
  ui.subdomain,
  ui.custom_domain,
  ui.domain_type,
  ui.deployment_url,
  u.email,
  u.full_name,
  u.plan_tier,
  ui.created_at,
  ui.last_accessed_at
FROM user_instances ui
JOIN users u ON ui.user_id = u.id
WHERE ui.status = 'active';

-- Onboarding funnel metrics
CREATE VIEW onboarding_funnel AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE event_type = 'onboarding_started') as started,
  COUNT(*) FILTER (WHERE event_type = 'step_completed' AND step_number = 1) as step1_completed,
  COUNT(*) FILTER (WHERE event_type = 'step_completed' AND step_number = 2) as step2_completed,
  COUNT(*) FILTER (WHERE event_type = 'step_completed' AND step_number = 3) as step3_completed,
  COUNT(*) FILTER (WHERE event_type = 'step_completed' AND step_number = 4) as step4_completed,
  COUNT(*) FILTER (WHERE event_type = 'onboarding_completed') as completed,
  COUNT(*) FILTER (WHERE event_type = 'payment_completed') as paid_conversions
FROM onboarding_analytics
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Domain verification status
CREATE VIEW domain_verification_status AS
SELECT 
  dv.id,
  dv.domain,
  ui.instance_name,
  u.email as owner_email,
  dv.verification_method,
  dv.verified,
  dv.attempts,
  dv.last_check_at,
  dv.error_message,
  dv.created_at
FROM domain_verifications dv
JOIN user_instances ui ON dv.instance_id = ui.id
JOIN users u ON ui.user_id = u.id
WHERE dv.verified = false
ORDER BY dv.created_at DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check subdomain availability
CREATE OR REPLACE FUNCTION check_subdomain_availability(subdomain_input VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if subdomain is reserved
  IF EXISTS (SELECT 1 FROM reserved_subdomains WHERE subdomain = LOWER(subdomain_input)) THEN
    RETURN false;
  END IF;
  
  -- Check if subdomain is already taken
  IF EXISTS (SELECT 1 FROM user_instances WHERE subdomain = LOWER(subdomain_input)) THEN
    RETURN false;
  END IF;
  
  -- Check format (3-30 chars, alphanumeric + hyphens)
  IF NOT (subdomain_input ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique subdomain suggestion
CREATE OR REPLACE FUNCTION suggest_subdomain(base_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  suggested VARCHAR;
  counter INTEGER := 1;
BEGIN
  suggested := LOWER(REGEXP_REPLACE(base_name, '[^a-z0-9]', '', 'g'));
  
  -- Ensure minimum length
  IF LENGTH(suggested) < 3 THEN
    suggested := suggested || 'monitor';
  END IF;
  
  -- Truncate if too long
  IF LENGTH(suggested) > 30 THEN
    suggested := SUBSTRING(suggested, 1, 30);
  END IF;
  
  -- Find available subdomain
  WHILE NOT check_subdomain_availability(suggested) LOOP
    suggested := SUBSTRING(LOWER(REGEXP_REPLACE(base_name, '[^a-z0-9]', '', 'g')), 1, 26) || counter;
    counter := counter + 1;
    
    -- Prevent infinite loop
    IF counter > 1000 THEN
      suggested := 'user' || FLOOR(RANDOM() * 1000000);
      EXIT;
    END IF;
  END LOOP;
  
  RETURN suggested;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired onboarding sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM onboarding_sessions
  WHERE expires_at < NOW() AND completed = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Sample onboarding session
INSERT INTO onboarding_sessions (user_id, session_token, current_step, step_data) VALUES
(
  (SELECT id FROM users LIMIT 1),
  'sample-session-token-' || gen_random_uuid(),
  2,
  '{
    "step1": {
      "email": "test@example.com",
      "full_name": "Test User",
      "auth_method": "email"
    },
    "step2": {
      "focus_areas": ["geopolitics", "finance"],
      "language": "en",
      "theme": "dark"
    }
  }'::jsonb
);

-- Sample user instance
INSERT INTO user_instances (user_id, instance_name, subdomain, domain_type, instance_config) VALUES
(
  (SELECT id FROM users LIMIT 1),
  'Test Monitor',
  'testuser',
  'subdomain',
  '{
    "theme": "dark",
    "language": "en",
    "timezone": "America/New_York",
    "map_view": "globe",
    "focus_areas": ["geopolitics", "finance"],
    "notifications": {
      "email": true,
      "frequency": "immediate",
      "breaking_news": true
    }
  }'::jsonb
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_user_instances_user_status ON user_instances(user_id, status);
CREATE INDEX idx_onboarding_analytics_user_event ON onboarding_analytics(user_id, event_type);
CREATE INDEX idx_billing_history_user_status ON billing_history(user_id, status);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION check_subdomain_availability IS 'Validates subdomain availability and format';
COMMENT ON FUNCTION suggest_subdomain IS 'Generates unique subdomain suggestion based on input';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Removes expired onboarding sessions (run via cron)';

-- ============================================
-- GRANTS (adjust as needed)
-- ============================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO worldmonitor_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO worldmonitor_app;
