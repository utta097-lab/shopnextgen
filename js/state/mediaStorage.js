/**
 * SHOPNEX Media Storage System
 * Native IndexedDB binary storage for persistent Audio, Video, and Image files.
 * Provides real file storage in browser without size limits.
 */

const DB_NAME = 'ShopnexMediaStorage_v1';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

class MediaStorage {
  constructor() {
    this.db = null;
    this.objectUrls = new Map();
    this.initPromise = this.init();
  }

  async init() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported in this environment');
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB open error:', e);
        resolve(null);
      };
    });
  }

  /**
   * Save a File or Blob to IndexedDB
   * @param {string} key Unique identifier e.g. "audio_product-002"
   * @param {File|Blob} file The audio/media file
   * @param {object} meta Additional metadata (name, type, size)
   */
  /**
   * Save a File or Blob to IndexedDB
   * @param {string} key Unique identifier e.g. "audio_product-002"
   * @param {File|Blob} file The audio/media file
   * @param {object} meta Additional metadata (name, type, size)
   */
  async saveFile(key, file, meta = {}) {
    await this.initPromise;
    if (!this.db) {
      // Fallback to Data URL if IndexedDB is unavailable
      return this.fileToDataUrl(file);
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        key,
        blob: file,
        name: file.name || meta.name || 'audio-track',
        type: file.type || meta.type || 'audio/mpeg',
        size: file.size || meta.size || 0,
        updatedAt: Date.now()
      };

      const request = store.put(record);

      request.onsuccess = () => {
        // Cache active session object URL
        if (this.objectUrls.has(key)) {
          URL.revokeObjectURL(this.objectUrls.get(key));
        }
        const objUrl = URL.createObjectURL(file);
        this.objectUrls.set(key, objUrl);

        // Return persistent indexeddb reference so it never goes stale across reloads
        resolve(`indexeddb://${key}`);
      };

      request.onerror = (err) => {
        console.error('Error storing file in IndexedDB:', err);
        // Fallback to Data URL
        this.fileToDataUrl(file).then(resolve).catch(reject);
      };
    });
  }

  /**
   * Retrieve a file URL by key (creates a fresh session blob URL if needed)
   */
  async getFileUrl(key) {
    if (this.objectUrls.has(key)) {
      return this.objectUrls.get(key);
    }

    await this.initPromise;
    if (!this.db) return null;

    return new Promise((resolve) => {
      const tx = this.db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const cleanKey = key.replace('indexeddb://', '');
      const request = store.get(cleanKey);

      request.onsuccess = () => {
        const record = request.result;
        if (record && record.blob) {
          const objUrl = URL.createObjectURL(record.blob);
          this.objectUrls.set(cleanKey, objUrl);
          this.objectUrls.set(key, objUrl);
          resolve(objUrl);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  /**
   * Convert file to Data URL
   */
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Resolves audio URL whether it's an IndexedDB key, a Data URL, or a relative file path
   * Safely handles expired blob: URLs from previous sessions by re-reading IndexedDB
   */
  async resolveAudioUrl(audioPathOrKey, fallbackKey = null) {
    if (!audioPathOrKey) return null;

    // 1. If it's a persistent indexeddb reference
    if (audioPathOrKey.startsWith('indexeddb://') || audioPathOrKey.startsWith('audio_')) {
      const cleanKey = audioPathOrKey.replace('indexeddb://', '');
      const fromDb = await this.getFileUrl(cleanKey);
      if (fromDb) return fromDb;
    }

    // 2. If it's an inline Data URL, HTTP URL, or project file path
    if (audioPathOrKey.startsWith('data:') || audioPathOrKey.startsWith('http://') || audioPathOrKey.startsWith('https://') || audioPathOrKey.startsWith('products/')) {
      return audioPathOrKey;
    }

    // 3. If it's a blob: URL, verify if it's currently valid or re-fetch from IndexedDB
    if (audioPathOrKey.startsWith('blob:')) {
      if (fallbackKey) {
        const fromDb = await this.getFileUrl(fallbackKey);
        if (fromDb) return fromDb;
      }
      return audioPathOrKey;
    }

    // 4. General key lookup
    const fromDb = await this.getFileUrl(audioPathOrKey);
    return fromDb || audioPathOrKey;
  }
}

export const mediaStorage = new MediaStorage();
