import AdmZip from 'adm-zip';

const cbetardb = 'cbetardb';

async function saveFile(fileName: string, data: any) {
  const dbOpenReq = indexedDB.open(cbetardb);
  return new Promise<void>((ok, fail) => {
    dbOpenReq.onsuccess = async (ev: Event) => {
      const db = dbOpenReq.result;

      const transWrite = db.transaction(["store"], 'readwrite')
      const reqWrite = transWrite.objectStore('store').put(data, fileName);
      reqWrite.onsuccess = (_ev: any) => ok();
      reqWrite.onerror = (_ev: Event) => fail(`File ${fileName} saving failed: ${(_ev.target as any).error}`);
    };
  });
}

async function saveZippedFile(fileName: string, data: any) {
  const zip = new AdmZip();
  zip.addFile('file', data);
  return saveFile(fileName, zip.toBuffer());
}

async function removeFile(fileName: string) {
  const dbOpenReq = indexedDB.open(cbetardb);
  return new Promise<void>((ok, fail) => {
    try {
      dbOpenReq.onsuccess = (ev: Event) => {
        const db = dbOpenReq.result;

        const transWrite = db.transaction(["store"], 'readwrite')
        try {
          const reqWrite = transWrite.objectStore('store').delete(fileName);
          reqWrite.onsuccess = (_ev: any) => ok();
          reqWrite.onerror = (_ev: any) => fail(`File ${fileName} removing failed: ${(_ev.target as any).error}`);
        } catch (err) {
          console.error(err);
        }
      };
    } catch (err) {
      fail(err);
    }
  });
}

async function clear() {
  const dbOpenReq = indexedDB.open(cbetardb);
  return new Promise<void>((ok, fail) => {
    dbOpenReq.onsuccess = async (ev: Event) => {
      const db = dbOpenReq.result;

      const transWrite = db.transaction(["store"], 'readwrite')
      const reqWrite = transWrite.objectStore('store').clear();
      reqWrite.onsuccess = (_ev: any) => ok();
      reqWrite.onerror = (_ev: any) => fail(`Clear IndexedDB failed: ${(_ev.target as any).error}`);
    };
  });
}

async function checkKey(key: string) {
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

async function getFile<T>(fileName: string): Promise<T> {
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
        return ok(data as T);
      };
    };
  });
}

async function getZippedFile(fileName: string) {
  const data = await getFile<Uint8Array>(fileName);
  return new AdmZip(Buffer.from(data)).getEntries()[0].getData();
}

// Extract one zip to multiple zips and save to IndexedDB.
// Empty filter loads all files.
async function extractZipToZips(file: File | ArrayBuffer, filter: RegExp[] = [], extensionToZip: string[] = ['txt', 'xml', 'xhtml', 'html', 'json', 'xsl',], progressCallback: Function | null = null) {
  const isFile = file instanceof File;

  let zip = new AdmZip(Buffer.from(isFile ? (await file.arrayBuffer()) : file));
  const zipEntries = zip.getEntries();
  let finishCount = 0;
  for (let i = 0; i < zipEntries.length; i++) {
    let zipEntry = zipEntries[i];
    if (!zipEntry.isDirectory) {
      const entryName = zipEntry.entryName;
      if (filter.length === 0 || filter.some((regExp) => { return regExp.test(entryName); })) {
        const fileExt = entryName.split('.').pop()?.toLowerCase();
        if (extensionToZip.some(ext => { return fileExt === ext })) {
          await saveZippedFile(entryName, zipEntry.getData());
        } else {
          await saveFile(entryName, zipEntry.getData());
        }
      }
      finishCount += 1;
      progressCallback && progressCallback(finishCount / zipEntries.length);
    }
  }
}

const IndexedDbFuncs = {
  cbetardb,
  saveFile,
  saveZippedFile,
  extractZipToZips,
  removeFile,
  getFile,
  getZippedFile,
  checkKey,
  clear,
}

export default IndexedDbFuncs;
