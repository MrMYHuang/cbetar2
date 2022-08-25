const cbetardb = 'cbetardb';
// Increase this if a new store is added.
const version = 3;
const dataStore = 'store';
// Increase this if font store content is changed.
const twKaiFontVersion = 5;
const fontStore = 'font';
let dbOpenReq: IDBOpenDBRequest;
let db: IDBDatabase;

async function ready() {
  if (db) {
    return;
  }

  return new Promise<void>(ok => {
    const timer = setInterval(() => {
      if (db) {
        clearInterval(timer);
        ok();
      }
    }, 20);
  });
}

async function open() {
  return new Promise<void>((ok, fail) => {
    dbOpenReq = indexedDB.open(cbetardb, version);
    // Init store in indexedDB if necessary.
    dbOpenReq.onupgradeneeded = function (ev: IDBVersionChangeEvent) {
      db = (ev.target as any).result as IDBDatabase;
      [dataStore, fontStore].forEach((s) => {
        if (!db.objectStoreNames.contains(s)) {
          db.createObjectStore(s);
        }
      });
      ok();
    };
    dbOpenReq.onsuccess = (ev: Event) => {
      db = (ev.target as any).result as IDBDatabase;
      ok();
    }
    dbOpenReq.onerror = (ev: Event) => {
      fail('Fail to create IndexedDB.');
    }
  });
}

async function clear() {
  db.close();
  const dbOpenReq = indexedDB.deleteDatabase(cbetardb);
  return new Promise<void>((ok, fail) => {
    dbOpenReq.onsuccess = async (ev: Event) => {
      try {
        open().then(ok);
      } catch (err) {
        fail(err);
      }
    };
    dbOpenReq.onerror = async (ev: Event) => {
      fail('Fail to delete database.');
    }
  });
}

async function clearStore(store: string) {
  return new Promise<void>((ok, fail) => {
    const transWrite = db.transaction([store], 'readwrite')
    const reqWrite = transWrite.objectStore(store).clear();
    reqWrite.onsuccess = (_ev: any) => ok();
    reqWrite.onerror = (_ev: any) => fail(`Clear IndexedDB failed: ${(_ev.target as any).error}`);
  });
}

async function saveFile(fileName: string, data: any, store: string = dataStore) {
  await ready();

  return new Promise<void>((ok, fail) => {
    try {
      const transWrite = db.transaction([store], 'readwrite')
      const reqWrite = transWrite.objectStore(store).put(data, fileName);
      reqWrite.onsuccess = (_ev: any) => ok();
      reqWrite.onerror = (_ev: Event) => fail(`File ${fileName} saving failed: ${(_ev.target as any).error}`);
    } catch (err) {
      fail(err);
    }
  });
}

async function removeFile(fileName: string, store: string = dataStore) {
  await ready();

  return new Promise<void>((ok, fail) => {
    try {
      const transWrite = db.transaction([store], 'readwrite');
      const reqWrite = transWrite.objectStore(store).delete(fileName);
      reqWrite.onsuccess = (_ev: any) => ok();
      reqWrite.onerror = (_ev: any) => fail(`File ${fileName} removing failed: ${(_ev.target as any).error}`);
    } catch (err) {
      fail(err);
    }
  });
}

async function checkKey(key: string, store: string = dataStore) {
  await ready();

  return new Promise(function (ok, fail) {
    try {
      const trans = db.transaction([store], 'readonly');
      let req = trans.objectStore(store).getKey(key);
      req.onsuccess = async function (_ev) {
        const data = req.result;
        if (!data) {
          return fail(`Key ${key} not found in IndexedDB`);
        }
        return ok(data);
      };
    } catch (err) {
      fail(err);
    }
  });
}

async function getFile<T>(fileName: string, store: string = dataStore): Promise<T> {
  await ready();

  return new Promise(function (ok, fail) {
    try {
      const trans = db.transaction([store], 'readwrite');
      let req = trans.objectStore(store).get(fileName);
      req.onsuccess = async function (_ev) {
        const data = req.result;
        if (!data) {
          return fail(`File ${fileName} not found in IndexedDB.`);
        }
        return ok(data as T);
      };
    } catch (err) {
      fail(err);
    }
  });
}

const IndexedDbFuncs = {
  cbetardb,
  dataStore,
  twKaiFontVersion,
  fontStore,
  open,
  clear,
  clearStore,
  saveFile,
  removeFile,
  getFile,
  checkKey,
}

export default IndexedDbFuncs;
