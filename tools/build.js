const { execSync } = require('child_process');
const platform = require('os').platform();

let buildScript = './tools/';
switch (platform) {
    case 'win32':
        buildScript += 'CopyBuild.ps1';
        break;
    default:
        buildScript += 'CopyBuild.sh';
}

execSync(buildScript);
