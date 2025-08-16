#!/bin/bash

# Detailed Transaction Endpoint Testing
BASE_URL="http://localhost:3001"

echo "=== Detailed Transaction Endpoint Testing ==="
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Test each critical transaction endpoint in detail
echo -e "${BLUE}=== Testing DCA Plan Operations ===${NC}"

# Test 1: Create DCA Plan
echo "1. Creating DCA Plan..."
dca_create=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/dca-plans \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_type": "DCA_BUY",
    "frequency": "HOURLY", 
    "amount_per_execution_inr": 500,
    "remaining_executions": 3
  }')

http_code=$(echo $dca_create | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $dca_create | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 201 ]; then
    DCA_PLAN_ID=$(echo $body | jq -r '.planId')
    echo -e "${GREEN}✓ DCA Plan created successfully (ID: $DCA_PLAN_ID)${NC}"
else
    echo -e "${RED}✗ DCA Plan creation failed (HTTP $http_code)${NC}"
    echo "Error: $body"
    DCA_PLAN_ID=""
fi
echo ""

# Test 2: List DCA Plans
echo "2. Listing DCA Plans..."
dca_list=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET $BASE_URL/api/dca-plans \
  -H "Authorization: Bearer $ADMIN_TOKEN")

http_code=$(echo $dca_list | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $dca_list | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    plan_count=$(echo $body | jq '.plans | length')
    echo -e "${GREEN}✓ DCA Plans listed successfully ($plan_count plans found)${NC}"
else
    echo -e "${RED}✗ DCA Plans listing failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

# Test 3: Pause DCA Plan
if [ ! -z "$DCA_PLAN_ID" ]; then
    echo "3. Pausing DCA Plan..."
    dca_pause=$(curl -s -w "HTTP_STATUS:%{http_code}" -X PATCH $BASE_URL/api/dca-plans/$DCA_PLAN_ID/status \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "PAUSED"}')

    http_code=$(echo $dca_pause | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $dca_pause | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ DCA Plan paused successfully${NC}"
    else
        echo -e "${RED}✗ DCA Plan pausing failed (HTTP $http_code)${NC}"
        echo "Error: $body"
    fi
else
    echo -e "${YELLOW}3. Skipping DCA Plan pause test (no plan to pause)${NC}"
fi
echo ""

# Test 4: Resume DCA Plan  
if [ ! -z "$DCA_PLAN_ID" ]; then
    echo "4. Resuming DCA Plan..."
    dca_resume=$(curl -s -w "HTTP_STATUS:%{http_code}" -X PATCH $BASE_URL/api/dca-plans/$DCA_PLAN_ID/status \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "ACTIVE"}')

    http_code=$(echo $dca_resume | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $dca_resume | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ DCA Plan resumed successfully${NC}"
    else
        echo -e "${RED}✗ DCA Plan resuming failed (HTTP $http_code)${NC}"
        echo "Error: $body"
    fi
else
    echo -e "${YELLOW}4. Skipping DCA Plan resume test (no plan to resume)${NC}"
fi
echo ""

# Test 5: Delete DCA Plan (CRITICAL - This was the original issue)
if [ ! -z "$DCA_PLAN_ID" ]; then
    echo -e "${YELLOW}5. Deleting DCA Plan (CRITICAL TEST - Original Issue)...${NC}"
    dca_delete=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE $BASE_URL/api/dca-plans/$DCA_PLAN_ID \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    http_code=$(echo $dca_delete | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $dca_delete | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ DCA Plan deleted successfully (ISSUE FIXED!)${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}✗ DCA Plan deletion failed (HTTP $http_code) - ISSUE STILL EXISTS!${NC}"
        echo "Error: $body"
    fi
else
    echo -e "${YELLOW}5. Skipping DCA Plan deletion test (no plan to delete)${NC}"
fi
echo ""

echo -e "${BLUE}=== Testing Limit Order Operations ===${NC}"

# Test 6: Create Limit Buy Order
echo "6. Creating Limit Buy Order..."
limit_buy=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "LIMIT_BUY",
    "btc_amount": 5000,
    "inr_amount": 500,
    "execution_price": 10000000
  }')

http_code=$(echo $limit_buy | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $limit_buy | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 201 ]; then
    BUY_TRANSACTION_ID=$(echo $body | jq -r '.transactionId')
    echo -e "${GREEN}✓ Limit Buy Order created successfully (ID: $BUY_TRANSACTION_ID)${NC}"
else
    echo -e "${RED}✗ Limit Buy Order creation failed (HTTP $http_code)${NC}"
    echo "Error: $body"
    BUY_TRANSACTION_ID=""
fi
echo ""

# Test 7: Create Limit Sell Order
echo "7. Creating Limit Sell Order..."
limit_sell=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "LIMIT_SELL",
    "btc_amount": 10000,
    "inr_amount": 1200,
    "execution_price": 12000000
  }')

http_code=$(echo $limit_sell | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $limit_sell | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 201 ]; then
    SELL_TRANSACTION_ID=$(echo $body | jq -r '.transactionId')
    echo -e "${GREEN}✓ Limit Sell Order created successfully (ID: $SELL_TRANSACTION_ID)${NC}"
else
    echo -e "${RED}✗ Limit Sell Order creation failed (HTTP $http_code)${NC}"
    echo "Error: $body"
    SELL_TRANSACTION_ID=""
fi
echo ""

# Test 8: Cancel Limit Buy Order
if [ ! -z "$BUY_TRANSACTION_ID" ]; then
    echo "8. Cancelling Limit Buy Order..."
    cancel_buy=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE $BASE_URL/api/transactions/$BUY_TRANSACTION_ID/cancel \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    http_code=$(echo $cancel_buy | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $cancel_buy | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Limit Buy Order cancelled successfully${NC}"
        echo "Funds released: $(echo $body | jq '.funds_released')"
    else
        echo -e "${RED}✗ Limit Buy Order cancellation failed (HTTP $http_code)${NC}"
        echo "Error: $body"
    fi
else
    echo -e "${YELLOW}8. Skipping Limit Buy Order cancellation (no order to cancel)${NC}"
fi
echo ""

# Test 9: Cancel Limit Sell Order  
if [ ! -z "$SELL_TRANSACTION_ID" ]; then
    echo "9. Cancelling Limit Sell Order..."
    cancel_sell=$(curl -s -w "HTTP_STATUS:%{http_code}" -X DELETE $BASE_URL/api/transactions/$SELL_TRANSACTION_ID/cancel \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    http_code=$(echo $cancel_sell | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    body=$(echo $cancel_sell | sed 's/HTTP_STATUS:[0-9]*$//')

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Limit Sell Order cancelled successfully${NC}"
        echo "Funds released: $(echo $body | jq '.funds_released')"
    else
        echo -e "${RED}✗ Limit Sell Order cancellation failed (HTTP $http_code)${NC}"
        echo "Error: $body"
    fi
else
    echo -e "${YELLOW}9. Skipping Limit Sell Order cancellation (no order to cancel)${NC}"
fi
echo ""

echo -e "${BLUE}=== Testing Market Trade Operations ===${NC}"

# Test 10: Market Buy (INR to BTC)
echo "10. Testing Market Buy (INR → BTC)..."
market_buy=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/trade \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "buy",
    "type": "market", 
    "amount": "200",
    "currency": "inr"
  }')

http_code=$(echo $market_buy | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $market_buy | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    trade_id=$(echo $body | jq -r '.id')
    btc_received=$(echo $body | jq -r '.btc_amount')
    echo -e "${GREEN}✓ Market Buy successful (Trade ID: $trade_id, BTC received: $btc_received satoshis)${NC}"
else
    echo -e "${RED}✗ Market Buy failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

# Test 11: Market Sell (BTC to INR) 
echo "11. Testing Market Sell (BTC → INR)..."
market_sell=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/trade \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sell",
    "type": "market",
    "amount": "0.00001",
    "currency": "btc"  
  }')

http_code=$(echo $market_sell | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $market_sell | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    trade_id=$(echo $body | jq -r '.id') 
    inr_received=$(echo $body | jq -r '.inr_amount')
    echo -e "${GREEN}✓ Market Sell successful (Trade ID: $trade_id, INR received: ₹$inr_received)${NC}"
else
    echo -e "${RED}✗ Market Sell failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

echo -e "${BLUE}=== Testing Send Transaction Operations ===${NC}"

# Test 12: Send INR to another user
echo "12. Testing Send INR Transaction..."
send_inr=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/send-transaction \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "yashpatil.5954@gmail.com",
    "amount": "100", 
    "currency": "inr"
  }')

http_code=$(echo $send_inr | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $send_inr | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    sender_tx=$(echo $body | jq -r '.senderTransactionId')
    recipient_tx=$(echo $body | jq -r '.recipientTransactionId')
    echo -e "${GREEN}✓ Send INR Transaction successful${NC}"
    echo "Sender TX ID: $sender_tx, Recipient TX ID: $recipient_tx"
else
    echo -e "${RED}✗ Send INR Transaction failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

# Test 13: Send BTC to another user
echo "13. Testing Send BTC Transaction..." 
send_btc=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST $BASE_URL/api/send-transaction \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "yashpatil.5954@gmail.com",
    "amount": "0.00001",
    "currency": "btc"
  }')

http_code=$(echo $send_btc | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $send_btc | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    sender_tx=$(echo $body | jq -r '.senderTransactionId')
    recipient_tx=$(echo $body | jq -r '.recipientTransactionId')
    echo -e "${GREEN}✓ Send BTC Transaction successful${NC}"
    echo "Sender TX ID: $sender_tx, Recipient TX ID: $recipient_tx"
else
    echo -e "${RED}✗ Send BTC Transaction failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

echo -e "${BLUE}=== Final Balance Check ===${NC}"

# Test 14: Check final balance
echo "14. Checking Final Balance..."
final_balance=$(curl -s -w "HTTP_STATUS:%{http_code}" -X GET $BASE_URL/api/balance \
  -H "Authorization: Bearer $ADMIN_TOKEN")

http_code=$(echo $final_balance | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo $final_balance | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
    available_inr=$(echo $body | jq -r '.available_inr')
    available_btc=$(echo $body | jq -r '.available_btc') 
    reserved_inr=$(echo $body | jq -r '.reserved_inr')
    reserved_btc=$(echo $body | jq -r '.reserved_btc')
    echo -e "${GREEN}✓ Final Balance Retrieved${NC}"
    echo "Available INR: ₹$available_inr, Available BTC: $available_btc satoshis"
    echo "Reserved INR: ₹$reserved_inr, Reserved BTC: $reserved_btc satoshis"
else
    echo -e "${RED}✗ Final Balance check failed (HTTP $http_code)${NC}"
    echo "Error: $body"
fi
echo ""

echo -e "${BLUE}=== Detailed Test Complete ===${NC}"
echo "All critical transaction endpoints have been tested."
echo "Check output above for any failures that need attention."
