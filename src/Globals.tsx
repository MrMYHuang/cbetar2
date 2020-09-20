import axios from 'axios';
import { isPlatform, IonLabel } from '@ionic/react';
import React from 'react';

const apiVersion = 'v1.2';
const cbetaApiUrl = `https://cbdata.dila.edu.tw/${apiVersion}`;

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

export default {
  storeFile: 'Settings.json',
  fontSizeNorm: 24,
  fontSizeLarge: 48,
  apiVersion,
  cbetaApiUrl,
  axiosInstance,
  topCatalogs: {
    "CBETA": "CBETA 部類",
    "others": "歷代藏經補輯",
    "modern": "近代新編文獻",
    "Cat-T": "大正藏(部別)",
    "Cat-X": "卍續藏(部別)",
    "Cat-N": "南傳大藏經(部別)",
    "Vol-A": "趙城金藏",
    "Vol-B": "大藏經補編",
    "Vol-C": "中華大藏經-中華書局版",
    "Vol-D": "國圖善本",
    "Vol-F": "房山石經",
    "Vol-G": "佛教大藏經",
    "Vol-GA": "中國佛寺史志彙刊",
    "Vol-GB": "中國佛寺志叢刊",
    "Vol-I": "北朝佛教石刻拓片百品",
    "Vol-J": "嘉興藏",
    "Vol-K": "高麗大藏經-新文豐版",
    "Vol-L": "乾隆大藏經-新文豐版",
    "Vol-LC": "呂澂佛學著作集",
    "Vol-M": "卍正藏經-新文豐版",
    "Vol-N": "南傳大藏經(冊別)",
    "Vol-P": "永樂北藏",
    "Vol-S": "宋藏遺珍-新文豐版",
    "Vol-T": "大正藏(冊別)",
    "Vol-U": "洪武南藏",
    "Vol-X": "卍續藏(冊別)",
    "Vol-ZS": "正史佛教資料類編",
    "Vol-ZW": "藏外佛教文獻",
    "Vol-Y": "印順法師佛學著作集",
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
  }
};
