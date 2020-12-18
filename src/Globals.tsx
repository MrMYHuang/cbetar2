import axios from 'axios';
import { isPlatform, IonLabel } from '@ionic/react';
import React from 'react';
import { Work } from './models/Work';
import { Bookmark } from './models/Bookmark';

const apiVersion = 'v1.2';
const cbetaApiUrl = `https://cbdata.dila.edu.tw/${apiVersion}`;
const dilaDictApiUrl = `https://glossaries.dila.edu.tw/search.json`;
const cbetardb = 'cbetardb';
const twKaiFontKey = 'twKaoFont';
/* Font source: https://data.gov.tw/dataset/5961 */
const twKaiFontPath = '/assets/TW-Kai-98_1.woff';
let log = '';

const axiosInstance = axios.create({
  baseURL: cbetaApiUrl,
  timeout: 3000,
});

function scrollbarSizeIdToValue(id: number) {
  switch (id) {
    case 0: return 0;
    case 1: return 20;
    case 2: return 40;
  }
}

function getFileName(work: string, juan: string) {
  return `${work}_juan${juan}.html`;
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
          console.error(`${fileName} loading failed!`);
          console.error(new Error().stack);
          return fail();
        }
        return ok(data);
      };
    };
  });
}

async function saveFileToIndexedDB(fileName: string, data: any) {
  const dbOpenReq = indexedDB.open(cbetardb);
  return new Promise((ok, fail) => {
    dbOpenReq.onsuccess = async (ev: Event) => {
      const db = dbOpenReq.result;

      const transWrite = db.transaction(["store"], 'readwrite')
      const reqWrite = transWrite.objectStore('store').put(data, fileName);
      reqWrite.onsuccess = (_ev: any) => {
        return ok();
      };
    };
  });
}

async function removeFileFromIndexedDB(fileName: string) {
  const dbOpenReq = indexedDB.open(cbetardb);
  return new Promise((ok, fail) => {
    dbOpenReq.onsuccess = async (ev: Event) => {
      const db = dbOpenReq.result;

      const transWrite = db.transaction(["store"], 'readwrite')
      const reqWrite = transWrite.objectStore('store').delete(fileName);
      reqWrite.onsuccess = (_ev: any) => {
        return ok();
      };
    };
  });
}

// Fetch juan or HTML file.
async function fetchJuan(work: string, juan: string, htmlFile: string | null, update: boolean = false) {
  const fileName = htmlFile || getFileName(work, juan);
  let htmlStr: string | null = null;
  try {
    htmlStr = await getFileFromIndexedDB(fileName) as string;
  } catch {
    // Ignore file not found.
  }
  const settingsStr = localStorage.getItem('Settings.json')

  let workInfo = new Work({});
  let bookmark: Bookmark | undefined;
  if (settingsStr) {
    const bookmarks: Array<Bookmark> = (JSON.parse(settingsStr) as any).settings.bookmarks;
    bookmark = bookmarks.find((b) => b.fileName === fileName || b.uuid === work);
  }

  if (htmlStr !== null && bookmark !== undefined && !update) {
    workInfo = bookmark.work!;
  } else {
    if (htmlFile) {
      const res = await axiosInstance.get(`/${htmlFile}`, {
        responseType: 'arraybuffer',
      });
      let tryDecoder = new TextDecoder();
      let tryDecodeHtmlStr = tryDecoder.decode(res.data);
      if (tryDecodeHtmlStr.includes('charset=big5')) {
        htmlStr = new TextDecoder('big5').decode(res.data);
      } else {
        htmlStr = tryDecodeHtmlStr;
      }
    } else {
      const res = await axiosInstance.get(`/juans?edition=CBETA&work_info=1&work=${work}&juan=${juan}`, {
        responseType: 'arraybuffer',
      });
      let data = JSON.parse(new TextDecoder().decode(res.data));
      htmlStr = data.results[0];
      workInfo = data.work_info;
    }

    // Convert HTML to XML, because ePub requires XHTML.
    // Bad structured HTML will cause DOMParser parse error on some browsers!
    let doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = htmlStr!;
    htmlStr = new XMLSerializer().serializeToString(doc.body);
    // Remove body tag.
    htmlStr = htmlStr.replace('<body', '<div');
    htmlStr = htmlStr.replace('/body>', '/div>');
  }
  return { htmlStr, workInfo };
}

function removeElementsByClassName(doc: Document, className: string) {
  let elements = doc.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode?.removeChild(elements[0]);
  }
}

