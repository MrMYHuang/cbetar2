import axios from 'axios';
import { isPlatform, IonLabel, IonIcon } from '@ionic/react';
import { refreshCircle } from 'ionicons/icons';
import Store from './redux/store';
import IndexedDbFuncs from './IndexedDbFuncs';

const pwaUrl = process.env.PUBLIC_URL || '/';
const bugReportApiUrl = 'https://vh6ud1o56g.execute-api.ap-northeast-1.amazonaws.com/bugReportMailer';
const apiVersion = 'v1.2';
const cbetaApiUrl = `https://cbdata.dila.edu.tw/${apiVersion}`;
const dilaDictApiUrl = `https://glossaries.dila.edu.tw/search.json`;
const twKaiFontVersion = 4;
// Disable problematic fonts.
//const twKaiFonts = ['Kai'];
let twKaiFontsCache: { [key: string]: FontFace } = {};
const twKaiFonts = ['Kai', 'Kai', 'Kai', 'KaiExtB', 'KaiExtB', 'KaiExtB', 'KaiPlus', 'KaiPlus'];
const twKaiFontKeys = ['twKaiFont-1', 'twKaiFont-2', 'twKaiFont-3', 'twKaiExtBFont-1', 'twKaiExtBFont-2', 'twKaiExtBFont-3', 'twKaiPlusFont-1', 'twKaiPlusFont-2',];
/* Font source: https://data.gov.tw/dataset/5961 */
//const twKaiFontPaths = [`${pwaUrl}/assets/TW-Kai-98_1.woff`, `${pwaUrl}/assets/TW-Kai-Ext-B-98_1.woff`, `${pwaUrl}/assets/TW-Kai-Plus-98_1.woff`, ];
const twKaiFontPaths = [`${pwaUrl}/assets/TW-Kai-98_1-1.woff2`, `${pwaUrl}/assets/TW-Kai-98_1-2.woff2`, `${pwaUrl}/assets/TW-Kai-98_1-3.woff2`, `${pwaUrl}/assets/TW-Kai-Ext-B-98_1-1.woff2`, `${pwaUrl}/assets/TW-Kai-Ext-B-98_1-2.woff2`, `${pwaUrl}/assets/TW-Kai-Ext-B-98_1-3.woff2`, `${pwaUrl}/assets/TW-Kai-Plus-98_1-1.woff2`, `${pwaUrl}/assets/TW-Kai-Plus-98_1-2.woff2`,];
let log = '';

let store = Store.getSavedStore();

const axiosInstance = axios.create({
  baseURL: cbetaApiUrl,
  timeout: 10000,
});

function twKaiFontNeedUpgrade() {
  return +(localStorage.getItem('twKaiFontVersion') ?? 1) < twKaiFontVersion;
}

async function loadTwKaiFonts(progressCallback: Function | null = null, win: Window = window) {
  let forceUpdate = false;
  if (twKaiFontNeedUpgrade()) {
    localStorage.setItem('twKaiFontVersion', twKaiFontVersion + "");
    forceUpdate = true;
  }

  let finishCount = 0;
  let load: Promise<any>[] = [];
  for (let i = 0; i < twKaiFonts.length; i++) {
    load.push(loadTwKaiFont(
      twKaiFonts[i],
      twKaiFontKeys[i],
      twKaiFontPaths[i],
      forceUpdate,
    ).then(
      // eslint-disable-next-line no-loop-func
      (fontFace) => {
        win.document.fonts.add(fontFace);
        //console.log(`[Main] ${twKaiFontKeys[i]} font loading success!`);
        finishCount += 1;
        progressCallback && progressCallback(finishCount / twKaiFonts.length);
      }));
  }
  return Promise.all(load);
}

async function loadTwKaiFont(font: string, key: string, path: string, forceUpdate: boolean) {
  const fontFaceCache = twKaiFontsCache[key];
  const updateFont = () => {
    return axiosInstance.get(`${window.location.origin}/${path}`, {
      responseType: 'arraybuffer',
      timeout: 0,
    }).then(res => {
      const fontData = res.data;
      IndexedDbFuncs.saveFile(key, fontData);
      localStorage.setItem('twKaiFontVersion', twKaiFontVersion + "");
      return new window.FontFace(font, fontData)
    });
  };

  let updateFontOrNot: Promise<FontFace>;
  if (!forceUpdate) {
    if (fontFaceCache) {
      updateFontOrNot = Promise.resolve(fontFaceCache);
    } else {
      updateFontOrNot = (IndexedDbFuncs.getFile(key) as Promise<ArrayBuffer>).then((data) => {
        return new window.FontFace(font, data);
      }).catch(err => {
        return updateFont();
      });
    }
  } else {
    updateFontOrNot = updateFont();
  }

  return updateFontOrNot.then((fontFace) => {
    twKaiFontsCache[key] = fontFace;
    return fontFace.load();
  })
}

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

