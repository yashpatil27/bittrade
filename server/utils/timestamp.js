/**
 * UTC Timestamp Utilities
 * Provides consistent UTC timestamp generation for database operations
 */

/**
 * Generate a UTC timestamp string in MySQL-compatible DATETIME format
 * @returns {string} UTC timestamp in 'YYYY-MM-DD HH:MM:SS' format
 */
function getUTCTimestamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Convert a JavaScript Date to MySQL-compatible UTC timestamp string
 * @param {Date} date - JavaScript Date object
 * @returns {string} UTC timestamp in 'YYYY-MM-DD HH:MM:SS' format
 */
function dateToUTCTimestamp(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Get current UTC timestamp as ISO string (for API responses and logging)
 * @returns {string} UTC timestamp in ISO format
 */
function getUTCISOString() {
  return new Date().toISOString();
}

module.exports = {
  getUTCTimestamp,
  dateToUTCTimestamp,
  getUTCISOString
};
