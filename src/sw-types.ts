// Service Worker Type Definitions
// TypeScript interfaces and types for the Service Worker

export interface CacheConfig {
  name: string;
  version: string;
  ttl: number;
}

export interface QueuedAction {
  id: string;
  type: 'ADD_TO_WATCHLIST' | 'UPDATE_WATCHLIST' | 'DELETE_FROM_WATCHLIST';
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

export interface CacheStatus {
  cacheNames: string[];
  totalSize: number;
  lastUpdated: number;
}

export interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'QUEUE_ACTION' | 'GET_CACHE_STATUS' | 'BACKGROUND_SYNC_COMPLETE';
  payload?: any;
}

export interface CacheStrategy {
  name: string;
  handler: (request: Request) => Promise<Response>;
}

export type CacheStrategyType = 'cache-first' | 'network-first' | 'network-only' | 'cache-only';
