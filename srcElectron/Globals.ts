import * as fs from 'fs';
const PackageInfos = require('../package.json');
export const localFileProtocolName = 'safe-file-protocol'; 
export const latestDownloadUrl = `${PackageInfos.repository}/releases/latest/download`;
export function backendAppPackageType() {
    if (fs.existsSync(`${process.resourcesPath}/IsWin.txt`)) return 'win';
    if (fs.existsSync(`${process.resourcesPath}/IsMac.txt`)) return 'mac';
    if (fs.existsSync(`${process.resourcesPath}/IsRpm.txt`)) return 'rpm';
    if (fs.existsSync(`${process.resourcesPath}/IsDeb.txt`)) return 'deb';
    if (fs.existsSync(`${process.resourcesPath}/IsSnap.txt`)) return 'snap';
    return 'unknown';
}