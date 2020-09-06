import axios from 'axios';
import { isPlatform } from '@ionic/react';

const apiVersion = 'v1.2';
const cbetaApiUrl = `https://cbdata.dila.edu.tw/${apiVersion}`;

const axiosInstance = axios.create({
  baseURL: cbetaApiUrl,
  timeout: 3000,
});

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
      updateApp: () => {
        navigator.serviceWorker.getRegistrations().then(regs => {
          return Promise.all(regs.map(reg => reg.update()));
        });
      },
      updateCssVars: (settings: any) => {
        let scrollbarSize = 0;
        switch (settings.scrollbarSize) {
          case 1: scrollbarSize = 20; break;
          case 2: scrollbarSize = 40; break;
        }
        document.documentElement.style.cssText = `--ion-font-family: ${settings.useFontKai ? 'Kai' : '細明體'};
        --scrollbar-size: ${scrollbarSize}px;`
      },
      isTouchDevice: () => {
        return isPlatform('ios') || isPlatform('android');
      }
};
