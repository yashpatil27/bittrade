# WebSocket Broadcast Service Implementation

This document describes the implementation of the WebSocket broadcast service for Bitcoin price updates in the BitTrade platform.

## Overview

The WebSocket broadcast service provides real-time Bitcoin price updates to all connected clients whenever the Bitcoin price changes. This implementation follows the specifications in `notes/state.txt`.

## Implementation Details

### Server-Side Implementation

#### Event Name
- **Event**: `btc_price_update`
- **Trigger**: When `bitcoin_data.btc_usd_price` changes
- **Broadcast**: Global to all connected clients

#### Payload Structure
```json
{
  "btc_usd_price": 45000,
  "buy_rate_inr": 4095000,
  "sell_rate_inr": 3960000,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Rate Calculation
- **Buy Rate**: `btc_usd_price * settings.buy_multiplier`
- **Sell Rate**: `btc_usd_price * settings.sell_multiplier`

Where:
- `settings.buy_multiplier` = 91 (default)
- `settings.sell_multiplier` = 88 (default)

### Code Location

#### Server Implementation
- **File**: `/server/services/data-service.js`
- **Methods**:
  - `broadcastPriceUpdate()`: Broadcasts price updates via WebSocket
  - `calculateRates()`: Calculates buy/sell rates from USD price
  - `updateBitcoinData()`: Detects price changes and triggers broadcasts

#### Client Implementation
- **Context**: `/client/src/context/WebSocketContext.tsx`
- **Hook**: `useWebSocketEvent()` - For listening to specific events
- **Components**:
  - `MarketRate.tsx` - Displays real-time rates
  - `BitcoinChart.tsx` - Shows real-time price in chart header
  - `WebSocketStatus.tsx` - Shows connection status
  - `PriceUpdateTest.tsx` - Test component for verification

## Usage Examples

### Server-Side Broadcasting
```javascript
// Automatic broadcasting when price changes
if (this.lastBtcPrice !== bitcoinData.btc_usd_price) {
  this.lastBtcPrice = bitcoinData.btc_usd_price;
  this.broadcastPriceUpdate(bitcoinData.btc_usd_price);
}
```

### Client-Side Listening
```typescript
// Listen for price updates
useWebSocketEvent<PriceUpdateData>('btc_price_update', (data) => {
  console.log('Price update received:', data);
  // Update UI with new rates
});
```

## Features

### Real-Time Updates
- **Frequency**: Every 30 seconds (when price changes)
- **Detection**: Compares current price with last known price
- **Efficiency**: Only broadcasts when price actually changes

### Rate Calculation
- **Buy Rate**: Higher rate (favorable for platform)
- **Sell Rate**: Lower rate (favorable for platform)
- **Currency**: INR (Indian Rupees)
- **Precision**: Rounded to whole numbers

### Connection Management
- **Auto-reconnect**: Handles connection drops
- **Status indicators**: Live connection status
- **Error handling**: Graceful failure recovery

## Testing

### Test Component
The `PriceUpdateTest.tsx` component provides:
- Real-time price update visualization
- Update counter
- Price history (last 10 updates)
- Connection status monitoring

### BitcoinChart Integration
The `BitcoinChart.tsx` component now includes:
- Real-time price updates in the chart header
- Live price indicator when updates are received
- Real-time percentage change calculations
- Visual feedback with color changes during updates
- Fallback to historical data when WebSocket is unavailable

### Console Logging
Server logs show:
```
💰 Bitcoin price changed: $44800 → $45000
📡 Broadcasted btc_price_update: $45000 USD (Buy: ₹4095000, Sell: ₹3960000)
📡 Connected clients: 3
```

Client logs show:
```
📡 Received btc_price_update: {btc_usd_price: 45000, buy_rate_inr: 4095000, ...}
📈 BitcoinChart received btc_price_update: {btc_usd_price: 45000, ...}
```

## Configuration

### Database Settings
```sql
INSERT INTO settings (`key`, value) VALUES 
('buy_multiplier', 91),
('sell_multiplier', 88);
```

### Update Intervals
- **Bitcoin Data**: Every 30 seconds
- **Price Change Detection**: Real-time
- **Broadcast**: Immediate when price changes

## Error Handling

### Server-Side
- Graceful handling of API failures
- Database connection error recovery
- WebSocket connection validation

### Client-Side
- Automatic reconnection on disconnect
- Fallback to cached data
- Visual indicators for connection status

## Performance Considerations

### Optimization
- **Conditional Broadcasting**: Only when price changes
- **Efficient Calculation**: Pre-cached multipliers
- **Connection Pooling**: Reuse database connections

### Monitoring
- Connected client count logging
- Update frequency tracking
- Error rate monitoring

## Security

### Data Validation
- Price data sanitization
- Rate calculation validation
- Input parameter checking

### Access Control
- WebSocket connection limits
- Rate limiting (future implementation)
- Client authentication (future implementation)

## Future Enhancements

### Planned Features
- Client-specific subscriptions
- Price alerts and notifications
- Historical price streaming
- Multiple currency support
- Advanced rate algorithms

### Scalability
- Redis for multi-server broadcasting
- Message queuing for high load
- Client connection clustering
- Database read replicas

## Troubleshooting

### Common Issues
1. **No price updates**: Check server logs for API errors
2. **Connection drops**: Verify WebSocket server status
3. **Incorrect rates**: Validate database settings
4. **Performance issues**: Monitor client count and update frequency

### Debug Commands
```bash
# Check WebSocket connections
curl http://localhost:3001/api/health

# Monitor price updates
tail -f server/logs/price-updates.log

# Test WebSocket connection
wscat -c ws://localhost:3001
```

## Conclusion

The WebSocket broadcast service provides efficient, real-time Bitcoin price updates to all connected clients. The implementation is scalable, reliable, and follows the requirements specified in `notes/state.txt`.
