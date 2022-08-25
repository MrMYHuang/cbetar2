//import * as zip from '@zip.js/zip.js';
import * as zip from 'zip.js-myh';
import IndexedDbFuncs from './IndexedDbFuncs';

async function saveZippedFile(fileName: string, data: Uint8Array) {
  const zipFile = new zip.ZipWriter(new zip.Uint8ArrayWriter());
  await zipFile.add('file', new zip.Uint8ArrayReader(data));
  return IndexedDbFuncs.saveFile(fileName, await zipFile.close());
}

async function getZippedFile(fileName: string) {
  const data = await IndexedDbFuncs.getFile<Uint8Array>(fileName);
  const entry = (await new zip.ZipReader(new zip.Uint8ArrayReader(data)).getEntries())[0];
  return entry.getData!(new zip.Uint8ArrayWriter());
}

async function fileFilterAndZipper(entryName: string, data: Uint8Array, extensionToZip: string[] = ['txt', 'xml', 'xhtml', 'html', 'json', 'xsl',]) {
  const fileExt = entryName.split('.').pop()?.toLowerCase();
  if (extensionToZip.some(ext => { return fileExt === ext })) {
    await saveZippedFile(entryName, data);
  } else {
    await IndexedDbFuncs.saveFile(entryName, data);
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

const IndexedDbZipFuncs = {
  saveZippedFile,
  extractZipToZips,
  loadFolderToZips,
  getZippedFile,
}

export default IndexedDbZipFuncs;
