/**
 * Módulo: ChunkCache
 * Categoría: processing
 * Sistema de caché con IndexedDB para chunks procesados
 */

import { DebugLogger } from '../ui/debug_logger.js';

const ChunkCache = {
        db: null,
        disabled: false,
        dbName: 'FlashgenCache',
        storeName: 'chunks',
        async init() {
            if (this.disabled || typeof indexedDB === 'undefined') {
                this.disabled = true;
                return null;
            }
            if (this.db) return this.db;
            return new Promise((resolve) => {
                const request = indexedDB.open(this.dbName, 1);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                        store.createIndex('templateId', 'templateId', { unique: false });
                    }
                };
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };
                request.onerror = () => {
                    this.disabled = true;
                    DebugLogger.log(`❌ IndexedDB no disponible: ${request.error?.message}`, 'error');
                    resolve(null);
                };
            });
        },
        buildKey(hash, templateId) {
            return `${hash}:${templateId || 'default'}`;
        },
        async hashText(text) {
            try {
                if (!crypto?.subtle) return text;
                const data = new TextEncoder().encode(text);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (error) {
                DebugLogger.log(`⚠️ No se pudo generar hash: ${error.message}`, 'warning');
                return text;
            }
        },
        async get(hash, templateId) {
            if (this.disabled) return null;
            const db = await this.init();
            if (!db) return null;
            const key = this.buildKey(hash, templateId);
            return new Promise((resolve) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => resolve(null);
            });
        },
        async set(entry) {
            if (this.disabled) return;
            const db = await this.init();
            if (!db) return;
            return new Promise((resolve) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.put(entry);
                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    DebugLogger.log(`⚠️ No se pudo guardar en caché: ${request.error?.message}`, 'warning');
                    resolve(false);
                };
            });
        }
    };

// Exports
export { ChunkCache };
export default ChunkCache;
