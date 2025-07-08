# Health Dashboard Backend

A simple Node.js + Express.js backend with MongoDB for the Health Dashboard application.

## 🚀 Quick Start

### Prerequisites

-   Node.js (v16 or higher)
-   MongoDB (running locally or cloud instance)

### Installation

1. **Install dependencies:**

    ```bash
    cd backend
    npm install
    ```

2. **Set up MongoDB:**

    - **Local MongoDB:** Make sure MongoDB is running on your machine
    - **MongoDB Atlas:** Update `config.env` with your connection string

3. **Configure environment:**

    ```bash
    # Edit config.env file
    PORT=3001
    MONGODB_URI=mongodb://localhost:27017/health-dashboard
    CORS_ORIGIN=http://localhost:5174
    ```

4. **Start the server:**

    ```bash
    # Development mode (with auto-restart)
    npm run dev

    # Production mode
    npm start
    ```

## 📊 API Endpoints

### Health Data

-   `GET /api/health/:date` - Get health data for specific date
-   `PUT /api/health/:date` - Update health data for specific date
-   `GET /api/health` - Get all health data (with pagination)
-   `DELETE /api/health/:date` - Delete health data for specific date
-   `GET /api/health/stats/date-range` - Get date range statistics

### Status

-   `GET /api/status` - Health check endpoint

## 🗄️ Database Schema

The `HealthData` model includes:

-   **Date tracking** (YYYY-MM-DD format)
-   **Water intake** (number of glasses)
-   **Vitamins & Supplements** (array of strings)
-   **Medications** (array of strings)
-   **Toilet logs** (pee/poop with details)
-   **Sleep data** (hours, quality, notes)
-   **Workouts** (type, duration, intensity, notes)
-   **Mood tracking** (terrible to excellent)
-   **General notes**

## 🔧 Development

### Local MongoDB Setup

1. **Install MongoDB Community Edition:**

    ```bash
    # macOS (using Homebrew)
    brew tap mongodb/brew
    brew install mongodb-community

    # Start MongoDB service
    brew services start mongodb/brew/mongodb-community
    ```

2. **Verify MongoDB is running:**

    ```bash
    mongosh
    # or
    mongo
    ```

3. **Create database:**
    ```bash
    use health-dashboard
    ```

### Environment Variables

| Variable      | Description               | Default                                    |
| ------------- | ------------------------- | ------------------------------------------ |
| `PORT`        | Server port               | 3001                                       |
| `NODE_ENV`    | Environment               | development                                |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/health-dashboard |
| `CORS_ORIGIN` | Frontend URL for CORS     | http://localhost:5174                      |

## 🚀 Deployment Options

### 1. Railway (Recommended)

-   Free tier available
-   Easy MongoDB integration
-   Automatic deployments

### 2. Render

-   Free tier available
-   Built-in MongoDB support
-   Simple deployment process

### 3. Vercel

-   Free tier available
-   Great for frontend + API
-   Serverless functions

### 4. Heroku

-   Free tier discontinued
-   Easy deployment
-   Add-on for MongoDB

## 📝 Example API Usage

```javascript
// Get today's health data
fetch('http://localhost:3001/api/health/2024-01-15')
    .then((res) => res.json())
    .then((data) => console.log(data));

// Update water intake
fetch('http://localhost:3001/api/health/2024-01-15', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ waterIntake: 8 })
})
    .then((res) => res.json())
    .then((data) => console.log(data));
```

## 🔍 Troubleshooting

### MongoDB Connection Issues

-   Ensure MongoDB is running: `brew services list | grep mongodb`
-   Check connection string in `config.env`
-   Verify database exists: `mongosh --eval "use health-dashboard"`

### CORS Issues

-   Update `CORS_ORIGIN` in `config.env` to match your frontend URL
-   Ensure frontend is running on the correct port

### Port Conflicts

-   Change `PORT` in `config.env` if 3001 is already in use
-   Update frontend API calls accordingly
