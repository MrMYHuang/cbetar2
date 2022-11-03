import axios from 'axios';
import { isPlatform, IonLabel, IonIcon } from '@ionic/react';
import { refreshCircle } from 'ionicons/icons';
import Store from './redux/store';
import IndexedDbFuncs from './IndexedDbFuncs';
import IndexedDbZipFuncs from './IndexedDbZipFuncs';

const pwaUrl = process.env.PUBLIC_URL || '';
const bugReportApiUrl = 'https://vh6ud1o56g.execute-api.ap-northeast-1.amazonaws.com/bugReportMailer';
const cbetaApiUrl = `https://cbdata.dila.edu.tw/stable`;
const dilaDictApiUrl = `https://glossaries.dila.edu.tw/search.json`;
// Disable problematic fonts.
//const twKaiFonts = ['Kai'];
let twKaiFontsCache: { [key: string]: FontFace } = {};
const twKaiFonts = ['Kai', 'Kai', 'Kai', 'KaiExtB', 'KaiExtB', 'KaiExtB', 'KaiPlus', 'KaiPlus'];
const twKaiFontKeys = ['twKaiFont-1', 'twKaiFont-2', 'twKaiFont-3', 'twKaiExtBFont-1', 'twKaiExtBFont-2', 'twKaiExtBFont-3', 'twKaiPlusFont-1', 'twKaiPlusFont-2',];
/* Font source: https://data.gov.tw/dataset/5961 */
//const twKaiFontPaths = [`${pwaUrl}/assets/TW-Kai-98_1.woff`, `${pwaUrl}/assets/TW-Kai-Ext-B-98_1.woff`, `${pwaUrl}/assets/TW-Kai-Plus-98_1.woff`, ];
const fontBaseUrl = process.env.NODE_ENV === 'production' ?
  'https://objectstorage.ap-osaka-1.oraclecloud.com/n/axq0jpnkikfn/b/myh/o'
  : `${window.location.origin}${pwaUrl}/assets`;
const twKaiFontFiles = [`TW-Kai-98_1-1.woff2`, `TW-Kai-98_1-2.woff2`, `TW-Kai-98_1-3.woff2`, `TW-Kai-Ext-B-98_1-1.woff2`, `TW-Kai-Ext-B-98_1-2.woff2`, `TW-Kai-Ext-B-98_1-3.woff2`, `TW-Kai-Plus-98_1-1.woff2`, `TW-Kai-Plus-98_1-2.woff2`,];
let log = '';


let store = Store.getSavedStore();

const axiosInstance = axios.create({
  baseURL: cbetaApiUrl,
  timeout: 10000,
});

function twKaiFontNeedUpgrade() {
  return +(localStorage.getItem('twKaiFontVersion') ?? 1) < IndexedDbFuncs.twKaiFontVersion;
}

async function loadTwKaiFonts(progressCallback: Function | null = null, win: Window = window) {
  let forceUpdate = false;
  if (twKaiFontNeedUpgrade()) {
    localStorage.setItem('twKaiFontVersion', IndexedDbFuncs.twKaiFontVersion + "");
    forceUpdate = true;
  }

  let finishCount = 0;
  for (let i = 0; i < twKaiFonts.length; i++) {
    const fontFace = await loadTwKaiFont(
      twKaiFonts[i],
      twKaiFontKeys[i],
      twKaiFontFiles[i],
      forceUpdate,
    );

    win.document.fonts.add(fontFace);
    //console.log(`[Main] ${twKaiFontKeys[i]} font loading success!`);
    finishCount += 1;
    progressCallback && progressCallback(finishCount / twKaiFonts.length);
  }
  return Promise.resolve();
}

