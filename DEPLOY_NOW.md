# 🚀 Deploy WorldMonitor to Vercel - Quick Guide

## What's Ready

✅ **Landing Page** with onboarding flow
✅ **Screenshot Gallery** (fast loading)
✅ **Loading Progress Bar** for dashboard launch
✅ **5-Step Onboarding Modal** (demo mode)
✅ **Mock API Endpoints** for testing
✅ **Main Dashboard** (already working)

## Deploy in 3 Steps

### 1. Push to GitHub

```bash
cd /home/Ubuntu/worldmonitor/worldmonitor
git add .
git commit -m "Add onboarding flow, optimized landing page, and loading progress bar"
git push origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your GitHub repository: `worldmonitor`
4. Vercel will auto-detect Vite
5. Click **"Deploy"**

### 3. Configure Domain (Optional)

- Vercel gives you: `your-project.vercel.app`
- Add custom domain in Vercel dashboard → Settings → Domains

## What Works Immediately

- ✅ Landing page at `/landing.html`
- ✅ Main dashboard at `/` or `/index.html`
- ✅ Screenshot gallery
- ✅ Loading progress bar
- ✅ Onboarding modal (demo mode)

## What Needs Setup Later

For full production onboarding (after initial deployment):

1. **Database** - Neon Postgres (see `database/onboarding_schema.sql`)
2. **Stripe** - Payment processing (see `ONBOARDING_FLOW_PLAN.md`)
3. **Email** - Resend or similar (see `.env.production.example`)
4. **DNS Management** - For custom subdomains

## Environment Variables (Optional for Now)

The app works without these, but for full production:

```bash
# Add in Vercel Dashboard → Settings → Environment Variables
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
RESEND_API_KEY=re_...
```

## Build Settings (Auto-detected by Vercel)

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## After Deployment

1. Visit `https://your-project.vercel.app/landing.html`
2. Test the onboarding flow (demo mode)
3. Test the dashboard launch with progress bar
4. Share with users!

## Next Steps (Post-Launch Development)

1. Set up Neon Postgres database
2. Configure Stripe for real payments
3. Implement real API endpoints (replace mocks in `api/onboarding/`)
4. Set up email service
5. Configure DNS for custom subdomains
6. Add analytics (Vercel Analytics already included)

---

**Ready to deploy!** Just run the git commands above and import to Vercel.
