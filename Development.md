# Development

## Technology Keywords
Frontend, TypeScript, JavaScript, CSS, Ionic, Material-UI, React, Redux, react-app-rewired, Webpack 5, in-memory file system, server side redirection, IndexedDB, zip.js (read large zip by file stream on mobile device), web font, Service Worker, workbox, speechSynthesis, ePub Viewer, Progressive Web App (PWA), Android, Google Play Store, Windows 10, Microsoft Store, iPhone, iPad, iOS, iPadOS, App Store, WKWebView, macOS, Mac App Store (MAS), Linux, Snap Store, Flathub, Copr, Electron, electron-builder, Backend, XML, XSLT, GitHub Actions, CircleCI

## Run Locally
### Progressive Web App
0. Required software:
    1. Node 16: nvm is recommended: https://github.com/nvm-sh/nvm
1. Run Shell script:
```
git clone --recursive https://github.com/MrMYHuang/cbetar2.git
cd cbetar2
npm i
npm run start
```

### Debug Electron app
1. Run Shell script:
```
cd cbetar2
npm i
npm run debug-electron
```
2. Attach to the NodeJS app by VS Code

### Debug Service Worker
1. Run Shell script:
```
cd cbetar2
npm i
npm run start-sw
```

### Mac Store App
0. Generate and install the following certificates from https://developer.apple.com/account/resources/certificates/list
   1. Apple Development
   2. Apple Distribution (for dist-mas)
   3. Mac Developer (for dist-mas-dev)
   4. 3rd Party Mac Developer Application
   5. 3rd Party Mac Developer Installer (for dist-mas)
   6. Developer ID Application (for dist-mac)
   7. Developer ID Installer (for dist-mac)
   8. Development provisionprofile with cert Mac Development (for dist-mas-dev)
   9. App Store provisionprofile with cert Apple Distribution (for dist-mas)
1. Run Shell script:
```
cd cbetar2
npm i
npm run dist-mas-dev
```
2. Open dist/mas-dev/foo.app

## Publish App
### Progressive Web App
#### Build
```
npm run build
```
#### Publish to GitHub
Upload files under build folder to your github.io.

#### Client Side Routing
Notice! This app uses client side routing for page navigation. Without loading this app (and its client side router) once, a client side route is resolved as a server side route by browser! Generally, the web server serving this app can't resolve this route and thus responses a 404 error. To solve this problem, this repo provides a 404.html for GitHub.io web server. When the GitHub.io server can't resolve a client side route, it redirects to 404.html, which further redirect to URL of this app with path info of the route. For example, if a user on a new PC opens this URL
https://mrmyhuang.github.io/bookmarks
, the GitHub.io server can't find bookmarks/index.html and thus redirects the resource to 404.html. Our 404.html extracts the app path "/bookmarks" and redirects the browser to the app URL https://mrmyhuang.github.io/ with query parameter `?route=/bookmarks`. After the app and its client side router loaded, the app redirects itself by using the original URL https://mrmyhuang.github.io/bookmarks by its router!

If a developer wants to migrate this app to other web servers, please use a similar server side redirection technique to correctly do the client side routing.

### Google Play Store, Microsoft Store
Please use PWA Builder.
https://www.pwabuilder.com/

### App Store
Note: The Mac Catalyst app in this section has limited functions. It is recommended to use Electron Mac Store app for submission as in next section!

0. Required software:
    1. CocoaPods: https://guides.cocoapods.org/using/getting-started.html
    2. Xcode 13
1. Run Shell script:
```
cd cbetar2
cd ios
```
2. Open cbetar2.xcworkspace by Xcode...

### Mac App Store
1. Run Shell script:
```
cd cbetar2
npm i
npm run dist-mas
```
2. Upload dist/mas/foo.pkg to App Store Connect by Transporter:
https://apps.apple.com/tw/app/transporter/id1450874784

### Mac PKG
1. Run Shell script:
```
export APPLE_ID=your@email.domain
# An app-specific password. You can create one at appleid.apple.com.
export APPLE_ID_PASSWORD=yourAppleIdAppPassword
# Found at https://developer.apple.com/account/#!/membership
export APPLE_TEAM_ID=yourTeamId
npm i
npm run dist-mac
```

### Snap Store (Linux)
0. Required software:
    1. snapd: https://snapcraft.io/docs/installing-snapd
    2. snapcraft:
    ```
    snap install snapcraft
    snapcraft login
    ```

1. Run Shell script:
```
cd cbetar2
npm i
npm run dist-snap
# or
#npm run dist-snap -- --use-lxd
```
2. Upload by this example command:
```
npm run publish-snap
```

### Flathub (Linux) built on local
0. Required software:
    1. Fedora is recommended.
    2. flatpak-node-generator:
    ```
    git clone https://github.com/flatpak/flatpak-builder-tools.git
    cd flatpak-builder-tools/node
    pipx install .
    ```

1. Run shell script :
```
cd cbetar2
# x.y.z from version in package.json.
git tag x.y.z
git clone https://github.com/flathub/io.github.mrmyhuang.cbetar2.git flatpak
yarn
yarn run prepare-flatpak
flatpak install -y org.freedesktop.Sdk//22.08 org.electronjs.Electron2.BaseApp//22.08 org.freedesktop.Sdk.Extension.node16//22.08
yarn run dist-flatpak-dev
```

### Flathub (Linux) built by Flathub CI/CD
0. Required software:
    1. Fedora is recommended.
    2. flatpak-node-generator:

1. Update package.json version to x.y.z. Then, commit it and tag with x.y.z.

2. Run shell script :
```
cd cbetar2
# x.y.z from version in package.json.
git tag x.y.z
yarn i
yarn run prepare-flatpak
cd flatpak
git add *
git commit -m "* Version x.y.z"
git push
```

### Build by GitHub Actions and CircleCI
0. CI/CD setting files:
    GitHub Actions: .github/workflows/publish.yml
    CircleCI:
    1. .circleci/config.yml
    2. CircleCI project environment variables:
        GH_TOKEN: GitHub token
        SNAPCRAFT_STORE_CREDENTIALS: generated by tools/snapCiCdKey.sh

1. Tag one commit with format vx.y.z

### Arch Linux Package
```
git clone https://aur.archlinux.org/cbetar2.git
cd cbetar2
makepkg
sudo pacman -U cbetar2*.tar.xz
```
