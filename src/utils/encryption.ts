/**
 * Simple encryption/decryption utilities for client-side data
 * 
 * Note: This is NOT secure for truly sensitive data as the encryption key is in the client code.
 * It only provides obfuscation to prevent casual viewing of the data in localStorage.
 * For truly secure storage, a backend service with proper authentication should be used.
 */

// A simple encryption key - in a real app, this would be more secure and not in the source code
const ENCRYPTION_KEY = 'tagPromptBuilderSecureKey2023';

/**
 * Encrypt a string using a simple XOR cipher with Base64 encoding
 */
export function encrypt(text: string): string {
  try {
    // Simple XOR encryption
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    
    // Convert to Base64 for safe storage
    return btoa(result);
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

/**
 * Decrypt a string that was encrypted with the encrypt function
 */
export function decrypt(encryptedText: string): string {
  try {
    // Decode from Base64
    const base64Decoded = atob(encryptedText);
    
    // Reverse the XOR encryption
    let result = '';
    for (let i = 0; i < base64Decoded.length; i++) {
      const charCode = base64Decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}