/**
 * Formats Bitcoin values from satoshis to display format
 * @param satoshis - Raw satoshi value from the database
 * @returns Formatted Bitcoin string with ₿ symbol
 */
export function formatBitcoinForDisplay(satoshis: number): string {
  if (satoshis === 0) {
    return '₿0';
  }
  
  // Convert satoshis to BTC (divide by 100,000,000)
  const btcValue = satoshis / 100000000;
  
  // Keep only 8 decimal places
  const fixedValue = btcValue.toFixed(8);
  
  // Remove trailing zeros
  const trimmedValue = parseFloat(fixedValue).toString();
  
  // Add ₿ symbol
  return `₿${trimmedValue}`;
}

/**
 * Formats rupee values for display
 * @param value - Raw rupee value
 * @returns Formatted rupee string with ₹ symbol and Indian locale formatting
 */
export function formatRupeesForDisplay(value: number): string {
  if (value === 0) {
    return '₹0';
  }
  
  // Round to remove decimals
  const roundedValue = Math.round(value);
  
  // Format with Indian locale
  const formattedValue = roundedValue.toLocaleString('en-IN');
  
  // Add ₹ symbol
  return `₹${formattedValue}`;
}
