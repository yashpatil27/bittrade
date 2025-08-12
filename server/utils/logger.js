const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

class Logger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  formatTimestamp() {
    return new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
  }

  formatMessage(level, message, emoji = '') {
    const timestamp = this.formatTimestamp();
    return `${colors.gray}[${timestamp}]${colors.reset} ${emoji} ${level} ${message}`;
  }

  info(message, data = null) {
    const formattedMessage = this.formatMessage(
      `${colors.cyan}INFO${colors.reset}`,
      message,
      '📄'
    );
    console.log(formattedMessage);
    
    if (data && !this.isProduction) {
      console.log(`${colors.gray}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  }

  success(message, data = null) {
    const formattedMessage = this.formatMessage(
      `${colors.green}SUCCESS${colors.reset}`,
      message,
      '✅'
    );
    console.log(formattedMessage);
    
    if (data && !this.isProduction) {
      console.log(`${colors.gray}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  }

  warn(message, data = null) {
    const formattedMessage = this.formatMessage(
      `${colors.yellow}WARN${colors.reset}`,
      message,
      '⚠️'
    );
    console.warn(formattedMessage);
    
    if (data && !this.isProduction) {
      console.warn(`${colors.gray}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  }

  error(message, error = null) {
    const formattedMessage = this.formatMessage(
      `${colors.red}ERROR${colors.reset}`,
      message,
      '❌'
    );
    console.error(formattedMessage);
    
    if (error) {
      if (error instanceof Error) {
        console.error(`${colors.red}${error.stack}${colors.reset}`);
      } else {
        console.error(`${colors.red}${JSON.stringify(error, null, 2)}${colors.reset}`);
      }
    }
  }

  debug(message, data = null) {
    if (this.isProduction) return;
    
    const formattedMessage = this.formatMessage(
      `${colors.magenta}DEBUG${colors.reset}`,
      message,
      '🔧'
    );
    console.log(formattedMessage);
    
    if (data) {
      console.log(`${colors.gray}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  }

  api(method, path, status, duration = null) {
    const statusColor = status >= 400 ? colors.red : 
                       status >= 300 ? colors.yellow : 
                       colors.green;
    
    const durationText = duration ? ` ${colors.gray}(${duration}ms)${colors.reset}` : '';
    
    const formattedMessage = this.formatMessage(
      `${colors.blue}API${colors.reset}`,
      `${colors.bright}${method}${colors.reset} ${path} ${statusColor}${status}${colors.reset}${durationText}`,
      '🌐'
    );
    console.log(formattedMessage);
  }

  websocket(event, message, userId = null) {
    const userInfo = userId ? ` ${colors.gray}(User: ${userId})${colors.reset}` : '';
    
    const formattedMessage = this.formatMessage(
      `${colors.cyan}WEBSOCKET${colors.reset}`,
      `${colors.bright}${event}${colors.reset} ${message}${userInfo}`,
      '📡'
    );
    console.log(formattedMessage);
  }

  database(operation, table, duration = null) {
    const durationText = duration ? ` ${colors.gray}(${duration}ms)${colors.reset}` : '';
    
    const formattedMessage = this.formatMessage(
      `${colors.magenta}DB${colors.reset}`,
      `${colors.bright}${operation}${colors.reset} ${table}${durationText}`,
      '🗄️'
    );
    console.log(formattedMessage);
  }

  bitcoin(event, price = null, message = '') {
    const priceText = price ? ` ${colors.yellow}$${price}${colors.reset}` : '';
    
    const formattedMessage = this.formatMessage(
      `${colors.yellow}BITCOIN${colors.reset}`,
      `${colors.bright}${event}${colors.reset}${priceText} ${message}`,
      '₿'
    );
    console.log(formattedMessage);
  }

  cache(operation, key, hit = null) {
    const hitText = hit !== null ? (hit ? ' HIT' : ' MISS') : '';
    const hitColor = hit ? colors.green : colors.yellow;
    
    const formattedMessage = this.formatMessage(
      `${colors.cyan}CACHE${colors.reset}`,
      `${colors.bright}${operation}${colors.reset} ${key}${hitColor}${hitText}${colors.reset}`,
      '💾'
    );
    console.log(formattedMessage);
  }

  transaction(type, userId, amount, status = 'SUCCESS') {
    const statusColor = status === 'SUCCESS' ? colors.green : 
                       status === 'PENDING' ? colors.yellow : colors.red;
    
    const formattedMessage = this.formatMessage(
      `${colors.green}TRANSACTION${colors.reset}`,
      `${colors.bright}${type}${colors.reset} User:${userId} Amount:${amount} ${statusColor}${status}${colors.reset}`,
      '💳'
    );
    console.log(formattedMessage);
  }

  server(message) {
    const formattedMessage = this.formatMessage(
      `${colors.blue}SERVER${colors.reset}`,
      message,
      '🚀'
    );
    console.log(formattedMessage);
  }

  // Helper method for separators
  separator(title = '') {
    const line = '─'.repeat(80);
    const titleText = title ? ` ${title} ` : '';
    console.log(`${colors.gray}${line}${colors.reset}`);
    if (title) {
      console.log(`${colors.bright}${titleText}${colors.reset}`);
      console.log(`${colors.gray}${line}${colors.reset}`);
    }
  }
}

module.exports = new Logger();
