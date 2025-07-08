// Service Worker Registration and Management
// TypeScript utility for registering and managing the Service Worker

import { addToQueue, processOfflineQueue, type QueuedAction } from './offlineQueue';

interface ServiceWorkerManager {
  register: () => Promise<ServiceWorkerRegistration | null>;
  unregister: () => Promise<boolean>;
  isSupported: () => boolean;
  isOnline: () => boolean;
  queueAction: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  onOnlineStatusChange: (callback: (isOnline: boolean) => void) => () => void;
}

class ServiceWorkerManagerImpl implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private onlineCallbacks: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    // Listen for online/offline events
    if (this.isSupported()) {
      window.addEventListener('online', () => this.notifyOnlineStatus(true));
      window.addEventListener('offline', () => this.notifyOnlineStatus(false));
    }
  }

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'caches' in window
    );
  }

  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.log('Service Worker: Not supported in this browser');
      return null;
    }

    // Don't register in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SW_DEV) {
      console.log('Service Worker: Disabled in development');
      return null;
    }

    try {
      console.log('Service Worker: Registering...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('Service Worker: Registered successfully', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          console.log('Service Worker: New version found, installing...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Service Worker: New version ready');
              // Notify user about update (could show a toast)
              this.notifyUpdate();
            }
          });
        }
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Service Worker: Message received:', event.data);
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker: Registration failed:', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker: Unregistered:', result);
      this.registration = null;
      return result;
    } catch (error) {
      console.error('Service Worker: Unregistration failed:', error);
      return false;
    }
  }

  async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.isSupported()) {
      console.log('Service Worker: Queuing not supported');
      return;
    }

    try {
      // Store in IndexedDB for persistence
      await addToQueue(action);
      
      // Try to register for background sync if supported
      if (this.registration && 'serviceWorker' in navigator) {
        try {
          // Check if background sync is supported
          if ('sync' in (window as any).ServiceWorkerRegistration.prototype) {
            await (this.registration as any).sync.register('background-sync-watchlist');
            console.log('Service Worker: Background sync registered');
          }
        } catch (syncError) {
          console.log('Service Worker: Background sync not supported:', syncError);
        }
      }
      
      // Also send message to SW
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'QUEUE_ACTION',
          payload: action
        });
      }
    } catch (error) {
      console.error('Service Worker: Failed to queue action:', error);
    }
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.onlineCallbacks.add(callback);
    
    // Return cleanup function
    return () => {
      this.onlineCallbacks.delete(callback);
    };
  }

  private notifyOnlineStatus(isOnline: boolean): void {
    console.log('Service Worker: Online status changed:', isOnline);
    this.onlineCallbacks.forEach(callback => callback(isOnline));
  }

  private notifyUpdate(): void {
    // This could trigger a toast notification
    console.log('Service Worker: App update available');
    
    // Auto-update after a delay (optional)
    setTimeout(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }, 1000);
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManagerImpl();

// Helper functions for easy use
export const registerServiceWorker = () => serviceWorkerManager.register();
export const unregisterServiceWorker = () => serviceWorkerManager.unregister();
export const isServiceWorkerSupported = () => serviceWorkerManager.isSupported();
export const isOnline = () => serviceWorkerManager.isOnline();
export const queueOfflineAction = (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => 
  serviceWorkerManager.queueAction(action);
export const onOnlineStatusChange = (callback: (isOnline: boolean) => void) => 
  serviceWorkerManager.onOnlineStatusChange(callback);

// Process offline actions when coming back online
export const handleOfflineActions = async (): Promise<void> => {
  if (navigator.onLine) {
    console.log('Processing offline actions...');
    try {
      await processOfflineQueue();
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }
};

export default serviceWorkerManager;
