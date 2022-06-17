//import * as zip from '@zip.js/zip.js';
import * as zip from 'zip.js-myh';

const cbetardb = 'cbetardb';
// Increase this if a new store is added.
const version = 1;
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
      db.createObjectStore(dataStore);
      db.createObjectStore(fontStore);
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

async function saveZippedFile(fileName: string, data: Uint8Array) {
  /*const zip = new AdmZip();
  zip.addFile('file', data);
  return saveFile(fileName, zip.toBuffer());*/

  const zipFile = new zip.ZipWriter(new zip.Uint8ArrayWriter());
  await zipFile.add('file', new zip.Uint8ArrayReader(data));
  return saveFile(fileName, await zipFile.close());
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

async function getZippedFile(fileName: string) {
  const data = await getFile<Uint8Array>(fileName);
  const entry = (await new zip.ZipReader(new zip.Uint8ArrayReader(data)).getEntries())[0];
  return entry.getData!(new zip.Uint8ArrayWriter());
}

async function fileFilterAndZipper(entryName: string, data: Uint8Array, extensionToZip: string[] = ['txt', 'xml', 'xhtml', 'html', 'json', 'xsl',]) {
  const fileExt = entryName.split('.').pop()?.toLowerCase();
  if (extensionToZip.some(ext => { return fileExt === ext })) {
    await saveZippedFile(entryName, data);
  } else {
    await saveFile(entryName, data);
  }
}

function fileNameFilter(fileName: string, filter: RegExp[] = []) {
  return filter.length === 0 || filter.some((regExp) => { return regExp.test(fileName); });
}

async function extractZipToZips(file: File | Blob, filter: RegExp[] = [], extensionToZip: string[] | undefined = undefined, progressCallback: Function | null = null) {
  const zipReader = new zip.ZipReader(new zip.BlobReader(file));
  let finishCount = 0;
  const iter = zipReader.getEntriesGenerator();
  let curr = iter.next();
  // filesLength is initialized after the first yield.
  await curr;
  const filesLength = zipReader.filesLength || 0;
  while (!(await curr).done) {
    const zipEntry = ((await curr).value) as zip.Entry;
    const entryName = '/' + zipEntry.filename;
    if (!zipEntry.directory && fileNameFilter(entryName, filter)) {
      const data = await zipEntry.getData!(new zip.Uint8ArrayWriter());
      await fileFilterAndZipper(entryName, data, extensionToZip);
      progressCallback && progressCallback(finishCount / filesLength);
    }
    finishCount += 1;
    curr = iter.next();
  }
}

let fileHandles: [string, FileSystemFileHandle][] = [];
async function getDirHandleAllFiles(dirHandle: FileSystemDirectoryHandle, parentPath: string = '') {
  const currentPath = `${parentPath}/${dirHandle.name}`;
  for await (const [key, value] of (dirHandle as any).entries()) {
    if (value instanceof FileSystemFileHandle) {
      fileHandles.push([`${currentPath}/${key}`, value]);
    } else {
      await getDirHandleAllFiles(value, currentPath);
    }
  }
  return;
}

// Load one folder to multiple zips and save to IndexedDB.
// Empty filter loads all files.
async function loadFolderToZips(dirHandle: FileSystemDirectoryHandle, filter: RegExp[] = [], extensionToZip: string[] | undefined = undefined, progressCallback: Function | null = null) {
  let finishCount = 0;
  fileHandles = [];
  await getDirHandleAllFiles(dirHandle);
  for (let i = 0; i < fileHandles.length; i++) {
    const [key, fileHandle] = fileHandles[i];
    if (fileNameFilter(key, filter)) {
      const file = await fileHandle.getFile();
      const data = await file.arrayBuffer();
      await fileFilterAndZipper(key, new Uint8Array(data), extensionToZip);
    }
    finishCount += 1;
    progressCallback && progressCallback(finishCount / fileHandles.length);
  }
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
  saveZippedFile,
  extractZipToZips,
  loadFolderToZips,
  removeFile,
  getFile,
  getZippedFile,
  checkKey,
}

export default IndexedDbFuncs;
