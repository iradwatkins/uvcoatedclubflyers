#!/bin/bash

echo "================================================"
echo "Testing Order Management System"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test URLs
ADMIN_ORDERS="http://localhost:3000/admin/orders"
PRODUCTION_BOARD="http://localhost:3000/admin/production"

echo "📋 Checking if dev server is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
    echo -e "${GREEN}✓${NC} Dev server is running"
else
    echo -e "${RED}✗${NC} Dev server not running. Start with: npm run dev"
    exit 1
fi

echo ""
echo "🧪 Test 1: Admin Orders Page"
echo "URL: $ADMIN_ORDERS"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_ORDERS")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
    echo -e "${GREEN}✓${NC} Admin orders page accessible (Status: $RESPONSE)"
else
    echo -e "${RED}✗${NC} Admin orders page error (Status: $RESPONSE)"
fi

echo ""
echo "🧪 Test 2: Production Board Page"
echo "URL: $PRODUCTION_BOARD"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_BOARD")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
    echo -e "${GREEN}✓${NC} Production board accessible (Status: $RESPONSE)"
else
    echo -e "${RED}✗${NC} Production board error (Status: $RESPONSE)"
fi

echo ""
echo "🔍 Checking database for orders..."
PGPASSWORD="${DB_PASSWORD:-changeme}" psql -h localhost -U uvcoated -d uvcoated_db -t -c "SELECT COUNT(*) FROM orders;" 2>/dev/null | xargs | read COUNT
if [ -n "$COUNT" ]; then
    echo -e "${GREEN}✓${NC} Database has $COUNT orders"
else
    echo -e "${YELLOW}ℹ${NC} Could not connect to database or no orders found"
fi

echo ""
echo "================================================"
echo "✅ Test Summary"
echo "================================================"
echo ""
echo "Next Steps:"
echo "1. Open browser: $ADMIN_ORDERS"
echo "2. View production board: $PRODUCTION_BOARD"
echo "3. Test status updates on production board"
echo ""
echo "📚 Documentation:"
echo "- ADMIN-ORDERS-IMPLEMENTATION.md"
echo "- PRODUCTION-BOARD-COMPLETE.md"
echo ""
