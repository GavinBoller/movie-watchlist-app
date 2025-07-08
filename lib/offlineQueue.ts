// IndexedDB-based offline action queue
// Provides persistent storage for actions that need to be synced when online

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

const DB_NAME = 'MovieWatchlistQueue';
const DB_VERSION = 1;
const STORE_NAME = 'actions';

class OfflineQueueManager {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          console.log('IndexedDB store created');
        }
      };
    });
  }

  async addAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    await this.init();
    
    if (!this.db) {
      throw new Error('IndexedDB not available');
    }

    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(queuedAction);

      request.onsuccess = () => {
        console.log('Action queued:', queuedAction.type, queuedAction.id);
        resolve(queuedAction.id);
      };

      request.onerror = () => {
        console.error('Failed to queue action:', request.error);
        reject(request.error);
      };
    });
  }

  async getActions(): Promise<QueuedAction[]> {
    await this.init();
    
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to get queued actions:', request.error);
        reject(request.error);
      };
    });
  }

  async removeAction(id: string): Promise<void> {
    await this.init();
    
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Action removed from queue:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove action:', request.error);
        reject(request.error);
      };
    });
  }

  async updateAction(action: QueuedAction): Promise<void> {
    await this.init();
    
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(action);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to update action:', request.error);
        reject(request.error);
      };
    });
  }

  async clearActions(): Promise<void> {
    await this.init();
    
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Queue cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear queue:', request.error);
        reject(request.error);
      };
    });
  }

  async processQueue(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Offline - skipping queue processing');
      return;
    }

    const actions = await this.getActions();
    
    if (actions.length === 0) {
      console.log('No actions to process');
      return;
    }

    console.log(`Processing ${actions.length} queued actions`);

    for (const action of actions) {
      try {
        await this.executeAction(action);
        await this.removeAction(action.id);
      } catch (error) {
        console.error('Failed to execute action:', action.id, error);
        
        // Increment retry count
        action.retryCount++;
        
        // Remove action if too many retries
        if (action.retryCount >= 3) {
          console.log('Max retries reached, removing action:', action.id);
          await this.removeAction(action.id);
        } else {
          await this.updateAction(action);
        }
      }
    }
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    const response = await fetch(action.url, {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
        ...action.headers
      },
      body: action.body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('Action executed successfully:', action.type, action.id);
  }
}

// Create singleton instance
const queueManager = new OfflineQueueManager();

// Export helper functions
export const addToQueue = (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => 
  queueManager.addAction(action);

export const processOfflineQueue = () => queueManager.processQueue();

export const clearOfflineQueue = () => queueManager.clearActions();

export const getQueuedActions = () => queueManager.getActions();

export default queueManager;
