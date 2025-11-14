#!/bin/bash

# scripts/test-local.sh
# Local E2E testing script for Mixtape
# Runs Playwright tests against local development servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Mixtape Local E2E Test Runner                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if backend server is running
BACKEND_URL="http://127.0.0.1:8010"
FRONTEND_URL="http://127.0.0.1:3010"
BACKEND_PATH="../mixtape-release-core/app"

echo -e "${YELLOW}🔍 Checking servers...${NC}"

# Check backend
if curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health/" | grep -q "200"; then
    echo -e "${GREEN}✓ Backend server is running at ${BACKEND_URL}${NC}"
else
    echo -e "${RED}✗ Backend server is NOT running at ${BACKEND_URL}${NC}"
    echo -e "${YELLOW}  Start it with:${NC}"
    echo -e "  cd ../mixtape-release-core"
    echo -e "  source ../env/bin/activate"
    echo -e "  python manage.py runserver 127.0.0.1:8010"
    exit 1
fi

# Check frontend
if curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" | grep -q "200"; then
    echo -e "${GREEN}✓ Frontend server is running at ${FRONTEND_URL}${NC}"
else
    echo -e "${RED}✗ Frontend server is NOT running at ${FRONTEND_URL}${NC}"
    echo -e "${YELLOW}  Start it with:${NC}"
    echo -e "  yarn dev"
    exit 1
fi

echo ""
echo -e "${YELLOW}👥 Checking test users...${NC}"

# Check if test users exist by trying to authenticate
TEST_USER_CHECK=$(curl -s -X POST "${BACKEND_URL}/api/auth/token/" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mixtape.com","password":"testpassword123"}' \
  2>/dev/null)

if echo "$TEST_USER_CHECK" | grep -q "access"; then
    echo -e "${GREEN}✓ Test users exist${NC}"
else
    echo -e "${RED}✗ Test users not found${NC}"
    echo -e "${YELLOW}  Creating test users...${NC}"

    # Try to create test users
    if [ -d "$BACKEND_PATH" ]; then
        cd "$BACKEND_PATH"
        if [ -f "../env/bin/python" ]; then
            ../env/bin/python manage.py create_test_users
            cd - > /dev/null
            echo -e "${GREEN}✓ Test users created${NC}"
        else
            echo -e "${RED}✗ Virtual environment not found${NC}"
            echo -e "${YELLOW}  Run manually:${NC}"
            echo -e "  cd $BACKEND_PATH"
            echo -e "  source ../env/bin/activate"
            echo -e "  python manage.py create_test_users"
            exit 1
        fi
    else
        echo -e "${RED}✗ Backend directory not found${NC}"
        echo -e "${YELLOW}  Run manually:${NC}"
        echo -e "  cd ../mixtape-release-core/app"
        echo -e "  python manage.py create_test_users"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}📦 Checking Playwright installation...${NC}"

# Check if Playwright is installed
if ! command -v npx playwright &> /dev/null; then
    echo -e "${RED}✗ Playwright is not installed${NC}"
    echo -e "${YELLOW}  Installing Playwright...${NC}"
    yarn add -D @playwright/test
    npx playwright install
else
    echo -e "${GREEN}✓ Playwright is installed${NC}"
fi

echo ""
echo -e "${YELLOW}🧪 Running tests...${NC}"
echo ""

# Set backend URL environment variable
export BACKEND_URL="${BACKEND_URL}"

# Parse arguments for test mode
TEST_MODE="${1:-all}"

case "$TEST_MODE" in
  "ui")
    echo -e "${BLUE}Running tests in UI mode...${NC}"
    npx playwright test --ui
    ;;
  "headed")
    echo -e "${BLUE}Running tests in headed mode...${NC}"
    npx playwright test --headed
    ;;
  "debug")
    echo -e "${BLUE}Running tests in debug mode...${NC}"
    npx playwright test --debug
    ;;
  "auth")
    echo -e "${BLUE}Running auth tests only...${NC}"
    npx playwright test tests/auth/
    ;;
  "invite")
    echo -e "${BLUE}Running invite flow tests only...${NC}"
    npx playwright test tests/invite-flows/
    ;;
  *)
    echo -e "${BLUE}Running all tests in headless mode...${NC}"
    npx playwright test
    ;;
esac

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ All tests passed!                                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📊 View test report:${NC} yarn test:report"
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Some tests failed                                      ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📊 View test report:${NC} yarn test:report"
    echo -e "${YELLOW}🔍 Debug failed tests:${NC} yarn test:debug"
    exit 1
fi
