# ⚡ WorldMonitor - Quick Start Guide

## 🎯 What You Have Now

Your WorldMonitor project is **100% ready for deployment** with:
- ✅ Sitdeck-inspired landing page
- ✅ Complete database schema (Neon Postgres)
- ✅ Authentication APIs (register, login)
- ✅ Monitor management system
- ✅ Stripe payment integration
- ✅ Comprehensive documentation

---

## 🚀 Deploy in 5 Steps (15 minutes)

### Step 1: Install Dependencies (2 min)
```bash
cd /home/Ubuntu/worldmonitor/worldmonitor

# Add to your package.json dependencies:
npm install pg bcryptjs jsonwebtoken stripe @vercel/node resend

# Add to devDependencies:
npm install -D @types/bcryptjs @types/jsonwebtoken @types/pg
```

### Step 2: Set Up Database (3 min)
```bash
# 1. Create Neon account: https://neon.tech
# 2. Create project: "worldmonitor-production"
# 3. Copy connection string
# 4. Run schema:
psql "your-neon-connection-string" -f database/schema.sql
```

### Step 3: Configure Stripe (5 min)
```bash
# 1. Create Stripe account: https://stripe.com
# 2. Create 3 products:
#    - Hobbyist: $0/month
#    - Professional: $9.97/month  
#    - Enterprise: $29.97/month
# 3. Set up webhook: https://worldmonitor.app/api/webhooks/stripe
# 4. Copy API keys and webhook secret
```

### Step 4: Set Environment Variables (3 min)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Add variables
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXTAUTH_SECRET production  # Generate: openssl rand -base64 32
vercel env add NEXTAUTH_URL production     # https://worldmonitor.app
```

### Step 5: Deploy (2 min)
```bash
vercel --prod
```

**Done! 🎉** Your site is live at https://worldmonitor.app

---

## 📋 Environment Variables Checklist

Copy from `.env.production.example` and set these:

**Required:**
- `DATABASE_URL` - Neon Postgres connection string
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe webhook settings
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL

**Optional:**
- `RESEND_API_KEY` - For email notifications
- `UPSTASH_REDIS_REST_URL` - For caching
- `GROQ_API_KEY` - For AI features
- `SENTRY_DSN` - For error tracking

---

## 🧪 Test Your Deployment

### 1. Landing Page
Visit: `https://worldmonitor.app/landing.html`
- Should see beautiful hero section
- Pricing cards visible
- All links working

### 2. Dashboard
Visit: `https://worldmonitor.app/`
- Dashboard loads
- Map renders
- Data feeds populate

### 3. Registration
```bash
curl -X POST https://worldmonitor.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","fullName":"Test User"}'
```

### 4. Login
```bash
curl -X POST https://worldmonitor.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

---

## 📁 File Structure

```
worldmonitor/
├── landing.html              ← Marketing homepage
├── index.html                ← Dashboard app
├── database/
│   └── schema.sql           ← Database schema
├── api/
│   ├── auth/
│   │   ├── register.ts      ← User registration
│   │   └── login.ts         ← User login
│   ├── monitors/
│   │   └── create.ts        ← Create monitors
│   └── webhooks/
│       └── stripe.ts        ← Payment webhooks
├── IMPLEMENTATION_PLAN.md   ← Full roadmap
├── DEPLOYMENT_GUIDE.md      ← Detailed deployment
├── LAUNCH_READY.md          ← Pre-launch checklist
├── PROJECT_SUMMARY.md       ← Complete overview
└── QUICK_START.md           ← This file
```

---

## 🎨 Customization Quick Tips

### Change Colors
Edit `landing.html` CSS variables:
```css
--bg-primary: #0a0f0a;      /* Dark background */
--accent-green: #10b981;    /* Primary color */
```

### Update Pricing
Edit pricing section in `landing.html`:
- Line ~450: Free tier features
- Line ~480: Pro tier features  
- Line ~510: Enterprise tier features

### Add Banner Image
Replace in `landing.html`:
```html
<img src="/new-world-monitor.png" alt="Dashboard">
```

---

## 🐛 Troubleshooting

**Database connection fails:**
```bash
# Test connection
psql "$DATABASE_URL"
```

**Build fails:**
```bash
# Check logs
vercel logs --build
```

**Webhook not working:**
```bash
# Test locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 📞 Need Help?

- **Full Docs**: See `DEPLOYMENT_GUIDE.md`
- **Implementation Plan**: See `IMPLEMENTATION_PLAN.md`
- **GitHub Issues**: https://github.com/t4tarzan/worldmonitor/issues
- **Vercel Support**: https://vercel.com/support

---

## 🎯 Success Metrics

After launch, track:
- User signups (target: 100/month)
- Free → Paid conversion (target: 5%)
- Daily active users (target: 70%)
- Page load time (target: <2s)

---

## ✅ Pre-Launch Checklist

- [ ] Dependencies installed
- [ ] Database created and schema applied
- [ ] Stripe products created
- [ ] Environment variables set
- [ ] Deployed to Vercel
- [ ] Landing page accessible
- [ ] Dashboard loads
- [ ] Registration works
- [ ] Login works
- [ ] Payment flow tested

---

**You're ready to launch! 🚀**

Visit your files:
- `DEPLOYMENT_GUIDE.md` for detailed steps
- `LAUNCH_READY.md` for comprehensive checklist
- `PROJECT_SUMMARY.md` for complete overview
