#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Mobile Network Coverage Application...${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are installed${NC}"

# Check MongoDB
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB is not running. Attempting to start...${NC}"
    if command_exists brew; then
        brew services start mongodb-community 2>/dev/null || {
            echo -e "${YELLOW}Starting MongoDB manually...${NC}"
            mongod --fork --logpath /tmp/mongod.log 2>/dev/null || {
                echo -e "${RED}❌ Could not start MongoDB. Please start it manually.${NC}"
                echo "Try: brew services start mongodb-community"
                exit 1
            }
        }
        sleep 3
    else
        echo -e "${RED}❌ MongoDB is not running. Please start it manually.${NC}"
        echo "Try: sudo systemctl start mongod (Linux) or start MongoDB service (Windows)"
        exit 1
    fi
fi

echo -e "${GREEN}✅ MongoDB is running${NC}"

# Create .env files if they don't exist
if [ ! -f "Backend/.env" ]; then
    echo -e "${YELLOW}📝 Creating Backend .env file...${NC}"
    cat > Backend/.env << 'EOL'
MONGODB_URI=mongodb://localhost:27017/mobile_network_coverage
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:2222
EOL
    echo -e "${GREEN}✅ Backend .env created${NC}"
fi

if [ ! -f "Frontend/.env" ]; then
    echo -e "${YELLOW}📝 Creating Frontend .env file...${NC}"
    cat > Frontend/.env << 'EOL'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
EOL
    echo -e "${GREEN}✅ Frontend .env created${NC}"
fi

# Install backend dependencies if needed
if [ ! -d "Backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Backend dependencies...${NC}"
    cd Backend
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
fi

# Install frontend dependencies if needed
if [ ! -d "Frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Frontend dependencies...${NC}"
    cd Frontend
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

# Seed database (only if needed - check if towers exist)
echo -e "${YELLOW}🌱 Checking database...${NC}"
cd Backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
const Tower = require('./app/models/Tower');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_network_coverage')
  .then(async () => {
    const count = await Tower.countDocuments();
    if (count === 0) {
      console.log('Database is empty, seeding...');
      require('child_process').exec('npm run seed', (error) => {
        if (error) {
          console.error('Seeding failed:', error);
          process.exit(1);
        }
        process.exit(0);
      });
    } else {
      console.log('Database already has data');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Database check failed:', err);
    process.exit(1);
  });
" 2>&1 | grep -v "DeprecationWarning" || true
cd ..

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Start backend server
echo -e "${YELLOW}📡 Starting Backend server...${NC}"
cd Backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend server failed to start${NC}"
    echo "Check /tmp/backend.log for errors"
    cat /tmp/backend.log
    exit 1
fi

# Check and clear port 5000 if needed (but backend is starting)
if lsof -ti:5000 >/dev/null 2>&1 && ! lsof -ti:5000 | grep -q $BACKEND_PID; then
    echo -e "${YELLOW}⚠️  Port 5000 is in use by another process. Clearing it...${NC}"
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    sleep 2
    # Restart backend
    cd Backend
    npm run dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    sleep 3
fi

# Check if backend is listening on port 5000
for i in {1..10}; do
    if lsof -i :5000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend server is running on http://localhost:5000${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Backend server is not responding on port 5000${NC}"
        cat /tmp/backend.log
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Check and clear port 2222 if needed
if lsof -ti:2222 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 2222 is in use. Clearing it...${NC}"
    lsof -ti:2222 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Start frontend server
echo -e "${YELLOW}🌐 Starting Frontend server...${NC}"
cd Frontend
BROWSER=none npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 10

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend server failed to start${NC}"
    echo "Check /tmp/frontend.log for errors"
    cat /tmp/frontend.log | tail -20
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Check if frontend is listening on port 2222
for i in {1..15}; do
    if lsof -i :2222 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend server is running on http://localhost:2222${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${YELLOW}⚠️  Frontend server may still be starting...${NC}"
        echo "Check /tmp/frontend.log for details"
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Application is running successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📡 Backend API:  ${GREEN}http://localhost:5001/api${NC}"
echo -e "🌐 Frontend App:  ${GREEN}http://localhost:2222${NC}"
echo -e "❤️  Health Check: ${GREEN}http://localhost:5001/health${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Open browser (optional)
if command_exists open; then
    sleep 2
    open http://localhost:2222 2>/dev/null || true
fi

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID

