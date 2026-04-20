#!/bin/bash

# FoodFox Complete Startup Script
# Runs API, ML Model, and Dashboard in parallel

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🦊 FoodFox Foods - Complete Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project Directory: $PROJECT_DIR"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Node.js is installed
print_step "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v18+"
    exit 1
fi
print_success "Node.js $(node --version) found"

# Check if MySQL is running
print_step "Checking MySQL connection..."
if mysql -u root -p8315 -e "SELECT 1" &> /dev/null; then
    print_success "MySQL connection successful"
else
    print_warning "MySQL may not be running. Make sure MySQL is started."
fi

# Install backend dependencies
print_step "Setting up Backend..."
cd "$PROJECT_DIR/foodfox-backend"
if [ ! -d "node_modules" ]; then
    print_step "Installing backend dependencies..."
    npm install --silent
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi

# Install frontend dependencies
print_step "Setting up Frontend..."
cd "$PROJECT_DIR/foodfox-dashboard"
if [ ! -d "node_modules" ]; then
    print_step "Installing frontend dependencies..."
    npm install --silent
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

# Verify .env files exist
print_step "Verifying configuration files..."
if [ ! -f "$PROJECT_DIR/foodfox-backend/.env" ]; then
    print_error "Backend .env file not found!"
    exit 1
fi
print_success "Backend .env found"

if [ ! -f "$PROJECT_DIR/foodfox-dashboard/.env.local" ]; then
    print_warning "Frontend .env.local not found. Creating default..."
    echo "VITE_API_URL=http://localhost:5000/api" > "$PROJECT_DIR/foodfox-dashboard/.env.local"
    print_success "Frontend .env.local created"
else
    print_success "Frontend .env.local found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🚀 Starting Services...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Backend
print_step "Starting Backend API Server..."
cd "$PROJECT_DIR/foodfox-backend"
npm start > /tmp/foodfox-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend Server started (PID: $BACKEND_PID)"
else
    print_error "Backend server failed to start. Check /tmp/foodfox-backend.log"
    cat /tmp/foodfox-backend.log
    exit 1
fi

# Start Frontend
print_step "Starting Frontend Development Server..."
cd "$PROJECT_DIR/foodfox-dashboard"
npm run dev > /tmp/foodfox-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend Server started (PID: $FRONTEND_PID)"
else
    print_error "Frontend server failed to start. Check /tmp/foodfox-frontend.log"
    cat /tmp/foodfox-frontend.log
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ All Services Running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📊 Dashboard:${NC}     http://localhost:5173"
echo -e "${BLUE}�� API Server:${NC}   http://localhost:5000"
echo -e "${BLUE}🗄️  Database:${NC}     localhost:3306/foodfox"
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo "  kill $BACKEND_PID  (Backend)"
echo "  kill $FRONTEND_PID (Frontend)"
echo ""
echo -e "${YELLOW}To stop all:${NC}"
echo "  pkill -f 'npm run dev'"
echo "  pkill -f 'npm start'"
echo ""

# Keep script running and monitor processes
print_step "Monitoring services..."
echo ""

cleanup() {
    print_warning "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    print_success "Services stopped"
    exit 0
}

trap cleanup EXIT INT TERM

while true; do
    if ! ps -p $BACKEND_PID > /dev/null; then
        print_error "Backend server crashed!"
        tail -10 /tmp/foodfox-backend.log
        exit 1
    fi
    
    if ! ps -p $FRONTEND_PID > /dev/null; then
        print_error "Frontend server crashed!"
        tail -10 /tmp/foodfox-frontend.log
        exit 1
    fi
    
    sleep 5
done
