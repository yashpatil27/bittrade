# BitTrade - Cryptocurrency Trading Platform

A full-stack cryptocurrency trading platform built with React and Node.js.

## Project Structure

```
bittrade/
├── client/          # React frontend application
├── server/          # Node.js backend application  
├── database/        # Database schema and setup
└── public/          # Public assets
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MySQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashpatil27/bittrade.git
   cd bittrade
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up the database**
   - Create a MySQL database
   - Run the SQL files in the `database/` folder
   - Configure database connection in `server/config/config.js`

4. **Run the application**
   ```bash
   npm run dev
   ```

   This will start both the server and client simultaneously:
   - Server: http://localhost:3001
   - Client: http://localhost:3000

## Available Scripts

- `npm run dev` - Run both server and client in development mode
- `npm run server:dev` - Run only the server in development mode
- `npm run client:dev` - Run only the client in development mode
- `npm run build` - Build the client for production
- `npm run start` - Start the server in production mode
- `npm run test` - Run client tests
- `npm run install:all` - Install dependencies for root, server, and client

## Features

- **Trading Interface** - Buy/sell Bitcoin with intuitive modals
- **Real-time Charts** - Bitcoin price visualization
- **Transaction History** - Complete trading history
- **Portfolio Management** - Track your holdings
- **Responsive Design** - Works on all devices
- **Market Data** - Real-time cryptocurrency data

## Technology Stack

### Frontend
- React with TypeScript
- Tailwind CSS
- Recharts for data visualization
- Lucide React for icons

### Backend
- Node.js with Express
- MySQL database
- Axios for API calls
- Node-cron for scheduled tasks

## Development

### Server Development
The server runs on port 3001 and includes:
- REST API endpoints
- Database connection
- Real-time data fetching
- Scheduled market updates

### Client Development
The client runs on port 3000 and includes:
- Modern React components
- TypeScript for type safety
- Responsive design with Tailwind CSS
- Real-time data updates

## Database Setup

1. Create a MySQL database named `bittrade`
2. Run the schema file: `database/schema.sql`
3. Run the admin setup: `database/seed_admin.sql`
4. Configure the connection in `server/config/config.js`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
