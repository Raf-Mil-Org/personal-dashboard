# 🚀 Deployment Guide

## Quick Setup

1. **Run the setup script:**

    ```bash
    ./setup-backend.sh
    ```

2. **Start the backend:**

    ```bash
    cd backend
    npm run dev
    ```

3. **Start the frontend:**
    ```bash
    npm run dev
    ```

## 🎯 Deployment Options

### Option 1: Railway (Recommended - Free)

**Pros:** Easy setup, free tier, MongoDB included, automatic deployments

1. **Install Railway CLI:**

    ```bash
    npm install -g @railway/cli
    ```

2. **Login and deploy:**

    ```bash
    railway login
    railway init
    railway up
    ```

3. **Add MongoDB:**

    - Go to Railway dashboard
    - Add MongoDB plugin
    - Copy connection string to environment variables

4. **Update frontend API URL:**
    - Get your Railway URL from dashboard
    - Update `API_BASE_URL` in `src/composables/useHealthStore.js`

### Option 2: Render (Free)

**Pros:** Free tier, built-in MongoDB, simple deployment

1. **Connect GitHub repository**
2. **Create new Web Service**
3. **Configure:**
    - Build Command: `cd backend && npm install`
    - Start Command: `cd backend && npm start`
    - Environment Variables:
        ```
        NODE_ENV=production
        MONGODB_URI=your-mongodb-uri
        CORS_ORIGIN=your-frontend-url
        ```

### Option 3: Vercel (Free)

**Pros:** Great for frontend + API, serverless functions

1. **Install Vercel CLI:**

    ```bash
    npm install -g vercel
    ```

2. **Deploy:**

    ```bash
    vercel
    ```

3. **Configure environment variables in Vercel dashboard**

### Option 4: Heroku (Paid)

**Pros:** Mature platform, good documentation

1. **Install Heroku CLI:**

    ```bash
    # macOS
    brew install heroku/brew/heroku
    ```

2. **Deploy:**
    ```bash
    heroku create your-health-dashboard
    heroku config:set NODE_ENV=production
    heroku config:set MONGODB_URI=your-mongodb-atlas-uri
    git push heroku main
    ```

## 🗄️ MongoDB Setup

### MongoDB Atlas (Recommended for production)

1. **Create account:** [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create cluster** (free tier available)
3. **Get connection string**
4. **Update environment variables**

### Local MongoDB (Development)

```bash
# macOS
brew services start mongodb/brew/mongodb-community

# Ubuntu
sudo systemctl start mongod
```

## 🔧 Environment Variables

| Variable      | Description        | Example                     |
| ------------- | ------------------ | --------------------------- |
| `PORT`        | Server port        | 3001                        |
| `NODE_ENV`    | Environment        | production                  |
| `MONGODB_URI` | MongoDB connection | mongodb+srv://...           |
| `CORS_ORIGIN` | Frontend URL       | https://your-app.vercel.app |

## 📊 Production Checklist

-   [ ] Set `NODE_ENV=production`
-   [ ] Configure MongoDB Atlas
-   [ ] Set up proper CORS origins
-   [ ] Update frontend API URL
-   [ ] Test all endpoints
-   [ ] Set up monitoring (optional)
-   [ ] Configure SSL/HTTPS
-   [ ] Set up backups (MongoDB Atlas)

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors:**

    - Update `CORS_ORIGIN` to match your frontend URL
    - Include protocol (http:// or https://)

2. **MongoDB Connection:**

    - Check connection string format
    - Ensure IP whitelist includes your server
    - Verify username/password

3. **Port Issues:**
    - Use `process.env.PORT` for production
    - Check if port is already in use

### Testing API

```bash
# Test status endpoint
curl https://your-backend-url.com/api/status

# Test health data endpoint
curl https://your-backend-url.com/api/health/2024-01-15
```

## 📈 Scaling Considerations

-   **Database:** MongoDB Atlas scales automatically
-   **Server:** Railway/Render handle scaling
-   **Caching:** Consider Redis for high traffic
-   **CDN:** Use Cloudflare for static assets
