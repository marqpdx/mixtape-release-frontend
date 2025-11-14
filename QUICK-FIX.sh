#!/bin/bash
# Quick fix script for E2E test setup

echo "🔧 Setting up E2E test environment..."
echo ""

# Step 1: Create test users
echo "👥 Creating test users..."
cd ../mixtape-release-core/app
if [ -f "../env/bin/python" ]; then
    ../env/bin/python manage.py create_test_users
    echo ""
else
    echo "❌ Virtual environment not found at ../env/bin/python"
    echo "Run manually: cd ../mixtape-release-core/app && source ../env/bin/activate && python manage.py create_test_users"
    exit 1
fi

# Step 2: Verify health endpoint
echo "🏥 Verifying health endpoint..."
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8010/health/)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health endpoint working: $HEALTH_RESPONSE"
else
    echo "❌ Health endpoint not working. Is Django running on 127.0.0.1:8010?"
    exit 1
fi
echo ""

# Step 3: Verify test user login
echo "🔐 Verifying test user login..."
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8010/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mixtape.com","password":"testpassword123"}')

if echo "$LOGIN_RESPONSE" | grep -q "access"; then
    echo "✅ Test user login works!"
else
    echo "❌ Test user login failed!"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Step 4: Install Playwright if needed
echo "🎭 Checking Playwright..."
cd ../mixtape-release-frontend
if ! npx playwright --version > /dev/null 2>&1; then
    echo "📦 Installing Playwright..."
    npx playwright install
else
    echo "✅ Playwright already installed"
fi
echo ""

echo "╔════════════════════════════════════════════════╗"
echo "║  ✅ E2E Test Environment Ready!                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Now run: yarn test:local"
echo ""
