const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

class Logger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  formatTimestamp() {
    const now = new Date();
    return now.toISOString().substring(11, 19); // Just HH:MM:SS
  }

  formatMessage(level, message, context = null) {
    const timestamp = this.formatTimestamp();
    const contextStr = context ? ` ${colors.dim}[${context}]${colors.reset}` : '';
    return `${colors.gray}${timestamp}${colors.reset} ${level}${contextStr} ${message}`;
  }

  info(message, context = null) {
    const formattedMessage = this.formatMessage(
      `${colors.cyan}ℹ${colors.reset}`,
      message,
      context
    );
    console.log(formattedMessage);
  }

  success(message, context = null) {
    const formattedMessage = this.formatMessage(
      `${colors.green}✓${colors.reset}`,
      message,
      context
    );
    console.log(formattedMessage);
  }

  warn(message, context = null) {
    const formattedMessage = this.formatMessage(
      `${colors.yellow}⚠${colors.reset}`,
      message,
      context
    );
    console.warn(formattedMessage);
  }

  error(message, error = null, context = null) {
    const formattedMessage = this.formatMessage(
      `${colors.red}✗${colors.reset}`,
      message,
      context
    );
    console.error(formattedMessage);
    
    if (error && !this.isProduction) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`${colors.dim}  ${errorMsg}${colors.reset}`);
    }
  }

  debug(message, context = null) {
    if (this.isProduction) return;
    
    const formattedMessage = this.formatMessage(
      `${colors.magenta}◦${colors.reset}`,
      message,
      context
    );
    console.log(formattedMessage);
  }

  api(method, path, status, duration = null) {
    const statusColor = status >= 400 ? colors.red : 
                       status >= 300 ? colors.yellow : 
                       colors.green;
    
    const durationText = duration ? ` ${colors.dim}${duration}ms${colors.reset}` : '';
    
    const formattedMessage = this.formatMessage(
      `${colors.blue}→${colors.reset}`,
      `${method} ${path} ${statusColor}${status}${colors.reset}${durationText}`,
      'API'
    );
    console.log(formattedMessage);
  }

  websocket(event, message, userId = null) {
    const userInfo = userId ? ` ${colors.dim}user:${userId}${colors.reset}` : '';
    
    const formattedMessage = this.formatMessage(
      `${colors.cyan}⚡${colors.reset}`,
      `${event} ${message}${userInfo}`,
      'WS'
    );
    console.log(formattedMessage);
  }

  database(operation, table, duration = null) {
    const durationText = duration ? ` ${colors.dim}${duration}ms${colors.reset}` : '';
    
    const formattedMessage = this.formatMessage(
      `${colors.magenta}◉${colors.reset}`,
      `${operation} ${table}${durationText}`,
      'DB'
    );
    console.log(formattedMessage);
  }

  bitcoin(event, price = null, message = '') {
    const priceText = price ? ` $${price.toLocaleString()}` : '';
    const fullMessage = `${event}${priceText}${message ? ' ' + message : ''}`;
    
    const formattedMessage = this.formatMessage(
      `${colors.yellow}₿${colors.reset}`,
      fullMessage,
      'BTC'
    );
    console.log(formattedMessage);
  }

  cache(operation, key, hit = null) {
    const hitText = hit !== null ? (hit ? ' HIT' : ' MISS') : '';
    const hitColor = hit ? colors.green : colors.yellow;
    
    const formattedMessage = this.formatMessage(
      `${colors.cyan}◈${colors.reset}`,
      `${operation} ${key}${hitColor}${hitText}${colors.reset}`,
      'CACHE'
    );
    console.log(formattedMessage);
  }

  transaction(type, userId, amount, status = 'SUCCESS') {
    const statusColor = status === 'SUCCESS' ? colors.green : 
                       status === 'PENDING' ? colors.yellow : colors.red;
    
    const formattedMessage = this.formatMessage(
      `${colors.green}$${colors.reset}`,
      `${type} user:${userId} ${amount} ${statusColor}${status}${colors.reset}`,
      'TXN'
    );
    console.log(formattedMessage);
  }

  server(message) {
    const formattedMessage = this.formatMessage(
      `${colors.blue}◆${colors.reset}`,
      message,
      'SERVER'
    );
    console.log(formattedMessage);
  }

  auth(event, userId = null, message = '') {
    const userInfo = userId ? ` user:${userId}` : '';
    const fullMessage = `${event}${userInfo}${message ? ' ' + message : ''}`;
    
    const formattedMessage = this.formatMessage(
      `${colors.blue}🔐${colors.reset}`,
      fullMessage,
      'AUTH'
    );
    console.log(formattedMessage);
  }

  // Helper method for separators
  separator(title = '') {
    const line = '─'.repeat(60);
    console.log(`${colors.gray}${line}${colors.reset}`);
    if (title) {
      console.log(`${colors.bright}${title}${colors.reset}`);
      console.log(`${colors.gray}${line}${colors.reset}`);
    }
  }
}

module.exports = new Logger();
