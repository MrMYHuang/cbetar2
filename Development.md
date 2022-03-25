# Development

## Technology Keywords
Frontend, TypeScript, CSS, Ionic, React, Redux, react-app-rewired, Webpack Alias, in-memory file system, server side redirection, IndexedDB, web font, Service Worker, workbox, speechSynthesis, ePub Viewer, Progressive Web App (PWA), Android, Google Play Store, Windows 10, Microsoft Store, iPhone, iPad, iOS, iPadOS, App Store, WKWebView, macOS, Mac App Store (MAS), Electron, Linux, Snap Store, Backend, XML, XSLT

## Run Locally
### Progressive Web App
0. Required software: Node 12
1. Run Shell script:
```
git clone https://github.com/MrMYHuang/cbetar2.git
cd cbetar2
npm i
npm run start
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
cd electronApps
npm i
npm run dist-mas-dev
```
2. Open dist/mas-dev/foo.app

## Publish App
### Progressive Web App
#### Build on Windows
```
npm run build
```
#### Build on macOS or Linux
```
npm run build_linux
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
cd ios
pod install
```
2. Open cbetar2.xcworkspace by Xcode...

### Mac App Store
1. Run Shell script:
```
cd electronApps
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
cd electronApps
npm i
npm run dist-mac
```

### Linux Snap Store
0. Required software:
    1. snapd: https://snapcraft.io/docs/installing-snapd
    2. snapcraft:
    ```
    snap install snapcraft
    snapcraft login
    ```

1. Run Shell script:
```
cd electronApps
npm i
npm run dist-snap
```
2. Upload by this example command:
```
snapcraft upload --release=stable dist/foo.snap
```