async function loadTwKaiFont(font: string, key: string, fileName: string, forceUpdate: boolean) {
  const fontFaceCache = twKaiFontsCache[key];
  const updateFont = () => {
    return axiosInstance.get(`${fontBaseUrl}/${fileName}`, {
      responseType: 'arraybuffer',
      timeout: 0,
    }).then(res => {
      const fontData = res.data;
      IndexedDbFuncs.saveFile(key, fontData, IndexedDbFuncs.fontStore);
      localStorage.setItem('twKaiFontVersion', IndexedDbFuncs.twKaiFontVersion + "");
      return new window.FontFace(font, fontData)
    });
  };

  let updateFontOrNot: Promise<FontFace>;
  if (!forceUpdate) {
    if (fontFaceCache) {
      updateFontOrNot = Promise.resolve(fontFaceCache);
    } else {
      updateFontOrNot = (IndexedDbFuncs.getFile<ArrayBuffer>(key, IndexedDbFuncs.fontStore)).then((data) => {
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

const cbetaBookcaseProcessingAssetsVersion = 1;
async function downloadCbetaBookcaseAssets() {
  const res = await axiosInstance.get(`${window.location.origin}/${pwaUrl}/assets.zip`, {
    responseType: 'blob',
  });
  await IndexedDbZipFuncs.extractZipToZips(res.data);
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
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'clipboard-read' } as any).then(() => {
        navigator.clipboard.writeText(text);
      });
    } else {
      navigator.clipboard && navigator.clipboard.writeText(text);
    }
  } catch (error) {
    console.error(error);
  }
}

function shareByLink(dispatch: Function, url: string = window.location.href) {
  copyToClipboard(url);
  dispatch({
    type: 'TMP_SET_KEY_VAL',
    key: 'shareTextModal',
    val: {
      show: true,
      text: decodeURIComponent(url),
    },
  });
}

function isMacCatalyst() {
  return isPlatform('ios') && ((window as any).webkit);
}

function zhVoices() {
  return speechSynthesis.getVoices().filter(v => ['zh-TW', 'zh_TW', 'zh-CN', 'zh_CN', 'zh-HK', 'zh_HK'].some(name => v.localService && v.lang.indexOf(name) > -1));
}

const checkServiceWorkerInterval = 20;
let serviceWorkerLoaded = false;
let _serviceWorkerReg: ServiceWorkerRegistration;
async function getServiceWorkerReg() {
  if (serviceWorkerLoaded) {
    return _serviceWorkerReg;
  }

  return new Promise<ServiceWorkerRegistration>((ok, fail) => {
    let waitTime = 0;
    const waitLoading = setInterval(() => {
      if (navigator.serviceWorker.controller != null) {
        clearInterval(waitLoading);
        ok(_serviceWorkerReg);
      } else if (waitTime > 1e3 * 10) {
        clearInterval(waitLoading);
        fail('getServiceWorkerReg timeout!');
      }
      waitTime += checkServiceWorkerInterval;
    }, checkServiceWorkerInterval);
  });
}
function setServiceWorkerReg(serviceWorkerReg: ServiceWorkerRegistration) {
  _serviceWorkerReg = serviceWorkerReg;
}

let _serviceWorkerRegUpdated: ServiceWorkerRegistration;
function getServiceWorkerRegUpdated() {
  return _serviceWorkerRegUpdated;
}
function setServiceWorkerRegUpdated(serviceWorkerRegUpdated: ServiceWorkerRegistration) {
  _serviceWorkerRegUpdated = serviceWorkerRegUpdated;
}

const Globals = {
  localFileProtocolName: 'safe-file-protocol',
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
  cbetaApiUrl,
  dilaDictApiUrl,
  twKaiFontNeedUpgrade,
  twKaiFontsCache,
  twKaiFonts,
  twKaiFontKeys,
  loadTwKaiFonts,
  cbetaBookcaseProcessingAssetsVersion,
  downloadCbetaBookcaseAssets,
  axiosInstance,
  appSettings: {
    'theme': '佈景主題',
    'rtlVerticalLayout': '經文直排、右至左書寫',
    'paginated': '單頁/分頁',
    'showComments': '顯示經文註解、版權',
    'useFontKai': '黑體/楷書字體',
    'uiFontSize': 'UI 字型大小',
    'fontSize': '經文字型大小',
    'printStyle': '經文列印樣式',
  } as Record<string, string>,
  fetchErrorContent: (
    <div className='contentCenter'>
      <IonLabel>
        <div>
          <div>連線失敗!</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>
            請試上方重新整理按鈕<IonIcon icon={refreshCircle} slot='icon-only' />。
          </div>
          <div style={{ fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>如果問題持續發生，請執行<a href="/settings" target="_self">設定頁</a>的 app 異常回報功能。</div>
        </div>
      </IonLabel>
    </div>
  ),
  fetchErrorContentOfflineMode: (
    <div className='contentCenter'>
      <IonLabel>
        <div>
          <div>開啟失敗!</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>
            離線經文檔不存在。請確認匯入的離線經文檔是最新版。
          </div>
          <div style={{ fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>如果問題持續發生，請執行<a href="/settings" target="_self">設定頁</a>的 app 異常回報功能。</div>
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
  shareByLink,
  zhVoices,
  setServiceWorkerReg,
  getServiceWorkerReg,
  setServiceWorkerRegUpdated,
  getServiceWorkerRegUpdated,
};

export default Globals;
