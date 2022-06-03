import * as AdmZip from 'adm-zip';
import Funcs from './Funcs';

const cbetardb = 'cbetardb';

async function saveFileToIndexedDB(fileName: string, data: any) {
  const dbOpenReq = indexedDB.open(cbetardb);
  return new Promise<void>((ok, fail) => {
    dbOpenReq.onsuccess = async (ev: Event) => {
      const db = dbOpenReq.result;

      const transWrite = db.transaction(["store"], 'readwrite')
      const reqWrite = transWrite.objectStore('store').put(data, fileName);
      reqWrite.onsuccess = (_ev: any) => ok();
      reqWrite.onerror = (_ev: any) => fail(`File ${fileName} saving failed.`);
    };
  });
}

async function removeFileFromIndexedDB(fileName: string) {
  const dbOpenReq = indexedDB.open(cbetardb);
  return new Promise<void>((ok, fail) => {
    try {
      dbOpenReq.onsuccess = (ev: Event) => {
        const db = dbOpenReq.result;

        const transWrite = db.transaction(["store"], 'readwrite')
        try {
          const reqWrite = transWrite.objectStore('store').delete(fileName);
          reqWrite.onsuccess = (_ev: any) => ok();
          reqWrite.onerror = (_ev: any) => fail(`File ${fileName} removing failed.`);
        } catch (err) {
          console.error(err);
        }
      };
    } catch (err) {
      fail(err);
    }
  });
}

async function clearIndexedDB() {
  const dbOpenReq = indexedDB.open(cbetardb);
  return new Promise<void>((ok, fail) => {
    dbOpenReq.onsuccess = async (ev: Event) => {
      const db = dbOpenReq.result;

      const transWrite = db.transaction(["store"], 'readwrite')
      const reqWrite = transWrite.objectStore('store').clear();
      reqWrite.onsuccess = (_ev: any) => ok();
      reqWrite.onerror = (_ev: any) => fail(`Clear IndexedDB failed.`);
    };
  });
}

async function checkKeyInIndexedDB(key: string) {
  const dbOpenReq = indexedDB.open(cbetardb);

  return new Promise(function (ok, fail) {
    dbOpenReq.onsuccess = async function (ev) {
      const db = dbOpenReq.result;

      const trans = db.transaction(["store"], 'readonly');
      let req = trans.objectStore('store').getKey(key);
      req.onsuccess = async function (_ev) {
        const data = req.result;
        if (!data) {
          return fail(`Key ${key} not found in IndexedDB`);
        }
        return ok(data);
      };
    };
  });
}

async function getFileFromIndexedDB(fileName: string) {
  const dbOpenReq = indexedDB.open(cbetardb);

  return new Promise(function (ok, fail) {
    dbOpenReq.onsuccess = async function (ev) {
      const db = dbOpenReq.result;

      const trans = db.transaction(["store"], 'readwrite');
      let req = trans.objectStore('store').get(fileName);
      req.onsuccess = async function (_ev) {
        const data = req.result;
        if (!data) {
          return fail(`File ${fileName} not found in IndexedDB.`);
        }
        return ok(data);
      };
    };
  });
}

// Empty filter loads all files.
async function loadZipToIndexedDB(file: File | ArrayBuffer, filter: RegExp[] = [], progressCallback: Function | null = null) {
  let buffer: ArrayBuffer;
  if (file instanceof File) {
    buffer = await file.arrayBuffer();
  } else {
    buffer = file;
  }

  let zip = new AdmZip.default(Funcs.arrayBufferToBuffer(buffer));
  const zipEntries = zip.getEntries();
  let finishCount = 0;
  for (let i = 0; i < zipEntries.length; i++) {
    let zipEntry = zipEntries[i];
    if (!zipEntry.isDirectory) {
      const entryName = zipEntry.entryName;
      if (filter.length === 0 || filter.some((regExp) => { return regExp.test(entryName); })) {
        await saveFileToIndexedDB(entryName, zipEntry.getData());
      }
      finishCount += 1;
      progressCallback && progressCallback(finishCount / zipEntries.length);
    }
  }
}

const IndexedDbFuncs = {
  cbetardb,
  saveFileToIndexedDB,
  loadZipToIndexedDB,
  removeFileFromIndexedDB,
  getFileFromIndexedDB,
  checkKeyInIndexedDB,
  clearIndexedDB,
}

export default IndexedDbFuncs;
