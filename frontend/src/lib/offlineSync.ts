/**
 * T019: Offline caching layer (PWA Service Worker + IndexedDB) for offline queue viewing
 * and queued form submissions.
 * 
 * We use IndexedDB to store the queue data for offline viewing, and a separate store
 * to queue up POST mutation requests when the inspector has no cell service.
 */

const DB_NAME = 'rr-intelligence-offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'daily_queue';
const OUTCOME_STORE = 'pending_outcomes';

export async function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        // Only run on client
        if (typeof window === 'undefined') return reject("Not in browser");

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject("Failed to open IndexedDB");

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(QUEUE_STORE)) {
                db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(OUTCOME_STORE)) {
                // Auto-increment for pending background sync requests
                db.createObjectStore(OUTCOME_STORE, { keyPath: 'sync_id', autoIncrement: true });
            }
        };

        request.onsuccess = (event: Event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };
    });
}

/** 
 * Cache the daily queue for offline viewing 
 */
export async function cacheQueueOffline(queueData: any[]) {
    try {
        const db = await initDB();
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);

        // Clear old queue and replace with fresh data
        store.clear();
        queueData.forEach(item => {
            store.put(item);
        });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.error("Offline caching failed", err);
    }
}

/** 
 * Retrieve cached queue if network fails 
 */
export async function getCachedQueue(): Promise<any[]> {
    try {
        const db = await initDB();
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error("Failed reading offline cache", err);
        return [];
    }
}

/**
 * Queue an outcome submission if offline
 */
export async function queuePendingOutcome(payload: any) {
    try {
        const db = await initDB();
        const tx = db.transaction(OUTCOME_STORE, 'readwrite');
        const store = tx.objectStore(OUTCOME_STORE);

        store.add({
            ...payload,
            timestamp: new Date().toISOString()
        });

        // If we support Background Sync API, register it
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const sw = await navigator.serviceWorker.ready;
            // @ts-ignore
            await sw.sync.register('sync-outcomes');
        }
    } catch (err) {
        console.error("Failed queuing outcome", err);
    }
}
