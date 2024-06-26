import * as semver from 'semver';
import { dialog, BrowserWindow, shell } from 'electron';
import axios from 'axios';
import { DownloaderHelper, ErrorStats, Stats } from 'node-downloader-helper';
import * as Globals from './Globals';
const PackageInfos = require('../package.json');

const isX64 = process.arch === 'x64';

const axiosInstance = axios.create({
    timeout: 5000,
});

export async function lookupLatestVersion() {
    const result = await axiosInstance.get(`${Globals.latestDownloadUrl}/latest.yml`, { responseType: 'text' });
    return /version: (.*)\n/.exec(result.data)![1];
}

export async function check(browserWindow: BrowserWindow) {
    const lastestVersion = await lookupLatestVersion();
    if (semver.gte(PackageInfos.version, lastestVersion)) {
        dialog.showMessageBox({
            type: 'info',
            message: '後端app已是最新版！'
        });
        return
    }

    let packageSuffix = 'win64.exe';
    switch (Globals.backendAppPackageType()) {
        case 'win': packageSuffix = `win_${isX64 ? 'x64' : 'arm64'}.exe`; break;
        case 'mac': packageSuffix = `macos_universal.pkg`; break;
        case 'appImage': packageSuffix = `linux_${isX64 ? 'x86_64' : 'aarch64'}.AppImage`; break;
        case 'rpm': packageSuffix = `linux_${isX64 ? 'x86_64' : 'aarch64'}.rpm`; break;
        case 'deb': packageSuffix = `linux_${isX64 ? 'amd64' : 'arm64'}.deb`; break;
        case 'snap': packageSuffix = 'linux64.snap'; break;
        default: return;
    }

    const clickedButtonId = dialog.showMessageBoxSync(browserWindow, {
        type: 'question',
        message: `發現新版 cbetar2 ${lastestVersion} 後端 app，是否下載安裝檔？`,
        buttons: ['取消', '下載'],
    });

    if (clickedButtonId) {
        const path = dialog.showOpenDialogSync(browserWindow, {
            message: '選擇下載位置',
            properties: ['openDirectory']
        });
        const file = `${PackageInfos.name}_${lastestVersion}_${packageSuffix}`;
        const downloadUrl = `${Globals.latestDownloadUrl}/${file}`;

        if (path) {
            const dl = new DownloaderHelper(downloadUrl, path[0]);
            browserWindow.webContents.send('fromMain', { event: 'DownloadingBackend', progress: 0 });
            let progressUpdateEnable = true;
            dl.on('progress', (stats: Stats) => {
                if (progressUpdateEnable) {
                    // Reduce number of this calls.
                    // Too many of this calls could result in 'end' event callback is executed before 'progress' event callbacks!
                    browserWindow.webContents.send('fromMain', { event: 'DownloadingBackend', progress: stats.progress });
                    progressUpdateEnable = false;
                    setTimeout(() => {
                        progressUpdateEnable = true;
                    }, 100);
                }
            });
            dl.on('end', (downloadInfo: any) => {
                dl.removeAllListeners();
                browserWindow.webContents.send('fromMain', { event: 'DownloadingBackendDone' });
                dialog.showMessageBox({
                    type: 'info',
                    message: '新版後端 app 安裝程式下載完成！請關閉 app，手動執行安裝程式。'
                });
            });
            dl.on('error', (stats: ErrorStats) => {
                dl.removeAllListeners();
                browserWindow.webContents.send('fromMain', { event: 'DownloadingBackendDone' });

                const clickedButtonId = dialog.showMessageBoxSync(browserWindow, {
                    type: 'question',
                    message: `下載失敗！是否開啟安裝檔下載網頁？`,
                    buttons: ['否', '是'],
                });

                if (clickedButtonId) {
                    shell.openExternal(`${PackageInfos.repository}/releases/latest`);
                }
            })
            dl.start();
        }
    }
}