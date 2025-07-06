#!/bin/bash

echo "🏥 Health Tracker Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm version: $(npm --version)"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    print_status "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning "No .env file found in backend directory"
    echo "Creating .env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        print_status "Created .env file from example"
        print_warning "Please update .env with your actual values"
    else
        print_error "No env.example file found"
    fi
fi

cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
if npm install; then
    print_status "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Check if .env file exists in frontend
if [ ! -f .env ]; then
    print_warning "No .env file found in frontend directory"
    echo "Creating .env file..."
    echo "VITE_API_URL=http://localhost:8000/api" > .env
    print_status "Created .env file with default API URL"
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo ""
echo "1. Set up MongoDB Atlas:"
echo "   - Go to https://www.mongodb.com/atlas"
echo "   - Create a free account and cluster"
echo "   - Get your connection string"
echo ""
echo "2. Configure environment variables:"
echo "   - Backend: Update backend/.env with your MongoDB URI and JWT secret"
echo "   - Frontend: Update .env with your backend API URL"
echo ""
echo "3. Test locally:"
echo "   - Terminal 1: cd backend && npm run dev"
echo "   - Terminal 2: npm run dev"
echo ""
echo "4. Deploy to production:"
echo "   - Backend: Use Railway, Render, or Heroku"
echo "   - Frontend: Use Vercel, Railway, or Netlify"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
print_status "Setup complete! 🎉" 