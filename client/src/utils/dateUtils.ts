/**
 * Date utilities for consistent timezone handling across the application
 * All database timestamps are stored in UTC and converted to user's local timezone for display
 */

// Indian timezone for crypto trading (most users expected to be in India)
const INDIAN_TIMEZONE = 'Asia/Kolkata';

/**
 * Gets the user's system timezone, with fallback to Indian timezone
 * @returns User's timezone string
 */
function getUserTimezone(): string {
  try {
    // Get user's system timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('🌍 Detected user timezone:', detectedTimezone);
    return detectedTimezone;
  } catch (error) {
    console.warn('Could not detect user timezone, falling back to Indian timezone:', error);
    return INDIAN_TIMEZONE;
  }
}

/**
 * Formats a database timestamp (UTC) for display in user's timezone
 * @param timestamp - UTC timestamp from database (string or Date)
 * @param timezone - Target timezone (defaults to user's system timezone)
 * @returns Formatted date string
 */
export function formatTimestampForDisplay(
  timestamp: string | Date, 
  timezone: string = getUserTimezone()
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date);
}

/**
 * Formats timestamp for transaction history (shorter format)
 * @param timestamp - UTC timestamp from database
 * @param timezone - Target timezone (defaults to user's system timezone)
 * @returns Short formatted date string
 */
export function formatTransactionTime(
  timestamp: string | Date,
  timezone: string = getUserTimezone()
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // Use a locale that matches the user's timezone for better formatting
  const userTimezone = timezone || getUserTimezone();
  const locale = userTimezone.includes('Asia/Kolkata') || userTimezone.includes('India') ? 'en-IN' : 'en-US';
  
  console.log('🕐 formatTransactionTime debug:', {
    originalTimestamp: timestamp,
    parsedDate: date.toISOString(),
    userTimezone,
    locale
  });
  
  const formatted = new Intl.DateTimeFormat(locale, {
    timeZone: userTimezone,
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
  
  console.log('🕐 Formatted result:', formatted);
  
  return formatted;
}

/**
 * Safely parses various timestamp formats into a Date object
 * @param timestamp - Timestamp in various formats (string, number, Date)
 * @returns Valid Date object or null if invalid
 */
function parseTimestamp(timestamp: any): Date | null {
  if (!timestamp) {
    return null;
  }
  
  let date: Date;
  
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    // Handle ISO strings, MySQL datetime strings, etc.
    date = new Date(timestamp);
  } else if (typeof timestamp === 'number') {
    // Handle Unix timestamps (seconds or milliseconds)
    // If the number is small, it's likely seconds; if large, milliseconds
    if (timestamp < 10000000000) {
      // Likely seconds (before year 2286)
      date = new Date(timestamp * 1000);
    } else {
      // Likely milliseconds
      date = new Date(timestamp);
    }
  } else {
    // Try to convert to string first
    date = new Date(String(timestamp));
  }
  
  // Validate the parsed date
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

/**
 * Formats timestamp for relative time (e.g., "2 minutes ago")
 * @param timestamp - UTC timestamp from database
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: any): string {
  // Handle empty or null/undefined timestamps
  if (!timestamp) {
    console.warn('formatRelativeTime: Empty timestamp provided');
    return 'Unknown time';
  }
  
  const date = parseTimestamp(timestamp);
  
  // Check if the date is valid
  if (!date) {
    console.warn('formatRelativeTime: Invalid timestamp provided:', timestamp);
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  
  // Debug logging for negative values
  if (diffInSeconds < -3600) { // More than 1 hour in the future
    console.warn('formatRelativeTime: Timestamp appears to be far in the future:', {
      originalTimestamp: timestamp,
      parsedDate: date.toISOString(),
      now: now.toISOString(),
      diffInSeconds
    });
  }
  
  // Handle future dates (should not normally happen, but safety check)
  if (diffInSeconds < 0) {
    const futureDiffInSeconds = Math.abs(diffInSeconds);
    if (futureDiffInSeconds < 60) {
      return 'Just now';
    } else if (futureDiffInSeconds < 3600) {
      return `in ${Math.floor(futureDiffInSeconds / 60)}m`;
    } else {
      return formatTransactionTime(date);
    }
  }
  
  // Handle past dates (normal case)
  if (diffInSeconds < 30) {
    return 'Just now';
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    const remainingMinutes = Math.floor((diffInSeconds % 3600) / 60);
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m ago`;
    } else {
      return `${hours}h ago`;
    }
  } else if (diffInSeconds < 2592000) { // 30 days
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    // For very old dates, show formatted date
    return formatTransactionTime(date);
  }
}

/**
 * Formats timestamp for order execution logs
 * @param timestamp - UTC timestamp from database
 * @param timezone - Target timezone
 * @returns Detailed formatted timestamp
 */
export function formatOrderExecutionTime(
  timestamp: string | Date,
  timezone: string = INDIAN_TIMEZONE
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    hour12: false
  }).format(date);
}

/**
 * Get current timestamp in UTC for database storage
 * @returns UTC ISO string
 */
export function getCurrentUTCTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Convert user input date/time to UTC for database storage
 * @param dateInput - User's local date input
 * @param timezone - User's timezone
 * @returns UTC ISO string
 */
export function convertToUTC(dateInput: Date, timezone: string = INDIAN_TIMEZONE): string {
  // This handles the timezone conversion properly
  return dateInput.toISOString();
}

/**
 * Check if a timestamp is today in user's timezone
 * @param timestamp - UTC timestamp from database
 * @param timezone - User's timezone (defaults to user's system timezone)
 * @returns boolean
 */
export function isToday(timestamp: string | Date, timezone: string = getUserTimezone()): boolean {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const today = new Date();
  
  const userTimezone = timezone || getUserTimezone();
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(date);
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(today);
  
  return dateStr === todayStr;
}

/**
 * Format date for DCA scheduling (next execution time)
 * @param timestamp - UTC timestamp from database
 * @param timezone - Target timezone (defaults to user's system timezone)
 * @returns Formatted scheduling time
 */
export function formatDCAScheduleTime(
  timestamp: string | Date,
  timezone: string = getUserTimezone()
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const userTimezone = timezone || getUserTimezone();
  const locale = userTimezone.includes('Asia/Kolkata') || userTimezone.includes('India') ? 'en-IN' : 'en-US';
  
  if (isToday(date, userTimezone)) {
    return `Today at ${new Intl.DateTimeFormat(locale, {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)}`;
  }
  
  return new Intl.DateTimeFormat(locale, {
    timeZone: userTimezone,
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}
