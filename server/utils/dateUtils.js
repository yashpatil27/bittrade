/**
 * Server-side date utilities for consistent UTC timestamp handling
 * All dates stored in database should be in UTC
 */

/**
 * Get current UTC timestamp for database insertion
 * @returns {string} UTC ISO string
 */
function getCurrentUTCTimestamp() {
  return new Date().toISOString();
}

/**
 * Convert a Date object to MySQL DATETIME format in UTC
 * @param {Date} date - JavaScript Date object
 * @returns {string} MySQL DATETIME format string
 */
function toMySQLDateTime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Parse a MySQL TIMESTAMP/DATETIME as UTC and return ISO string
 * @param {string} mysqlTimestamp - MySQL timestamp string
 * @returns {string} UTC ISO string
 */
function fromMySQLTimestamp(mysqlTimestamp) {
  // MySQL TIMESTAMP is stored as UTC when timezone is set to UTC
  // Convert to ISO string for consistent API responses
  return new Date(mysqlTimestamp + 'Z').toISOString();
}

/**
 * Create a standardized API response timestamp
 * @param {Date|string} timestamp - Input timestamp
 * @returns {string} UTC ISO string for API response
 */
function formatForAPI(timestamp) {
  if (typeof timestamp === 'string') {
    // If it's already a string, ensure it's in ISO format
    return new Date(timestamp).toISOString();
  }
  return timestamp.toISOString();
}

/**
 * Add time interval to current timestamp (for scheduling)
 * @param {number} seconds - Seconds to add
 * @returns {string} Future UTC ISO string
 */
function addSeconds(seconds) {
  const future = new Date();
  future.setSeconds(future.getSeconds() + seconds);
  return future.toISOString();
}

/**
 * Add time interval to current timestamp (for scheduling)
 * @param {number} minutes - Minutes to add
 * @returns {string} Future UTC ISO string
 */
function addMinutes(minutes) {
  const future = new Date();
  future.setMinutes(future.getMinutes() + minutes);
  return future.toISOString();
}

/**
 * Add time interval to current timestamp (for scheduling)
 * @param {number} hours - Hours to add
 * @returns {string} Future UTC ISO string
 */
function addHours(hours) {
  const future = new Date();
  future.setHours(future.getHours() + hours);
  return future.toISOString();
}

/**
 * Check if a timestamp is in the past
 * @param {string|Date} timestamp - Timestamp to check
 * @returns {boolean} True if timestamp is in the past
 */
function isPast(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date < new Date();
}

/**
 * Check if a timestamp is in the future
 * @param {string|Date} timestamp - Timestamp to check
 * @returns {boolean} True if timestamp is in the future
 */
function isFuture(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date > new Date();
}

/**
 * Get a readable timestamp for logging (includes timezone info)
 * @param {Date} date - Date to format
 * @returns {string} Formatted timestamp for logs
 */
function formatForLogging(date = new Date()) {
  return date.toISOString() + ' (UTC)';
}

module.exports = {
  getCurrentUTCTimestamp,
  toMySQLDateTime,
  fromMySQLTimestamp,
  formatForAPI,
  addSeconds,
  addMinutes,
  addHours,
  isPast,
  isFuture,
  formatForLogging
};
