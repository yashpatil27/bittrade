#!/bin/bash

# Admin Endpoint Testing Script
BASE_URL="http://localhost:3001"

echo "=== Admin Endpoint Testing ==="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get admin token
echo -e "${BLUE}Getting Admin Authentication Token${NC}"
login_response=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bittrade.co.in", "password": "admin123"}')

ADMIN_TOKEN=$(echo $login_response | jq -r '.token')
if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}✗ Failed to get admin token${NC}"
    echo "Response: $login_response"
    exit 1
fi
echo -e "${GREEN}✓ Got admin token${NC}"
echo ""

echo -e "${BLUE}=== Testing Read-Only Admin Endpoints ===${NC}"

# Test 1: Get Admin Transactions
echo "1. Testing Admin Transactions Endpoint..."
admin_transactions=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET $BASE_URL/api/admin/transactions \
  -H "Authorization: Bearer $ADMIN_TOKEN")

http_code=$(echo $admin_transactions | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $admin_transactions | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    tx_count=$(echo $body | jq '.transactions | length')
    echo -e "${GREEN}✓ Admin transactions endpoint working ($tx_count transactions)${NC}"
else
    echo -e "${RED}✗ Admin transactions endpoint failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

# Test 2: Get Admin DCA Plans
echo "2. Testing Admin DCA Plans Endpoint..."
admin_dca=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET $BASE_URL/api/admin/dca-plans \
  -H "Authorization: Bearer $ADMIN_TOKEN")

http_code=$(echo $admin_dca | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $admin_dca | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    plan_count=$(echo $body | jq '.plans | length')
    echo -e "${GREEN}✓ Admin DCA plans endpoint working ($plan_count plans)${NC}"
else
    echo -e "${RED}✗ Admin DCA plans endpoint failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

# Test 3: Get Admin Users
echo "3. Testing Admin Users Endpoint..."
admin_users=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET $BASE_URL/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN")

http_code=$(echo $admin_users | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $admin_users | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    user_count=$(echo $body | jq '.users | length')
    echo -e "${GREEN}✓ Admin users endpoint working ($user_count users)${NC}"
    # Extract a regular user ID for later tests
    REGULAR_USER_ID=$(echo $body | jq '.users[] | select(.is_admin == 0) | .id' | head -n1)
    echo "Found regular user ID: $REGULAR_USER_ID"
else
    echo -e "${RED}✗ Admin users endpoint failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

# Test 4: Get Admin Total Balance
echo "4. Testing Admin Total Balance Endpoint..."
admin_balance=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET $BASE_URL/api/admin/total-balance \
  -H "Authorization: Bearer $ADMIN_TOKEN")

http_code=$(echo $admin_balance | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $admin_balance | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    total_inr=$(echo $body | jq '.total_available_inr')
    total_btc=$(echo $body | jq '.total_available_btc')
    echo -e "${GREEN}✓ Admin total balance endpoint working (₹$total_inr INR, $total_btc BTC)${NC}"
else
    echo -e "${RED}✗ Admin total balance endpoint failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

# Test 5: Get Admin Metrics
echo "5. Testing Admin Metrics Endpoint..."
admin_metrics=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET $BASE_URL/api/admin/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN")

http_code=$(echo $admin_metrics | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $admin_metrics | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    total_trades=$(echo $body | jq '.total_trades')
    total_volume=$(echo $body | jq '.total_volume')
    echo -e "${GREEN}✓ Admin metrics endpoint working ($total_trades trades, ₹$total_volume volume)${NC}"
else
    echo -e "${RED}✗ Admin metrics endpoint failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

echo -e "${BLUE}=== Testing Transaction Admin Endpoints ===${NC}"

if [ ! -z "$REGULAR_USER_ID" ] && [ "$REGULAR_USER_ID" != "null" ]; then

    # Test 6: Deposit Bitcoin to User
    echo "6. Testing Deposit Bitcoin to User..."
    deposit_btc=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/admin/users/$REGULAR_USER_ID/deposit-bitcoin \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"amount": 5000}')

    http_code=$(echo $deposit_btc | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $deposit_btc | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        deposited_amount=$(echo $body | jq '.depositedAmount')
        echo -e "${GREEN}✓ Bitcoin deposit successful ($deposited_amount satoshis)${NC}"
    else
        echo -e "${RED}✗ Bitcoin deposit failed (HTTP $http_code)${NC}"
        echo "Error: $body"
    fi
    echo ""

    # Test 7: Deposit Cash to User  
    echo "7. Testing Deposit Cash to User..."
    deposit_cash=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/admin/users/$REGULAR_USER_ID/deposit-cash \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"amount": 1000}')

    http_code=$(echo $deposit_cash | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $deposit_cash | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        deposited_amount=$(echo $body | jq '.depositedAmount')
        echo -e "${GREEN}✓ Cash deposit successful (₹$deposited_amount)${NC}"
    else
        echo -e "${RED}✗ Cash deposit failed (HTTP $http_code)${NC}"
        echo "Error: $body"
    fi
    echo ""

    # Test 8: Withdraw Bitcoin from User
    echo "8. Testing Withdraw Bitcoin from User..."
    withdraw_btc=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/admin/users/$REGULAR_USER_ID/withdraw-bitcoin \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"amount": 1000}')

    http_code=$(echo $withdraw_btc | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $withdraw_btc | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        withdrawn_amount=$(echo $body | jq '.withdrawnAmount')
        echo -e "${GREEN}✓ Bitcoin withdrawal successful ($withdrawn_amount satoshis)${NC}"
    else
        echo -e "${RED}✗ Bitcoin withdrawal failed (HTTP $http_code)${NC}"
        echo "Error: $body"
    fi
    echo ""

    # Test 9: Withdraw Cash from User
    echo "9. Testing Withdraw Cash from User..."
    withdraw_cash=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/admin/users/$REGULAR_USER_ID/withdraw-cash \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"amount": 500}')

    http_code=$(echo $withdraw_cash | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $withdraw_cash | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        withdrawn_amount=$(echo $body | jq '.withdrawnAmount')
        echo -e "${GREEN}✓ Cash withdrawal successful (₹$withdrawn_amount)${NC}"
    else
        echo -e "${RED}✗ Cash withdrawal failed (HTTP $http_code)${NC}"
        echo "Error: $body"
    fi
    echo ""

else
    echo -e "${YELLOW}Skipping user-specific tests (no regular user found)${NC}"
    echo ""
fi

echo -e "${BLUE}=== Testing Critical Admin Operations ===${NC}"

if [ ! -z "$REGULAR_USER_ID" ] && [ "$REGULAR_USER_ID" != "null" ]; then

    # Test 10: Delete User (CRITICAL - This was mentioned as not working)
    echo -e "${YELLOW}10. Testing Delete User (CRITICAL TEST)...${NC}"
    delete_user=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE $BASE_URL/api/admin/users/$REGULAR_USER_ID \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    http_code=$(echo $delete_user | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $delete_user | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Delete user successful (USER DELETE WORKS!)${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}✗ Delete user failed (HTTP $http_code) - ISSUE CONFIRMED!${NC}"
        echo "Error: $body"
    fi
    echo ""

else
    echo -e "${YELLOW}10. Skipping delete user test (no regular user to delete)${NC}"
    echo ""
fi

echo -e "${BLUE}=== Admin Test Complete ===${NC}"
echo "Check output above for any failures that need attention."
