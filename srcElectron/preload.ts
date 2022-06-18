// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const {
  contextBridge,
  ipcRenderer
} = require("electron");

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, (process.versions as any)[type]);
  }
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "electronBackendApi", {
      send: (channel: string, data: any) => {
          // whitelist channels
          let validChannels = ["toMain"];
          if (validChannels.includes(channel)) {
              ipcRenderer.send(channel, data);
          }
      },
      receive: (channel: string, func: Function) => {
          let validChannels = ["fromMain"];
          if (validChannels.includes(channel)) {
              // Deliberately strip event as it includes `sender` 
              ipcRenderer.on(channel, (event: any, ...args: any[]) => func(...args));
          }
      },
      receiveOnce: (channel: string, func: Function) => {
          let validChannels = ["fromMain"];
          if (validChannels.includes(channel)) {
              // Deliberately strip event as it includes `sender` 
              ipcRenderer.once(channel, (event: any, ...args: any[]) => func(...args));
          }
      },
      invoke: (channel: string, data: any) => {
          let validChannels = ["toMainV3"];
          if (validChannels.includes(channel)) {
              // Deliberately strip event as it includes `sender` 
              return ipcRenderer.invoke(channel, data);
          }
          return Promise.reject('Invalid invoke channel.');
      },
      removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel);
      }
  }
);
