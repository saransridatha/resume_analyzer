#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting AI Resume Analyzer & ATS Scoring Platform...${NC}"

# Kill any existing processes on port 5000 and 5173 to avoid conflicts
fuser -k 5000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

echo -e "${GREEN}Installing Backend Dependencies...${NC}"
cd backend
npm install
echo -e "${GREEN}Starting Backend Server...${NC}"
# Use a default .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
fi
node index.js &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}Installing Frontend Dependencies...${NC}"
cd frontend
npm install
echo -e "${GREEN}Starting Frontend Server...${NC}"
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}Both servers are starting!${NC}"
echo "Backend PID: $BACKEND_PID (Port 5000)"
echo "Frontend PID: $FRONTEND_PID (Port 5173)"
echo "Press Ctrl+C to stop both servers."

# Wait for a few seconds to let them start
sleep 3
echo -e "${GREEN}Verifying processes are running...${NC}"
ps -p $BACKEND_PID > /dev/null && echo "Backend is RUNNING" || echo "Backend FAILED"
ps -p $FRONTEND_PID > /dev/null && echo "Frontend is RUNNING" || echo "Frontend FAILED"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
