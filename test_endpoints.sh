#!/bin/bash

# BitTrade API Endpoint Testing Script
BASE_URL="http://localhost:3001"

echo "=== BitTrade API Endpoint Testing ==="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${BLUE}1. Testing Health Check Endpoint${NC}"
echo "GET /api/health"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" $BASE_URL/api/health)
http_code=$(echo $response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $response | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 2: Get Authentication Token (Admin User)
echo -e "${BLUE}2. Authenticating as Admin User${NC}"
echo "POST /api/auth/login"
login_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bittrade.co.in", "password": "admin123"}')

http_code=$(echo $login_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $login_response | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Admin login successful${NC}"
    ADMIN_TOKEN=$(echo $body | jq -r '.token')
    echo "Admin Token: ${ADMIN_TOKEN:0:20}..."
else
    echo -e "${RED}✗ Admin login failed (HTTP $http_code)${NC}"
    echo "Response: $body"
    exit 1
fi
echo ""

# Test 3: Get Authentication Token (Regular User)
echo -e "${BLUE}3. Authenticating as Regular User${NC}"
echo "POST /api/auth/login"
user_login_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "yashpatil.5954@gmail.com", "password": "user123"}')

http_code=$(echo $user_login_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $user_login_response | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ User login successful${NC}"
    USER_TOKEN=$(echo $body | jq -r '.token')
    echo "User Token: ${USER_TOKEN:0:20}..."
else
    echo -e "${RED}✗ User login failed (HTTP $http_code)${NC}"
    echo "Response: $body"
    # Don't exit here, we can still test with admin token
    USER_TOKEN=""
fi
echo ""

# Test 4: Get User Balance
echo -e "${BLUE}4. Testing Balance Endpoint${NC}"
echo "GET /api/balance"
balance_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET $BASE_URL/api/balance \
  -H "Authorization: Bearer $ADMIN_TOKEN")

http_code=$(echo $balance_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $balance_response | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Balance endpoint working${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Balance endpoint failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 5: Get Transactions
echo -e "${BLUE}5. Testing Transactions Endpoint${NC}"
echo "GET /api/transactions"
trans_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET $BASE_URL/api/transactions \
  -H "Authorization: Bearer $ADMIN_TOKEN")

http_code=$(echo $trans_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $trans_response | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Transactions endpoint working${NC}"
    echo "Found $(echo $body | jq '.transactions | length') transactions"
else
    echo -e "${RED}✗ Transactions endpoint failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 6: Create DCA Plan (to test later deletion)
echo -e "${BLUE}6. Testing DCA Plan Creation${NC}"
echo "POST /api/dca-plans"
dca_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/dca-plans \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_type": "DCA_BUY",
    "frequency": "DAILY",
    "amount_per_execution_inr": 1000,
    "remaining_executions": 5
  }')

http_code=$(echo $dca_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $dca_response | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✓ DCA plan creation successful${NC}"
    DCA_PLAN_ID=$(echo $body | jq -r '.planId')
    echo "Created DCA Plan ID: $DCA_PLAN_ID"
else
    echo -e "${RED}✗ DCA plan creation failed (HTTP $http_code)${NC}"
    echo "Response: $body"
    DCA_PLAN_ID=""
fi
echo ""

# Test 7: Test DCA Plan Deletion (main issue that was reported)
if [ ! -z "$DCA_PLAN_ID" ]; then
    echo -e "${BLUE}7. Testing DCA Plan Deletion (Critical Test)${NC}"
    echo "DELETE /api/dca-plans/$DCA_PLAN_ID"
    delete_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE $BASE_URL/api/dca-plans/$DCA_PLAN_ID \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    http_code=$(echo $delete_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $delete_response | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ DCA plan deletion successful${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}✗ DCA plan deletion failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
else
    echo -e "${YELLOW}7. Skipping DCA plan deletion test (no plan created)${NC}"
fi
echo ""

# Test 8: Create Limit Order
echo -e "${BLUE}8. Testing Limit Order Creation${NC}"
echo "POST /api/orders"
order_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "LIMIT_BUY",
    "btc_amount": 10000,
    "inr_amount": 1000,
    "execution_price": 10000000
  }')

http_code=$(echo $order_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $order_response | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✓ Limit order creation successful${NC}"
    TRANSACTION_ID=$(echo $body | jq -r '.transactionId')
    echo "Created Transaction ID: $TRANSACTION_ID"
else
    echo -e "${RED}✗ Limit order creation failed (HTTP $http_code)${NC}"
    echo "Response: $body"
    TRANSACTION_ID=""
fi
echo ""

# Test 9: Cancel Limit Order
if [ ! -z "$TRANSACTION_ID" ]; then
    echo -e "${BLUE}9. Testing Limit Order Cancellation${NC}"
    echo "DELETE /api/transactions/$TRANSACTION_ID/cancel"
    cancel_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE $BASE_URL/api/transactions/$TRANSACTION_ID/cancel \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    http_code=$(echo $cancel_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $cancel_response | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Limit order cancellation successful${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}✗ Limit order cancellation failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
else
    echo -e "${YELLOW}9. Skipping limit order cancellation test (no order created)${NC}"
fi
echo ""

# Test 10: Market Trade
echo -e "${BLUE}10. Testing Market Trade${NC}"
echo "POST /api/trade"
trade_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/trade \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "buy",
    "type": "market",
    "amount": "100",
    "currency": "inr"
  }')

http_code=$(echo $trade_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $trade_response | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Market trade successful${NC}"
    echo "Trade ID: $(echo $body | jq -r '.id')"
    echo "BTC Amount: $(echo $body | jq -r '.btc_amount')"
    echo "INR Amount: $(echo $body | jq -r '.inr_amount')"
else
    echo -e "${RED}✗ Market trade failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 11: Send Transaction (if we have two users)
if [ ! -z "$USER_TOKEN" ]; then
    echo -e "${BLUE}11. Testing Send Transaction${NC}"
    echo "POST /api/send-transaction"
    send_response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/send-transaction \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "recipientEmail": "yashpatil.5954@gmail.com",
        "amount": "50",
        "currency": "inr"
      }')

    http_code=$(echo $send_response | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $send_response | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Send transaction successful${NC}"
        echo "Sender Transaction ID: $(echo $body | jq -r '.senderTransactionId')"
        echo "Recipient Transaction ID: $(echo $body | jq -r '.recipientTransactionId')"
    else
        echo -e "${RED}✗ Send transaction failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
else
    echo -e "${YELLOW}11. Skipping send transaction test (only admin user available)${NC}"
fi
echo ""

echo -e "${BLUE}=== Test Summary Complete ===${NC}"
