/**
 * Network utility functions
 * Provides offline detection and network status monitoring
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Network from 'expo-network';
import { logger } from './logger';

/**
 * Network connection type
 */
export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

/**
 * Network status
 */
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: ConnectionType;
}

/**
 * Hook to monitor network status
 * @returns Current network status
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  const checkNetwork = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const newStatus: NetworkStatus = {
        isConnected: networkState.isConnected ?? false,
        isInternetReachable: networkState.isInternetReachable ?? false,
        type: mapConnectionType(networkState.type),
      };
      
      setStatus(newStatus);
      return newStatus;
    } catch (error) {
      logger.error('Error checking network status:', error);
      return status;
    }
  }, []);

  useEffect(() => {
    // Get initial state
    checkNetwork();

    // Poll for network changes (expo-network doesn't have a listener)
    const interval = setInterval(checkNetwork, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [checkNetwork]);

  return status;
}

/**
 * Hook to check if device is online
 * @returns Boolean indicating online status
 */
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  return isConnected && isInternetReachable;
}

/**
 * Hook to check if device is offline
 * @returns Boolean indicating offline status
 */
export function useIsOffline(): boolean {
  return !useIsOnline();
}

/**
 * Check current network status (one-time check)
 * @returns Promise with current network status
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    
    return {
      isConnected: networkState.isConnected ?? false,
      isInternetReachable: networkState.isInternetReachable ?? false,
      type: mapConnectionType(networkState.type),
    };
  } catch (error) {
    logger.error('Error getting network status:', error);
    return {
      isConnected: true, // Assume connected on error
      isInternetReachable: true,
      type: 'unknown',
    };
  }
}

/**
 * Check if device is currently online (one-time check)
 * @returns Promise with boolean indicating online status
 */
export async function isOnline(): Promise<boolean> {
  const status = await getNetworkStatus();
  return status.isConnected && status.isInternetReachable;
}

/**
 * Wait for network connection to be available
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @returns Promise that resolves when online or rejects on timeout
 */
export function waitForConnection(timeoutMs: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };

    // Set timeout
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Network connection timeout'));
    }, timeoutMs);

    // Check immediately
    isOnline().then(online => {
      if (online) {
        cleanup();
        resolve();
        return;
      }

      // Poll for connection
      intervalId = setInterval(async () => {
        const online = await isOnline();
        if (online) {
          cleanup();
          resolve();
        }
      }, 2000);
    });
  });
}

/**
 * Retry a network operation with exponential backoff
 * @param operation - Async operation to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelayMs - Initial delay before first retry
 * @returns Promise with operation result
 */
export async function retryOnOffline<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if online before attempting
      const online = await isOnline();
      if (!online && attempt < maxRetries) {
        logger.warn(`Device offline, waiting for connection (attempt ${attempt + 1}/${maxRetries + 1})...`);
        await waitForConnection(10000).catch(() => {
          // Timeout is acceptable, will retry
        });
        continue;
      }

      return await operation();
    } catch (error) {
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        logger.warn(`Operation failed, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Map network type to simplified type
 */
function mapConnectionType(type: Network.NetworkStateType | undefined): ConnectionType {
  if (!type) return 'unknown';
  
  switch (type) {
    case Network.NetworkStateType.WIFI:
      return 'wifi';
    case Network.NetworkStateType.CELLULAR:
      return 'cellular';
    case Network.NetworkStateType.NONE:
      return 'none';
    default:
      return 'unknown';
  }
}

/**
 * Show offline warning message
 * @returns User-friendly offline message
 */
export function getOfflineMessage(): string {
  return 'You are currently offline. Some features may not be available.';
}

/**
 * Show connection restored message
 * @returns User-friendly connection restored message
 */
export function getOnlineMessage(): string {
  return 'Connection restored. You are back online.';
}
