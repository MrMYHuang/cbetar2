const cbetardb = 'cbetardb';
// Increase this if a new store is added.
const version = 3;
const dataStore = 'store';
// Increase this if font store content is changed.
const twKaiFontVersion = 5;
const fontStore = 'font';
const storeNames = [dataStore, fontStore];
let dbOpenReq: IDBOpenDBRequest;
let db: IDBDatabase;
let dbIsReady = false;

async function ready() {
  if (dbIsReady) {
    return;
  }

  return new Promise<void>(ok => {
    const timer = setInterval(() => {
      if (dbIsReady) {
        clearInterval(timer);
        ok();
      }
    }, 20);
  });
}

async function open() {
  if (dbIsReady) {
    return;
  }

  return new Promise<void>((ok, fail) => {
    dbOpenReq = indexedDB.open(cbetardb, version);

    // Init store in indexedDB if necessary.
    dbOpenReq.onupgradeneeded = async (ev: IDBVersionChangeEvent) => {
      db = (ev.target as any).result as IDBDatabase;

      let objectStore: IDBObjectStore | undefined;
      for (let i = 0; i < storeNames.length; i++) {
        const s = storeNames[i];
        if (db.objectStoreNames.contains(s)) {
          continue;
        }

        objectStore = db.createObjectStore(s);
      }

      await new Promise<void>((ok, fail) => {
        if (!objectStore) {
          ok();
          return;
        }

        objectStore.transaction.oncomplete = () => {
          ok();
        };
        objectStore.transaction.onerror = (ev) => {
          fail(`createObjectStore error: ${(ev.target as any).error}`);
        };
      });

      dbIsReady = true;
      console.log(`IndexedDB upgraded to version: ${version}`);
    };

    dbOpenReq.onsuccess = (ev: Event) => {
      db = (ev.target as any).result as IDBDatabase;
      if (db.version === version) {
        dbIsReady = true;
      }
      ok();
      console.log(`IndexedDB opened successfully.`);
    };

    dbOpenReq.onerror = (ev: Event) => {
      fail('Fail to create IndexedDB.');
    };
  });
}

async function clear() {
  for (let i = 0; i < storeNames.length; i++) {
    await clearStore(storeNames[i]);
  }
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
