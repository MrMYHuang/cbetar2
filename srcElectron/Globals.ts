export const localFileProtocolName = 'safe-file-protocol'; 
export const latestDownloadUrl = 'https://github.com/MrMYHuang/cbetar2/releases/latest/download';
import * as fs from 'fs';
export function backendAppPackageType() {
    if (fs.existsSync(`${process.resourcesPath}/IsWin.txt`)) return 'win';
    if (fs.existsSync(`${process.resourcesPath}/IsMac.txt`)) return 'mac';
    if (fs.existsSync(`${process.resourcesPath}/IsRpm.txt`)) return 'rpm';
    if (fs.existsSync(`${process.resourcesPath}/IsDeb.txt`)) return 'deb';
    if (fs.existsSync(`${process.resourcesPath}/IsSnap.txt`)) return 'snap';
    return 'unknown';
}