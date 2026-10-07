/**
 * Browser-local artwork persistence.
 *
 * Story text and small workflow flags fit in localStorage. Full-resolution
 * illustrations do not: a single PNG can exceed localStorage's whole quota.
 * IndexedDB is the browser-native blob store, so it keeps the same local-only
 * privacy boundary while allowing BookStudio to restore files after a reload.
 */

const DATABASE = "qissati-production";
const VERSION = 1;
const STORE = "artwork";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }

    const request = window.indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function result(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const idFor = (reference, key) => `${reference}:${key}`;

export async function loadArtwork(reference) {
  if (!reference) return [];
  let database;
  try {
    database = await openDatabase();
    const transaction = database.transaction(STORE, "readonly");
    const store = transaction.objectStore(STORE);
    const range = window.IDBKeyRange.bound(
      `${reference}:`,
      `${reference}:\uffff`
    );
    return await result(store.getAll(range));
  } catch {
    return [];
  } finally {
    database?.close();
  }
}

export async function saveArtwork(reference, key, file, dimensions = {}) {
  if (!reference || !key || !(file instanceof Blob)) return false;
  let database;
  try {
    database = await openDatabase();
    const transaction = database.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    await result(
      store.put({
        id: idFor(reference, key),
        reference,
        key,
        name: file.name || `${key}.png`,
        type: file.type || "image/png",
        blob: file,
        w: Number(dimensions.w) || 0,
        h: Number(dimensions.h) || 0,
        updatedAt: Date.now(),
      })
    );
    return true;
  } catch {
    return false;
  } finally {
    database?.close();
  }
}

export async function removeArtwork(reference, key) {
  if (!reference || !key) return;
  let database;
  try {
    database = await openDatabase();
    const transaction = database.transaction(STORE, "readwrite");
    await result(transaction.objectStore(STORE).delete(idFor(reference, key)));
  } catch {
    // Clearing the live slot still works when persistent storage is blocked.
  } finally {
    database?.close();
  }
}
