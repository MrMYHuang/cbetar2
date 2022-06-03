const cbetardb = 'cbetardb';

async function saveFileToIndexedDB(fileName: string, data: any) {
    const dbOpenReq = indexedDB.open(cbetardb);
    return new Promise<void>((ok, fail) => {
      dbOpenReq.onsuccess = async (ev: Event) => {
        const db = dbOpenReq.result;
  
        const transWrite = db.transaction(["store"], 'readwrite')
        const reqWrite = transWrite.objectStore('store').put(data, fileName);
        reqWrite.onsuccess = (_ev: any) => ok();
        reqWrite.onerror = (_ev: any) => fail();
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
            reqWrite.onerror = (_ev: any) => fail();
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
        reqWrite.onerror = (_ev: any) => fail();
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
            return fail();
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
            return fail();
          }
          return ok(data);
        };
      };
    });
  }

  const IndexedDbFuncs = {
    cbetardb,
    saveFileToIndexedDB,
    removeFileFromIndexedDB,
    getFileFromIndexedDB,
    checkKeyInIndexedDB,
    clearIndexedDB,
  }

  export default IndexedDbFuncs;
