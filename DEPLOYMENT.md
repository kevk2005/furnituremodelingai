# Deployment Guide

## Deploy to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `kevk2005/furnituremodelingai`
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click "Deploy"

### Option 2: Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd "c:\Users\kevin\AI furniture"
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory to ./frontend
# - Accept detected settings
```

### Environment Variables (Add in Vercel Dashboard)

When you add AI backend later:
- `VITE_API_URL` - Backend API endpoint
- `VITE_REPLICATE_TOKEN` - If using Replicate API directly from frontend

### Custom Domain (Optional)

After deployment:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Automatic Deployments

- Every push to `main` branch triggers production deployment
- Pull requests create preview deployments
- View deployments at: https://vercel.com/kevk2005/furnituremodelingai

---

**Note**: Current version is browser-only MVP. Backend AI integration will be added separately (can use Vercel Serverless Functions or external API).
