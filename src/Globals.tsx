import axios from 'axios';
import { isPlatform, IonLabel } from '@ionic/react';
import React from 'react';

const apiVersion = 'v1.2';
const cbetaApiUrl = `https://cbdata.dila.edu.tw/${apiVersion}`;
const dilaDictApiUrl = `https://glossaries.dila.edu.tw/search.json`;

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

// Fetch juan or HTML file.
async function fetchJuan(work: string, juan: string, htmlFile: string | null, update: boolean = false) {
  const fileName = getFileName(work, juan);
  let htmlStr = localStorage.getItem(fileName);
  if (htmlStr != null && !update) {
    // Do nothing.
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
      const res = await axiosInstance.get(`/juans?edition=CBETA&work=${work}&juan=${juan}`, {
        responseType: 'arraybuffer',
      });
      let data = JSON.parse(new TextDecoder().decode(res.data));
      htmlStr = data.results[0];
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
  return htmlStr;
}

export default {
  storeFile: 'Settings.json',
  fontSizeNorm: 24,
  fontSizeLarge: 48,
  apiVersion,
  cbetaApiUrl,
  dilaDictApiUrl,
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
    <IonLabel className='contentCenter'>
      <div>
        <div>連線失敗!</div>
        <div style={{ fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>若其它app能上網，可能是CBETA API異常，請靜待修復。</div>
      </div>
    </IonLabel>),
  updateApp: () => {
    navigator.serviceWorker.getRegistrations().then(regs => {
      return Promise.all(regs.map(reg => reg.update()));
    });
  },
  scrollbarSizeIdToValue,
  updateCssVars: (settings: any) => {
    let scrollbarSize = scrollbarSizeIdToValue(settings.scrollbarSize);
    document.documentElement.style.cssText = `--ion-font-family: ${settings.useFontKai ? 'Heiti, Times, Kai' : 'Times, Heiti'};
        --scrollbar-size: ${scrollbarSize}px; --ui-font-size: ${settings.uiFontSize}px`
  },
  isTouchDevice: () => {
    return isPlatform('ios') || isPlatform('android');
  },
  fetchJuan,
  getFileName,
};
