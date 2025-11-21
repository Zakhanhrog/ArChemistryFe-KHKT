import { openDB } from 'idb';

const DB_NAME = 'ar-model-cache';
const DB_VERSION = 1;
const STORE_NAME = 'models';

let dbPromise;

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export const getModelFromDB = async (key) => {
  const db = await getDB();
  return db.get(STORE_NAME, key);
};

export const saveModelToDB = async (key, arrayBuffer) => {
  const db = await getDB();
  return db.put(STORE_NAME, arrayBuffer, key);
};

export const clearModels = async () => {
  const db = await getDB();
  return db.clear(STORE_NAME);
};

