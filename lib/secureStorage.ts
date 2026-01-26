/**
 * Secure Storage Adapter
 * 
 * Uses expo-secure-store for sensitive data on native platforms.
 * Falls back to localStorage on web (with warning).
 * 
 * Security: Auth tokens are encrypted using the device's keychain/keystore.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedStorage } from '@supabase/supabase-js';

// Keys that should be stored securely (auth-related)
const SECURE_KEYS = [
  'supabase.auth.token',
  'sb-',  // Supabase session keys start with sb-
];

/**
 * Check if a key should use secure storage
 */
function isSecureKey(key: string): boolean {
  return SECURE_KEYS.some(prefix => key.includes(prefix));
}

/**
 * SecureStore has a 2048 byte limit per key.
 * For large values, we chunk them.
 */
const CHUNK_SIZE = 2000;

async function setSecureItem(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    // Clean up any existing chunks
    await SecureStore.deleteItemAsync(`${key}_chunks`);
  } else {
    // Split into chunks
    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    
    // Store chunk count
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
    
    // Store each chunk
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}_${i}`, chunks[i]);
    }
  }
}

async function getSecureItem(key: string): Promise<string | null> {
  // Check if it's chunked
  const chunksCount = await SecureStore.getItemAsync(`${key}_chunks`);
  
  if (chunksCount) {
    const count = parseInt(chunksCount, 10);
    const chunks = [];
    
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
      if (chunk === null) {
        // Chunk missing, data corrupted
        return null;
      }
      chunks.push(chunk);
    }
    
    return chunks.join('');
  }
  
  // Single value
  return SecureStore.getItemAsync(key);
}

async function removeSecureItem(key: string): Promise<void> {
  // Check if it's chunked
  const chunksCount = await SecureStore.getItemAsync(`${key}_chunks`);
  
  if (chunksCount) {
    const count = parseInt(chunksCount, 10);
    
    // Remove all chunks
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}_${i}`);
    }
    await SecureStore.deleteItemAsync(`${key}_chunks`);
  }
  
  // Remove the main key
  await SecureStore.deleteItemAsync(key);
}

/**
 * Web storage adapter (localStorage)
 * Note: Web localStorage is NOT encrypted, but acceptable for browser context
 */
const webStorage: SupportedStorage = {
  getItem: (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined') {
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

/**
 * Native storage adapter using SecureStore for sensitive data
 * and AsyncStorage for non-sensitive preferences
 */
const nativeSecureStorage: SupportedStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isSecureKey(key)) {
        return await getSecureItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[SecureStorage] Error getting ${key}:`, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isSecureKey(key)) {
        await setSecureItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`[SecureStorage] Error setting ${key}:`, error);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      if (isSecureKey(key)) {
        await removeSecureItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`[SecureStorage] Error removing ${key}:`, error);
    }
  },
};

/**
 * Export the appropriate storage adapter based on platform
 */
export const secureStorage: SupportedStorage = 
  Platform.OS === 'web' ? webStorage : nativeSecureStorage;

/**
 * Utility to migrate existing AsyncStorage auth data to SecureStore
 * Call this once on app upgrade
 */
export async function migrateToSecureStorage(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  try {
    // Get all AsyncStorage keys
    const keys = await AsyncStorage.getAllKeys();
    
    for (const key of keys) {
      if (isSecureKey(key)) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          // Move to SecureStore
          await setSecureItem(key, value);
          // Remove from AsyncStorage
          await AsyncStorage.removeItem(key);
          console.log(`[SecureStorage] Migrated ${key} to secure storage`);
        }
      }
    }
  } catch (error) {
    console.error('[SecureStorage] Migration error:', error);
  }
}
