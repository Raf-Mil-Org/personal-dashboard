# Health Tracker - Deployment Guide

This guide will help you deploy your health tracker application to production so you can use it in your daily life.

## 🚀 Quick Deployment Options

### Option 1: Railway (Recommended - Free Tier)

**Best for: Quick deployment, free tier, easy setup**

1. **Backend Deployment:**

    ```bash
    cd backend
    npm install -g @railway/cli
    railway login
    railway init
    # Set environment variables in Railway dashboard
    railway up
    ```

2. **Frontend Deployment:**
    ```bash
    # In the root directory
    npm install -g @railway/cli
    railway init
    # Set VITE_API_URL to your backend URL
    railway up
    ```

### Option 2: Render (Free Tier)

**Best for: Automatic deployments, free tier**

1. **Backend:**

    - Connect GitHub repo
    - Set build command: `npm install`
    - Set start command: `npm start`
    - Add environment variables

2. **Frontend:**
    - Connect GitHub repo
    - Set build command: `npm run build`
    - Set publish directory: `dist`
    - Add environment variables

### Option 3: Vercel + Railway

**Best for: Frontend on Vercel, Backend on Railway**

1. **Backend on Railway:**

    ```bash
    cd backend
    railway up
    ```

2. **Frontend on Vercel:**
    ```bash
    npm install -g vercel
    vercel
    # Set VITE_API_URL environment variable
    ```

## 📋 Prerequisites

### 1. Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create new cluster
4. Get connection string
5. Add to environment variables

### 2. Environment Variables

**Backend (.env):**

```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend (.env):**

```env
VITE_API_URL=https://your-backend-domain.com/api
```

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Your Code

1. **Update API URL in frontend:**

    ```javascript
    // src/composables/useHealthStore.js
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    ```

2. **Test locally:**

    ```bash
    # Terminal 1 - Backend
    cd backend
    npm install
    npm run dev

    # Terminal 2 - Frontend
    npm install
    npm run dev
    ```

### Step 2: Deploy Backend

#### Railway (Recommended)

```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway up
```

#### Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Set:
    - **Name:** health-tracker-backend
    - **Environment:** Node
    - **Build Command:** `npm install`
    - **Start Command:** `npm start`
5. Add environment variables
6. Deploy

### Step 3: Deploy Frontend

#### Vercel

```bash
npm install -g vercel
vercel
# Follow prompts
# Set VITE_API_URL environment variable
```

#### Railway

```bash
npm install -g @railway/cli
railway init
railway up
```

### Step 4: Configure Environment Variables

**Backend Variables:**

-   `NODE_ENV`: production
-   `MONGODB_URI`: Your MongoDB Atlas connection string
-   `JWT_SECRET`: Strong random string
-   `FRONTEND_URL`: Your frontend domain

**Frontend Variables:**

-   `VITE_API_URL`: Your backend API URL

### Step 5: Test Your Deployment

1. Visit your frontend URL
2. Register a new account
3. Test all features:
    - Water intake tracking
    - Toilet logs
    - Supplements
    - Medications
    - Sleep tracking
    - Workouts
    - Mood tracking

## 🔒 Security Checklist

-   [ ] Strong JWT secret (32+ characters)
-   [ ] MongoDB Atlas with network access configured
-   [ ] HTTPS enabled
-   [ ] Environment variables set
-   [ ] Rate limiting enabled
-   [ ] CORS configured properly

## 📱 Mobile Access

Your health tracker will work on mobile browsers. For better experience:

1. **Add to Home Screen:**

    - iOS: Safari → Share → Add to Home Screen
    - Android: Chrome → Menu → Add to Home Screen

2. **PWA Features:**
    - Works offline (with cached data)
    - Push notifications (future enhancement)
    - App-like experience

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
    push:
        branches: [main]
jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2
            - name: Deploy to Railway
              run: |
                  npm install -g @railway/cli
                  railway up
```

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors:**

    - Check `FRONTEND_URL` in backend environment
    - Ensure frontend URL is correct

2. **Database Connection:**

    - Verify MongoDB Atlas connection string
    - Check network access settings

3. **Authentication Issues:**

    - Verify JWT_SECRET is set
    - Check token expiration

4. **Build Failures:**
    - Check Node.js version compatibility
    - Verify all dependencies are installed

### Support:

-   Check deployment platform logs
-   Verify environment variables
-   Test API endpoints with Postman
-   Check browser console for errors

## 📊 Monitoring

### Health Checks:

-   Backend: `https://your-backend.com/api/status`
-   Frontend: Check if app loads and auth works

### Logs:

-   Railway: `railway logs`
-   Render: Dashboard → Logs
-   Vercel: Dashboard → Functions → Logs

## 🎉 You're Ready!

Your health tracker is now deployed and ready for daily use. You can:

-   Track water intake
-   Log toilet visits with details
-   Manage supplements and medications
-   Record sleep patterns
-   Log workouts
-   Track mood and energy
-   View historical data
-   Access from any device

**Happy health tracking! 🏃‍♂️💧💊😴**
