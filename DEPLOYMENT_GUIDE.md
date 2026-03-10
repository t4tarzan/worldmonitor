# WorldMonitor Deployment Guide

## Quick Start Deployment to Vercel

### Prerequisites
- Vercel account
- Neon Postgres database
- Stripe account (for payments)
- Domain configured (worldmonitor.app)

### Step 1: Set Up Neon Postgres Database

1. **Create Neon Project**
   ```bash
   # Visit https://neon.tech and create a new project
   # Name: worldmonitor-production
   # Region: Choose closest to your users
   ```

2. **Run Database Schema**
   ```bash
   # Connect to your Neon database
   psql "postgresql://user:password@your-neon-db.neon.tech/worldmonitor?sslmode=require"
   
   # Run the schema
   \i database/schema.sql
   ```

3. **Get Connection String**
   ```
   Copy the connection string from Neon dashboard
   Format: postgresql://user:password@host/database?sslmode=require
   ```

### Step 2: Configure Vercel Project

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Project**
   ```bash
   cd /home/Ubuntu/worldmonitor/worldmonitor
   vercel link
   ```

4. **Set Environment Variables**
   ```bash
   # Database
   vercel env add DATABASE_URL production
   # Paste your Neon connection string
   
   # Authentication
   vercel env add NEXTAUTH_SECRET production
   # Generate with: openssl rand -base64 32
   
   vercel env add NEXTAUTH_URL production
   # Enter: https://worldmonitor.app
   
   # Stripe
   vercel env add STRIPE_SECRET_KEY production
   vercel env add STRIPE_PUBLISHABLE_KEY production
   vercel env add STRIPE_WEBHOOK_SECRET production
   
   # Redis (Upstash)
   vercel env add UPSTASH_REDIS_REST_URL production
   vercel env add UPSTASH_REDIS_REST_TOKEN production
   
   # Email
   vercel env add RESEND_API_KEY production
   vercel env add EMAIL_FROM production
   ```

### Step 3: Configure Stripe

1. **Create Products**
   - Go to Stripe Dashboard → Products
   - Create three products:
     - **Hobbyist**: $0/month (free tier)
     - **Professional**: $9.97/month
     - **Enterprise**: $29.97/month

2. **Set Up Webhooks**
   ```
   Webhook URL: https://worldmonitor.app/api/webhooks/stripe
   Events to listen for:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   ```

3. **Copy Webhook Secret**
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production
   # Paste the webhook signing secret from Stripe
   ```

### Step 4: Deploy to Vercel

1. **Deploy**
   ```bash
   vercel --prod
   ```

2. **Verify Deployment**
   - Visit https://worldmonitor.app
   - Check landing page loads
   - Test dashboard access
   - Verify database connection

### Step 5: Configure Custom Domains

1. **Add Domains in Vercel**
   ```
   Primary: worldmonitor.app
   Variants:
   - tech.worldmonitor.app
   - finance.worldmonitor.app
   - happy.worldmonitor.app
   ```

2. **DNS Configuration**
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: tech
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: finance
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: happy
   Value: cname.vercel-dns.com
   ```

### Step 6: Set Up Monitoring

1. **Vercel Analytics**
   - Enable in Vercel dashboard
   - Already configured in package.json

2. **Sentry (Optional)**
   ```bash
   vercel env add SENTRY_DSN production
   ```

3. **Uptime Monitoring**
   - Use Vercel's built-in monitoring
   - Or set up external service (UptimeRobot, Pingdom)

## Post-Deployment Checklist

- [ ] Database schema applied successfully
- [ ] Environment variables configured
- [ ] Stripe products created
- [ ] Webhook endpoints working
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] Landing page accessible
- [ ] Dashboard loads correctly
- [ ] Authentication working
- [ ] Email delivery configured
- [ ] Monitoring active

## Testing the Deployment

### 1. Test Landing Page
```bash
curl -I https://worldmonitor.app/landing.html
# Should return 200 OK
```

### 2. Test Dashboard
```bash
curl -I https://worldmonitor.app/
# Should return 200 OK
```

### 3. Test API Endpoints
```bash
# Health check
curl https://worldmonitor.app/api/health

# Database connection
curl https://worldmonitor.app/api/db/health
```

### 4. Test Authentication
- Visit https://worldmonitor.app/landing.html
- Click "Get Started"
- Create test account
- Verify email sent
- Complete registration

### 5. Test Stripe Integration
- Attempt to upgrade to Pro plan
- Complete checkout flow
- Verify webhook received
- Check subscription in database

## Troubleshooting

### Database Connection Issues
```bash
# Test connection locally
psql "$DATABASE_URL"

# Check Vercel logs
vercel logs --follow
```

### Build Failures
```bash
# Check build logs
vercel logs --build

# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies
```

### Stripe Webhook Issues
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

## Scaling Considerations

### Database
- Neon auto-scales compute
- Monitor connection pool usage
- Consider read replicas for high traffic

### Vercel
- Pro plan recommended for production
- Enable Edge Functions for API routes
- Use ISR for static pages

### Redis
- Upstash scales automatically
- Monitor memory usage
- Set appropriate TTLs

## Backup Strategy

### Database Backups
```bash
# Neon provides automatic backups
# Manual backup:
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql
```

### Configuration Backups
```bash
# Export environment variables
vercel env pull .env.production.backup
```

## Monitoring & Alerts

### Set Up Alerts
1. **Vercel Alerts**
   - Deployment failures
   - Function errors
   - High response times

2. **Database Alerts**
   - Connection pool exhaustion
   - Slow queries
   - Storage usage

3. **Stripe Alerts**
   - Failed payments
   - Webhook failures
   - Subscription cancellations

## Performance Optimization

### Edge Functions
```javascript
// Move API routes to edge runtime
export const config = {
  runtime: 'edge',
};
```

### Caching Strategy
- Static assets: 1 year
- API responses: 5-15 minutes
- User data: No cache
- Public data: 1 hour

### CDN Configuration
- Vercel automatically uses CDN
- Optimize images with next/image
- Use WebP format for images

## Security Checklist

- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] API key rotation policy
- [ ] Regular dependency updates
- [ ] Security headers (HSTS, X-Frame-Options, etc.)

## Maintenance

### Regular Tasks
- **Weekly**: Review error logs
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: Penetration testing

### Update Process
```bash
# 1. Test locally
npm run build
npm run test

# 2. Deploy to preview
vercel

# 3. Test preview deployment
# Visit preview URL and test

# 4. Deploy to production
vercel --prod
```

## Rollback Procedure

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## Support & Documentation

- **GitHub Issues**: https://github.com/t4tarzan/worldmonitor/issues
- **Documentation**: https://github.com/t4tarzan/worldmonitor/blob/main/README.md
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs

## Cost Estimation

### Monthly Costs (Estimated)
- **Vercel Pro**: $20/month
- **Neon Postgres**: $19-69/month (based on usage)
- **Upstash Redis**: $10-30/month
- **Resend Email**: $20/month (10k emails)
- **Stripe**: 2.9% + $0.30 per transaction
- **Total**: ~$70-150/month base + transaction fees

### Free Tier Limits
- Vercel Hobby: 100GB bandwidth, 100 hours compute
- Neon Free: 0.5GB storage, 1 compute unit
- Upstash Free: 10k commands/day
- Resend Free: 3k emails/month

## Next Steps

1. ✅ Complete deployment
2. Set up monitoring dashboards
3. Configure backup automation
4. Create runbook for common issues
5. Set up staging environment
6. Implement CI/CD pipeline
7. Plan marketing launch
8. Prepare customer support system
