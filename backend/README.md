# Health Tracker Backend API

A Node.js/Express backend for the personal health tracking application with MongoDB database and JWT authentication.

## Features

-   **User Authentication**: Register, login, and profile management
-   **Health Data Management**: CRUD operations for daily health entries
-   **Data Analytics**: Statistics and date range queries
-   **Security**: JWT tokens, password hashing, rate limiting
-   **Scalable**: MongoDB with proper indexing

## Quick Start

### Prerequisites

-   Node.js (v16 or higher)
-   MongoDB (local or Atlas)
-   npm or yarn

### Installation

1. **Clone and install dependencies:**

    ```bash
    cd backend
    npm install
    ```

2. **Set up environment variables:**

    ```bash
    cp env.example .env
    # Edit .env with your configuration
    ```

3. **Start MongoDB:**

    ```bash
    # Local MongoDB
    mongod

    # Or use MongoDB Atlas (update MONGODB_URI in .env)
    ```

4. **Run the server:**

    ```bash
    # Development
    npm run dev

    # Production
    npm start
    ```

## API Endpoints

### Authentication

-   `POST /api/auth/register` - Register new user
-   `POST /api/auth/login` - Login user
-   `GET /api/auth/me` - Get current user profile
-   `PUT /api/auth/me` - Update user profile
-   `PUT /api/auth/password` - Change password

### Health Data

-   `GET /api/health/:date` - Get health entry for specific date
-   `POST /api/health` - Create/update health entry
-   `GET /api/health/range/:startDate/:endDate` - Get entries for date range
-   `GET /api/health/stats/:startDate/:endDate` - Get statistics
-   `DELETE /api/health/:date` - Delete health entry

## Environment Variables

| Variable       | Description               | Default                        |
| -------------- | ------------------------- | ------------------------------ |
| `PORT`         | Server port               | 8000                           |
| `NODE_ENV`     | Environment               | development                    |
| `MONGODB_URI`  | MongoDB connection string | localhost:27017/health-tracker |
| `JWT_SECRET`   | JWT signing secret        | your-secret-key                |
| `FRONTEND_URL` | Frontend URL for CORS     | http://localhost:3000          |

## Deployment Options

### 1. Railway (Recommended - Free)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 2. Render

-   Connect your GitHub repo
-   Set environment variables
-   Deploy automatically

### 3. Heroku

```bash
# Install Heroku CLI
heroku create your-health-tracker
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set JWT_SECRET=your-secret-key
git push heroku main
```

### 4. DigitalOcean App Platform

-   Connect GitHub repository
-   Set environment variables
-   Automatic deployments

## Database Setup

### MongoDB Atlas (Recommended for production)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables

### Local MongoDB

```bash
# Install MongoDB
brew install mongodb-community  # macOS
sudo apt install mongodb       # Ubuntu

# Start MongoDB
mongod
```

## Security Features

-   **JWT Authentication**: Secure token-based auth
-   **Password Hashing**: bcrypt for password security
-   **Rate Limiting**: Prevent abuse
-   **CORS Protection**: Configured for frontend
-   **Input Validation**: Express-validator middleware
-   **Helmet**: Security headers

## Development

### Running Tests

```bash
npm test
```

### API Testing

Use tools like Postman or curl:

```bash
# Test health endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/health/2024-01-15
```

## Production Checklist

-   [ ] Set `NODE_ENV=production`
-   [ ] Use strong `JWT_SECRET`
-   [ ] Configure MongoDB Atlas
-   [ ] Set up proper CORS origins
-   [ ] Enable rate limiting
-   [ ] Set up monitoring/logging
-   [ ] Configure SSL/HTTPS
-   [ ] Set up backups

## Support

For issues and questions:

1. Check the logs
2. Verify environment variables
3. Test database connection
4. Check API endpoints with Postman
