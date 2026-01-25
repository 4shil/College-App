/**
 * Query utility functions for database operations
 * Provides timeout handling, pagination, and common query patterns
 */

import { logger } from './logger';

/**
 * Default query timeout in milliseconds (10 seconds)
 */
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Default pagination limit
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Maximum allowed page size to prevent memory issues
 */
export const MAX_PAGE_SIZE = 500;

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message
 * @returns Promise that rejects if timeout is reached
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  errorMessage: string = 'Query timeout'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${errorMessage} (${timeoutMs}ms)`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Calculate pagination parameters
 * @param options - Pagination options
 * @returns Normalized pagination parameters
 */
export function getPaginationParams(options: PaginationOptions = {}) {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(
    Math.max(1, options.pageSize || DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );
  const offset = options.offset !== undefined ? options.offset : (page - 1) * pageSize;
  const limit = options.limit !== undefined ? options.limit : pageSize;

  return {
    page,
    pageSize,
    offset,
    limit,
  };
}

/**
 * Creates a paginated response object
 * @param data - Array of data items
 * @param total - Total count of items
 * @param page - Current page number
 * @param pageSize - Items per page
 * @returns Paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return {
    data,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

/**
 * Retry a failed query with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelayMs - Initial delay in milliseconds
 * @returns Promise with the result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        logger.warn(`Query failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  logger.error(`Query failed after ${maxRetries + 1} attempts`, lastError);
  throw lastError;
}

/**
 * Batch process items in chunks
 * @param items - Array of items to process
 * @param batchSize - Number of items per batch
 * @param processFn - Function to process each batch
 * @returns Array of all results
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processFn: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processFn(batch);
    results.push(...batchResults);
  }
  
  return results;
}
