const DB_NAME = 'dicoding-story-db';
const DB_VERSION = 1;
const STORE_NAME = 'saved-stories';

/**
 * IdbRepository — bagian dari layer Model.
 * Membungkus IndexedDB native untuk fitur "Story Tersimpan": pengguna dapat
 * menyimpan story pilihan dari Story API agar tetap bisa dibaca/dihapus
 * secara lokal (Kriteria 4 — Basic: create, read, delete).
 */

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Peramban ini tidak mendukung IndexedDB.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = () => reject(request.error);
  });
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const IdbRepository = {
  async saveStory(story) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(story);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllStories() {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const stories = await promisifyRequest(tx.objectStore(STORE_NAME).getAll());
    return stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getStoryById(id) {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    return promisifyRequest(tx.objectStore(STORE_NAME).get(id));
  },

  async isStorySaved(id) {
    const story = await this.getStoryById(id);
    return Boolean(story);
  },

  async deleteStory(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },
};

export default IdbRepository;
