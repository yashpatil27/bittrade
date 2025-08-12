interface LogContext {
  component?: string;
  user?: string | number;
  action?: string;
}

class ClientLogger {
  private isProduction = process.env.NODE_ENV === 'production';
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString().substring(11, 19); // Just HH:MM:SS
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = this.formatTimestamp();
    let contextStr = '';

    if (context) {
      const parts = [];
      if (context.component) parts.push(context.component);
      if (context.user) parts.push(`user:${context.user}`);
      if (context.action) parts.push(context.action);
      if (parts.length > 0) {
        contextStr = ` [${parts.join('|')}]`;
      }
    }

    return `${timestamp} ${level}${contextStr} ${message}`;
  }

  info(message: string, context?: LogContext): void {
    if (this.isProduction) return;
    const formatted = this.formatMessage('ℹ️', message, context);
    console.log(`%c${formatted}`, 'color: #17a2b8');
  }

  success(message: string, context?: LogContext): void {
    if (this.isProduction) return;
    const formatted = this.formatMessage('✅', message, context);
    console.log(`%c${formatted}`, 'color: #28a745');
  }

  warn(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('⚠️', message, context);
    console.warn(`%c${formatted}`, 'color: #ffc107');
  }

  error(message: string, error?: Error | string | unknown, context?: LogContext): void {
    const formatted = this.formatMessage('❌', message, context);
    console.error(`%c${formatted}`, 'color: #dc3545');
    
    if (error && this.isDevelopment) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  ${errorMsg}`);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isProduction) return;
    const formatted = this.formatMessage('🔧', message, context);
    console.log(`%c${formatted}`, 'color: #6f42c1');
  }

  auth(event: string, userId?: string | number, message?: string): void {
    if (this.isProduction) return;
    const userInfo = userId ? ` user:${userId}` : '';
    const fullMessage = `${event}${userInfo}${message ? ' ' + message : ''}`;
    const formatted = this.formatMessage('🔐', fullMessage, { component: 'AUTH' });
    console.log(`%c${formatted}`, 'color: #007bff');
  }

  api(method: string, path: string, status?: number, duration?: number): void {
    if (this.isProduction) return;
    
    let statusColor = '#28a745'; // green
    if (status && status >= 400) statusColor = '#dc3545'; // red
    else if (status && status >= 300) statusColor = '#ffc107'; // yellow

    const durationText = duration ? ` ${duration}ms` : '';
    const statusText = status ? ` ${status}` : '';
    const message = `${method} ${path}${statusText}${durationText}`;
    
    const formatted = this.formatMessage('🌐', message, { component: 'API' });
    console.log(`%c${formatted}`, `color: ${statusColor}`);
  }

  websocket(event: string, message: string, userId?: string | number): void {
    if (this.isProduction) return;
    const userInfo = userId ? ` user:${userId}` : '';
    const fullMessage = `${event} ${message}${userInfo}`;
    const formatted = this.formatMessage('⚡', fullMessage, { component: 'WS' });
    console.log(`%c${formatted}`, 'color: #17a2b8');
  }

  component(name: string, event: string, message?: string): void {
    if (this.isProduction) return;
    const fullMessage = `${event}${message ? ' ' + message : ''}`;
    const formatted = this.formatMessage('🧩', fullMessage, { component: name });
    console.log(`%c${formatted}`, 'color: #6c757d');
  }

  performance(metric: string, value: number, unit: string = 'ms'): void {
    if (this.isProduction) return;
    const message = `${metric} ${value}${unit}`;
    const formatted = this.formatMessage('📊', message, { component: 'PERF' });
    console.log(`%c${formatted}`, 'color: #fd7e14');
  }

  separator(title?: string): void {
    if (this.isProduction) return;
    const line = '─'.repeat(60);
    console.log(`%c${line}`, 'color: #6c757d');
    if (title) {
      console.log(`%c${title}`, 'color: #495057; font-weight: bold');
      console.log(`%c${line}`, 'color: #6c757d');
    }
  }
}

const logger = new ClientLogger();
export default logger;
