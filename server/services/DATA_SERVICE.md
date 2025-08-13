# BitTrade Data Service

This service is responsible for fetching and managing data for the BitTrade application. It retrieves real-time Bitcoin market data, historical chart data, and sentiment analysis, then stores it in a MySQL database.

## Features

- **Real-time Bitcoin Data:**
  - Updates every 30 seconds
  - Includes current price, 24-hour change, market cap, volume, and more

- **Sentiment Analysis:**
  - Fetches Fear & Greed Index once a day
  - Helps understand market sentiment

- **Historical Chart Data:**
  - Covers 1d, 7d, 30d, 90d, and 365d timeframes
  - Data is updated at staggered intervals to avoid rate limiting

## How It Works

1. **Real-Time Price Data:**
   - Data fetched every 30 seconds from CoinGecko API
   - Only the last 5 records are kept

2. **Daily Sentiment Analysis:**
   - Fetches Fear & Greed data from Alternative.me
   - Keeps the past 5 records

3. **Historical Price Charts:**
   - Fetched from CoinGecko API using varying intervals
   - **Intervals:**
     - 1 day: ~5-minute intervals
     - 7 days: ~1-hour intervals
     - 30 days: ~1-hour intervals
     - 90 days: ~1-hour intervals
     - 365 days: 1-day intervals

## Usage

### Prerequisites

- Node.js installed
- MySQL database setup
  - Update database configuration in `config/config.js`

### Running the Service

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Service:**
   ```bash
   npm start
   ```

3. **Development Mode:**
   - To run with nodemon (auto-restart on changes), use:
   ```bash
   npm run dev
   ```

The service will automatically fetch and store Bitcoin data, sentiment, and chart information as described.

## Technical Details

### Data Sources

- **CoinGecko API**: `https://api.coingecko.com/api/v3`
  - Real-time Bitcoin price data
  - Historical chart data
  - Market statistics

- **Alternative.me API**: `https://api.alternative.me/fng/`
  - Fear & Greed Index
  - Market sentiment analysis

### Database Schema

The service populates three main tables:

1. **bitcoin_data**: Real-time price and market data
   - `btc_usd_price`: Current Bitcoin price in USD
   - `created_at`: Timestamp of when the data was created

2. **bitcoin_sentiment**: Daily sentiment data
   - `fear_greed_value`: Index value (0-100)
   - `fear_greed_classification`: Text classification
   - `data_date`: Date of the sentiment data

3. **bitcoin_chart_data**: Historical price charts
   - `timeframe`: Chart timeframe (1d, 7d, 30d, 90d, 365d)
   - `price_data`: JSON array of price points
   - `data_points_count`: Number of data points
   - `date_from` / `date_to`: Date range covered

### Update Schedules

- **Bitcoin Data**: Every 30 seconds
- **Sentiment Data**: Daily at midnight
- **Chart Data**: Staggered startup to prevent rate limiting
  - 1d chart: 5 min startup delay, then every hour
  - 7d chart: 10 min startup delay, then every 6 hours
  - 30d chart: 15 min startup delay, then every 12 hours
  - 90d chart: 20 min startup delay, then every 18 hours
  - 365d chart: 25 min startup delay, then daily

### Data Retention

- **bitcoin_data**: Last 5 records
- **bitcoin_sentiment**: Last 5 records
- **bitcoin_chart_data**: Last 2 records per timeframe

### Configuration

Update `config/config.js` to modify:
- Database connection settings
- API endpoints
- Update intervals
- Data retention limits

### Error Handling

- Graceful API failure handling
- Database connection retry logic
- Proper shutdown on SIGINT (Ctrl+C)

### Logging

The service provides console output for:
- Successful data updates
- Error messages
- Startup information
- Schedule confirmations
