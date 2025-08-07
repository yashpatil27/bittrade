# BitTrade Development Setup 📱

## Mobile-Friendly Development

This project is configured to work seamlessly with mobile testing during development.

### 🚀 Start Development (Network Accessible)

```bash
npm run dev
```

This will start both server and client with network access enabled:
- **Client**: `http://your-ip:3000` (accessible from mobile devices)
- **Server**: `http://your-ip:3001` (API server)
- **Auto-detection**: The client automatically detects your IP and connects to the right API endpoint

### 📱 Mobile Testing

1. **Start development server**: `npm run dev`
2. **Find your IP**: The server will show your network IP when it starts
3. **Access from mobile**: Open `http://your-ip:3000` on your phone/tablet
4. **API calls work automatically**: The app detects you're using IP access and routes API calls correctly

### 🖥️ Localhost-Only Development (Optional)

If you need localhost-only development:

```bash
npm run dev:local
```

### 🌐 URL Structure

| Environment | Client | API Server | WebSocket |
|-------------|--------|------------|-----------|
| **Localhost Dev** | `localhost:3000` | `localhost:3001` | `ws://localhost:3001` |
| **Network Dev** | `192.168.x.x:3000` | `192.168.x.x:3001` | `ws://192.168.x.x:3001` |
| **Production** | `bittrade.co.in` | `bittrade.co.in/api` | `wss://bittrade.co.in` |

### 🔧 How It Works

The client automatically detects the access method:
- **Localhost access**: Uses `localhost:3001` for API calls
- **IP access (mobile)**: Uses `your-ip:3001` for API calls  
- **Production**: Uses `bittrade.co.in/api` for API calls

No manual configuration needed! 🎉

### 🔍 Testing API Endpoints

You can test any endpoint directly:
```bash
# Health check
curl http://your-ip:3001/api/health

# Bitcoin data
curl http://your-ip:3001/api/bitcoin/current
```

### 📋 Available Scripts

- `npm run dev` - Start development with network access (recommended)
- `npm run dev:local` - Start development localhost-only
- `npm run client:dev` - Start only the client (network accessible)
- `npm run server:dev` - Start only the server
- `npm run build` - Build for production
- `npm install:all` - Install dependencies for all packages
