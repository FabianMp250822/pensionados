// services/indexedDBService.js
import { openDB } from 'idb';

const DB_NAME = 'PagosEspecificosDB';
const STORE_NAME = 'pagosEspecificos';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const guardarEnIndexedDB = async (data) => {
  const db = await initDB();
  await db.put(STORE_NAME, data);
};

export const obtenerDesdeIndexedDB = async () => {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
};

export const limpiarIndexedDB = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
};