async function clearAppData() {
  localStorage.clear();
  await IndexedDbFuncs.clear();
}

const electronBackendApi: any = (window as any).electronBackendApi;

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
    if (arguments[0] && arguments[0].isAxiosError) {
      log += `URL: ${arguments[0].config.url}\n`;
    }
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
    setTimeout(() => {
      s?.removeAllRanges();
      setTimeout(() => {
        s?.addRange(r!);
      }, 50);
    }, 50);
  }
}

//const webkit = (window as any).webkit;
function copyToClipboard(text: string) {
  try {
    navigator.clipboard && navigator.clipboard.writeText(text);
  } catch (error) {
    console.error(error);
  }
}

function isMacCatalyst() {
  return isPlatform('ios') && ((window as any).webkit);
}

function zhVoices() {
  return speechSynthesis.getVoices().filter(v => ['zh-TW', 'zh_TW', 'zh-CN', 'zh_CN', 'zh-HK', 'zh_HK'].some(name => v.localService && v.lang.indexOf(name) > -1));
}

const Globals = {
  cbetar2AssetDir: 'cbetar2/assets',
  storeFile: Store.storeFile,
  store,
  fontSizeNorm: 24,
  fontSizeLarge: 48,
  getLog,
  enableAppLog,
  disableAppLog,
  pwaUrl,
  bugReportApiUrl,
  apiVersion,
  cbetaApiUrl,
  dilaDictApiUrl,
  twKaiFontNeedUpgrade,
  twKaiFontsCache,
  twKaiFonts,
  twKaiFontKeys,
  twKaiFontVersion,
  loadTwKaiFonts,
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
  appSettings: {
    'theme': '佈景主題',
    'rtlVerticalLayout': '經文直排、右至左書寫',
    'paginated': '單頁/分頁',
    'showComments': '顯示經文註解、版權',
    'useFontKai': '黑體/楷書字體',
    'uiFontSize': 'UI字型大小',
    'fontSize': '經文字型大小',
    'printStyle': '經文列印樣式',
  } as Record<string, string>,
  fetchErrorContent: (
    <div className='contentCenter'>
      <IonLabel>
        <div>
          <div>連線失敗!</div>
          <div style={{ fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>請試上方重新整理按鈕<IonIcon icon={refreshCircle} slot='icon-only' />。</div>
          <div style={{ fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>如果問題持續發生，請執行<a href="/settings" target="_self">設定頁</a>的app異常回報功能。</div>
        </div>
      </IonLabel>
    </div>
  ),
  searchNoResultMessage:
    <IonLabel className='ion-text-wrap uiFont' key={`searchLabelNone`}>
      查無結果。請確認輸入名稱是否正確。
    </IonLabel>,
  updateApp: () => {
    return new Promise(async resolve => {
      navigator.serviceWorker.getRegistrations().then(async regs => {
        const hasUpdates = await Promise.all(regs.map(reg => (reg.update() as any).then((newReg: ServiceWorkerRegistration) => {
          return newReg.installing !== null || newReg.waiting !== null;
        })));
        resolve(hasUpdates.reduce((prev, curr) => prev || curr, false));
      });
    });
  },
  scrollbarSizeIdToValue,
  updateCssVars: (settings: any) => {
    let scrollbarSize = scrollbarSizeIdToValue(settings.scrollbarSize);
    document.documentElement.style.cssText = `--ion-font-family: ${settings.useFontKai ? `Times, ${twKaiFonts.join(', ')}, Noto Sans CJK TC` : 'Times, Heiti TC, Noto Sans CJK TC'}; --scrollbar-size: ${scrollbarSize}px; --ui-font-size: ${settings.uiFontSize}px; --text-font-size: ${settings.fontSize}px`
  },
  isMacCatalyst,
  isTouchDevice: () => {
    return (isPlatform('ios') && !isMacCatalyst()) || isPlatform('android');
  },
  isStoreApps: () => {
    return isPlatform('pwa') || isPlatform('electron');
  },
  electronBackendApi,
  getFileName,
  clearAppData,
  removeElementsByClassName,
  disableAndroidChromeCallout,
  disableIosSafariCallout,
  copyToClipboard,
  zhVoices,
};

export default Globals;
