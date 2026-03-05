/**
 * Simple encryption utilities using base64 encoding
 * Note: For production, use Web Crypto API with AES-GCM
 * @module encryption
 */

/**
 * Encrypts data using base64 encoding with a simple XOR cipher
 * @param {*} data - Data to encrypt (will be JSON stringified)
 * @param {string} key - Encryption key
 * @returns {string} Encrypted base64 string
 */
export function encryptData(data, key) {
  try {
    const jsonStr = JSON.stringify(data);
    const keyBytes = [...key].map(c => c.charCodeAt(0));
    const xored = [...jsonStr].map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ keyBytes[i % keyBytes.length])
    ).join('');
    // Encode UTF-8 bytes to base64 via TextEncoder to avoid deprecated unescape()
    const bytes = new TextEncoder().encode(xored);
    return btoa(String.fromCharCode(...bytes));
  } catch (err) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

/**
 * Decrypts data previously encrypted with encryptData
 * @param {string} encryptedData - Base64 encrypted string
 * @param {string} key - Decryption key
 * @returns {*} Decrypted and parsed data
 */
export function decryptData(encryptedData, key) {
  try {
    // Decode base64 back to UTF-8 string via TextDecoder to avoid deprecated escape()
    const bytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const xored = new TextDecoder().decode(bytes);
    const keyBytes = [...key].map(c => c.charCodeAt(0));
    const decrypted = [...xored].map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ keyBytes[i % keyBytes.length])
    ).join('');
    return JSON.parse(decrypted);
  } catch (err) {
    throw new Error(`Decryption failed: ${err.message}`);
  }
}

/**
 * Creates a simple hash of data using the djb2 algorithm (hash * 33 + c)
 * @param {*} data - Data to hash
 * @returns {string} Hex hash string
 */
export function hashData(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash >>> 0; // Convert to unsigned 32-bit int
  }
  return hash.toString(16).padStart(8, '0');
}
