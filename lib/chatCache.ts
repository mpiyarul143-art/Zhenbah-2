import type { ChatMessage } from './types';

// Define types for cache key components and a generic cached value type
type CacheKeyComponents = {
  model: string; // This will be model.slug
  messages: ChatMessage[];
  imageDataUrl?: string;
  provider: string; // This will be model.provider
};

// Use a type similar to what extractText in chatActions works with, or keep it generic
type CachedResponse = {
  text?: string;
  error?: string;
  // Can include other fields like code, provider, tokens if needed for display
  [key: string]: unknown; // Allow other properties
} | unknown;

// Simple in-memory cache
const chatResponseCache = new Map<string, CachedResponse>();

/**
 * A simple hash function for strings. Not cryptographically secure but sufficient for cache keys.
 * @param str The input string.
 * @returns A hash number.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Generates a unique cache key based on the request parameters.
 * @param components The key components: model slug, messages, imageDataUrl, provider.
 * @returns A string hash representing the cache key.
 */
export function generateCacheKey(components: CacheKeyComponents): string {
  // Normalize data for consistent hashing
  // Sort message keys to ensure order doesn't affect the hash if object key order varies
  const normalizedMessages = components.messages.map(msg => {
    return {
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      // ts (timestamp) should probably be excluded from the key if we want caching to be effective
      // across different times for the "same" logical request. User ts for model response might be included if relevant.
      // modelId is handled by the `model` parameter.
    };
  });

  // Create a stable object for hashing
  // Exclude things that shouldn't affect cache, like timestamps
  const keyData = {
    model: components.model,
    messages: normalizedMessages, // This is now normalized
    imageDataUrl: components.imageDataUrl || null, // Normalize undefined to null
    provider: components.provider,
  };

  // Stringify the object. JSON.stringify with sorted keys can help ensure consistency.
  const rawKey = JSON.stringify(keyData);
  // Generate a simple hash and convert it to a hex string for the key
  const hash = simpleHash(rawKey);
  return `cache_${Math.abs(hash).toString(16)}`; // Prefix to make it clearly a cache key
}

/**
 * Retrieves a cached response for a given key.
 * @param key The cache key.
 * @returns The cached response, or undefined if not found.
 */
export function getFromCache(key: string): CachedResponse | undefined {
  return chatResponseCache.get(key);
}

/**
 * Stores a response in the cache.
 * @param key The cache key.
 * @param response The response to cache. It's stored "as is".
 * @param ttlMs Optional Time-To-Live in milliseconds. If provided, the entry will be automatically removed after this time.
 */
export function setToCache(key: string, response: CachedResponse, ttlMs?: number): void {
  chatResponseCache.set(key, response);

  // Implement TTL if specified
  if (ttlMs && ttlMs > 0) {
    setTimeout(() => {
      chatResponseCache.delete(key);
    }, ttlMs);
  }
}