const consoleLog = console.log.bind(console);
const consoleError = console.error.bind(console);

function getLog() {
  return log;
}

function enableAppLog() {
  console.log = function () {
    log += '----- Info ----\n';
    log += (Array.from(arguments)) + '\n';
    consoleLog.apply(console, arguments as any);
  };

  console.error = function () {
    log += '----- Error ----\n';
    log += (Array.from(arguments)) + '\n';
    consoleError.apply(console, arguments as any);
  };
}

function disableAppLog() {
  log = '';
  console.log = consoleLog;
  console.error = consoleError;
}

function disableAndroidChromeCallout(event: any) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

// Workable but imperfect.
function disableIosSafariCallout(this: Window, event: any) {
  const s = this.getSelection();
  if ((s?.rangeCount || 0) > 0) {
    const r = s?.getRangeAt(0);
    s?.removeAllRanges();
    setTimeout(() => {
      s?.addRange(r!);
    }, 50);
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard && navigator.clipboard.writeText(text);
}

export default {
  storeFile: 'Settings.json',
  fontSizeNorm: 24,
  fontSizeLarge: 48,
  getLog,
  enableAppLog,
  disableAppLog,
  cbetardb,
  apiVersion,
  cbetaApiUrl,
  dilaDictApiUrl,
  twKaiFontKey,
  twKaiFontPath,
  axiosInstance,
  topCatalogsByCat: {
    "CBETA": "CBETA 部類",
    "Cat-T": "大正藏",
    "Cat-X": "卍續藏",
    "Cat-N": "南傳大藏經",
    "others": "歷代藏經補輯",
    "modern": "近代新編文獻",
  } as Record<string, string>,
  topCatalogsByVol: {
    "Vol-T": "T 大正藏",
    "Vol-X": "X 卍續藏",
    "Vol-A": "A 趙城金藏",
    "Vol-K": "K 高麗大藏經-新文豐版",
    "Vol-S": "S 宋藏遺珍-新文豐版",
    "Vol-F": "F 房山石經",
    "Vol-C": "C 中華大藏經-中華書局版",
    "Vol-U": "U 洪武南藏",
    "Vol-P": "P 永樂北藏",
    "Vol-J": "J 嘉興藏",
    "Vol-L": "L 乾隆大藏經-新文豐版",
    "Vol-G": "G 佛教大藏經",
    "Vol-M": "M 卍正藏經-新文豐版",
    "Vol-D": "D 國圖善本",
    "Vol-N": "N 南傳大藏經(冊別)",
    "Vol-ZS": "ZS 正史佛教資料類編",
    "Vol-I": "I 北朝佛教石刻拓片百品",
    "Vol-ZW": "ZW 藏外佛教文獻",
    "Vol-B": "B 大藏經補編",
    "Vol-GA": "GA 中國佛寺史志彙刊",
    "Vol-GB": "GB 中國佛寺志叢刊",
    "Vol-Y": "Y 印順法師佛學著作集",
    "Vol-LC": "LC 呂澂佛學著作集",
  } as Record<string, string>,
  fetchErrorContent: (
    <div className='contentCenter'>
      <IonLabel>
        <div>
          <div>連線失敗!</div>
          <div style={{ fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>如果問題持續發生，請執行<a href="/settings" target="_self">設定頁</a>的app異常回報功能。</div>
        </div>
      </IonLabel>
    </div>
  ),
  updateApp: () => {
    navigator.serviceWorker.getRegistrations().then(regs => {
      return Promise.all(regs.map(reg => reg.update()));
    });
  },
  scrollbarSizeIdToValue,
  updateCssVars: (settings: any) => {
    let scrollbarSize = scrollbarSizeIdToValue(settings.scrollbarSize);
    document.documentElement.style.cssText = `--ion-font-family: ${settings.useFontKai ? 'Heiti, Times, Kai' : 'Times, Heiti'};
        --scrollbar-size: ${scrollbarSize}px; --ui-font-size: ${settings.uiFontSize}px; --text-font-size: ${settings.fontSize}px`
  },
  isTouchDevice: () => {
    return isPlatform('ios') || isPlatform('android');
  },
  fetchJuan,
  getFileName,
  getFileFromIndexedDB,
  saveFileToIndexedDB,
  removeFileFromIndexedDB,
  removeElementsByClassName,
  disableAndroidChromeCallout,
  disableIosSafariCallout,
  copyToClipboard,
};
