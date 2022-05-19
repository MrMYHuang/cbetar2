# CBETA電子佛典閱讀器2(非官方)

## <a id='feature'>特色</a>

搜尋目錄、全文檢索、書籤功能、網址分享、離線瀏覽、語音播放、佛學詞典、佈景主題切換、經文分頁、字型調整、楷書字型、直排文字、列印經文/抄經本、連線/離線DB支援、跨平台、無廣告、開放原始碼。

## 說明

CBETA 電子佛典閱讀器2(非官方) (Chinese Buddhist Electronic Text Association Reader 2)，簡寫cbetar2，使用 CBETA API 存取電子佛經，支援以下功能

* <a id='search'>搜尋、瀏覽</a>
  1. 搜索目錄：在目錄頁，按下右上角放大鏡圖示。在對話框輸入經文部分(或全部)標題，按下"搜索目錄"後會列出相關經文。

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Search.png' width='50%' />

  2. 全文檢索：類似"搜索目錄"。但在對話框可輸入某卷經文內的一段文字，如"大水忽起卒至無期"。

  3. 上下卷切換：在經文頁中，右下方半透明鈕按下會跳按鈕，可切換上下卷。

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/JuanPrevNextButtons.png' width='50%' />

* <a id='bookmark'>書籤</a>
  1. 開啟某經文後，(手機、平板)長按後選擇想標記為書籤的字串位置，按右上角書籤圖示，即新增一書籤，可至書籤頁查詢。加入書籤的經文可作離線瀏覽。

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Bookmark.png' width='50%' />

  2. 刪除：至書籤頁，左滑項目即出現刪除鈕，再點擊。
* <a id='shareAppLink'>網址分享</a>
  1. 用瀏覽器開啟此 app 並開啟某卷經文後，可複製其網址分享給別人開啟。
  2. 也可以使用瀏覽器內建書籤功能儲存經文網址。與app書籤功能相比，可以依個人使習慣作選擇。
  3. App 內建"分享此頁"功能，可複製以下連結至作業系統剪貼簿或產生 QR code，可分享給其他人：目錄、經、卷、目錄搜尋、全文檢索搜尋、詞典搜尋、app主頁
  4. 分享網址可帶上部分 app 設定參數。

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/ShareAppUrlWithSettings.png' width='50%' />
  
  5. 經文文字連結功能：選取經文一段文字後、執行"分享此頁"功能，所產生的app連結開啟後會自動跳至選取文字頁面並標示選取文字。
  6. 文章引用：選取經文一段文字後、執行"文章引用"功能，引用文字即複製至作業系統剪貼簿。引用格式基於CBETA Online，例如："《長阿含經》卷1：「長阿含經」(CBETA, T01, no. 1, p. 1a02)"

* 經文頁鍵盤支援
  * 左、右鍵：直排模式下一頁、上一頁
  * 下、上鍵：模排模式下一頁、上一頁
  * Enter: 全螢幕切換
  * Esc: 離開全螢幕
  * F3 或 Ctrl + f: 搜尋文字


* 離線瀏覽
  1. 書籤頁包含的"經"或"卷"書籤都具有離線瀏覽的功能，並用圖示標示。
  2. 設定頁的"更新離線經文檔"按鈕用途為：當CBETA每季更新經文後，離線經文檔不會自動更新，必須手動執行此功能更新所有離線檔。

* <a id='text2speech'>語音播放</a>
  1. 使用電腦語音合成技術 - text to speech，作唸經文功能，即所謂的"有聲書"。(注意，當代電腦語音合成技術與"真人發音"仍有落差。因此聽到的經文發音偶爾不正確是正常現象。)
  2. 播放步驟：開啟經文，按下右上方音符鈕，即可播放（如擷圖所示）

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/PlaySpeech.png' width='70%' />

  3. 單頁模式下指定位置播放：選取部分經文，按下播放鍵，即會從選取處開始播放至經文結尾。
  4. 分頁模式下指定頁數播放：切換至特定頁數，按下播放鍵，即會從該頁開始播放。一頁播完會自動跳下一頁，至經文結尾。
  5. 循環播放：可選擇循環播放的啟始與結束文字，即會自動重複播放，直到按下暫停播放鈕。用途：作唸佛機用。

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Text2SpeechRepeat.png' width='70%' />

  6. 合成語音切換：可切換中國大陸腔、台灣腔、廣東腔，尚不支援 Android, Linux。Windows 10 使用者，請先至 OS 設定安裝各種語音檔，如圖所示：

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/InstalledVoicesWin10.png' width='70%' />

* <a id='dictionary'>佛學詞典(線上查詢)</a>
  1. 整合"DILA 佛學術語字辭典"，可在"佛學詞典"分頁查詢佛學字詞。

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/LookupDictionary.png' width='50%' />

  2. 也可以從查詢的結果選取文字，再執行查詢詞典功能。
  3. 也可以在經文頁選取文字後，執行查詢詞典功能。

* <a>萌典字典(線上查詢)</a>
  1. 整合"萌典"字典，可在"佛學詞典"分頁切換至"萌典字典"，可查詢單字，包括注音、解釋。
  2. 也可以從查詢的結果選取文字，再執行查詢字典功能。
  3. 也可以在經文頁選取文字後，執行查詢字典功能。

* 佈景主題切換
  1. 支援多種佈景主題。
  
  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/theme0.png' width='30%' />
  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/theme1.png' width='30%' />
  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/theme2.png' width='30%' />

* 經文分頁
  1. 經文可調整成單頁或分頁模式。單頁模式，使用滑動方式閱讀經文。分頁模式，可使用鍵盤方向鍵或螢幕方向鍵切換經文頁。
* 字型調整
  1. 考量視力不佳的同修，提供最大 128 px 的經文字型設定。若有需要更大字型，請 E-mail 或 GitHub 聯絡開發者新增。
  2. 支援全字庫楷書字型。
* 直排文字
  1. 傳統中文書的直排文字、由右至左排版。
* <a id='shortcuts'>App 捷徑</a>
  1. Windows, Android的Chrome(建議最新版)使用者，滑鼠右鍵或長按app圖示，可存取app功能捷徑，目前有：(開啟)第1書籤、佛學詞典、萌典字典。
  2. 若由舊版 app 升級至 >= 4.3.0版，要作一次移除app(但可不刪app資料)，再重新安裝，此app捷徑選單才會出現。

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/AppShortcuts.png' width='50%' />

* <a id='print'>列印經文</a>
  1. 經文頁右上三點按鈕點開，按下列印按鈕，即會跳出列印對話框。
  2. 應用：可選擇印紙本或PDF檔。
  3. 調整：可至設定頁調整字型大小、橫/直排文字、黑體/楷書體，再作列印。
  4. 設定頁可設定"經文列印樣式"，目前支援"白底黑字"、"抄經本"。
  5. 已在 Chrome 87, Edge Chrome 87 測過可用。Safari 不支援!

  <img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/PrintManuscript.png' width='90%' />

* App 設定匯出/匯入
  1. 此功能位於設定頁。
  2. 匯出app設定，同時也會匯出書籤資訊，可作備分。
  3. 匯入設定後，會重新下載離線經文檔。

* <a id='report'>App異常回報</a>

  App設定頁的異常回報鈕使用方法為：執行會造成app異常的步驟後，再至設定頁按下異常回報鈕，即會自動產生一封E-mail，包含異常的記錄，發送此E-mail給我們即可。

* <a id='modular'>模組化程式</a>

  cbetar2 為一支模組化程式，由 frontend app (PWA) + backend app (CBETA API or cbetar2 backend) 組成。有兩種使用方式：

  1. 連線DB版 app：PWA + CBETA API
    * 此版本不須先下載 CBETA 離線經文資料檔，但要作離線瀏覽要把經文加至書籤。
    * 安裝方式：瀏覽器安裝、商店安裝。支援多種平台。
  2. 離線DB版 app：PWA + cbetar2 backend
    * 此版本預設與連線版相同，多了離線DB的支援。要切為離線DB模式，要先下載、解壓<a href='http://www.cbeta.org/download/cbreader.htm'>CBETA 離線經文資料檔</a>，可離線瀏覽目錄、經文。
    * 安裝方式：下載安裝檔案安裝。支援 Windows 7+, Linux, macOS 10.10+。
    * 設定：啟動 app 後，執行選單/檔案/設定 Bookcase目錄。

程式碼為開放(MIT License)，可自由下載修改、重新發佈。

## 支援平台
已在這些環境作過安裝、測試:
* Windows 10 amd64 + Chrome
* Windows 11 on ARM + Chrome
* Android 9 + Chrome
* Firefly RK-3399 + Android 7.1 + Firefox 91
* macOS 11 amd64 + Chrome
* macOS 11 arm64 + Apple App Store app
* macOS 11 arm64 host + Ubuntu 20.04 arm64 guest + Snap Store app
* macOS 12 arm64 host + openSUSE Leap 15.3 aarch64 guest + AppImage app
* macOS 12 arm64 host + Arch Linux aarch64 guest + AppImage app
* iPad 7 iPadOS 14-15 + Safari
* iPhone 8 (模擬器) + Safari
* Debian Linux arm64 10 + Chrome
* Raspberry Pi 4 + Ubuntu 20 arm64 + Snap Store app
* Ubuntu 21 amd64 + Snap Store app
* Ubuntu 21 amd64 + Flathub app
* Fedora 35 aarch64 + Flathub app

非上述環境仍可嘗試使用此 app。若有<a href='#knownIssues'>已知問題</a>未描述的問題，可用<a href='#report'>異常回報</a>功能。

建議 OS 與 Chrome、Safari 保持在最新版，以取得最佳 app 體驗。

## <a id='install'>安裝</a>

此 app 有3種取得、安裝方式：

  1. 連線 DB 版 app：Chrome, Safari 網頁瀏覽器。
  2. 連線 DB 版 app：App 商店。
  3. 離線 DB 版 app：下載安裝檔。

建議採用第1種用瀏覽器安裝，以取得最完整的 app 功能體驗。3種安裝方法如下。

### <a id='web-app'>從瀏覽器開啟/安裝</a>
請用 Chrome (Windows, macOS, Linux, Android作業系統使用者)、Safari iOS (iPhone, iPad 使用者) 瀏覽器開啟以下網址：

https://MrMYHuang.github.io

或：

<a href='https://MrMYHuang.github.io' target='_blank'>
<img width="auto" height='60px' src='https://user-images.githubusercontent.com/9122190/28998409-c5bf7362-7a00-11e7-9b63-db56694522e7.png'/>
</a>

此 progressive web app (PWA)，可不安裝直接在網頁瀏覽器執行，或安裝至手機、平板、筆電、桌機。建議安裝，以避免瀏覽器定期清除快取，導致書籤資料不見！

#### Windows, macOS, Linux, Android - 使用 Chrome 安裝
使用 Chrome 瀏覧器（建議最新版）開啟上述 PWA 網址後，網址列會出現一個加號，如圖所示：
<img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/ChromeInstall.png' width='50%' />

點擊它，以完成安裝。安裝完後會在桌面出現"電子佛典"app圖示。

#### iOS - 使用 Safari 安裝
1. 使用 Safari 開啟 web app 網址，再點擊下方中間的"分享"圖示：

<img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Safari/OpenAppUrl.png' width='50%' />

1. 滑動頁面至下方，點選"加入主畫面" (Add to Home Screen)：

<img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Safari/AddToHomeScreen.png' width='50%' />

1. 點擊"新增" (Add)：

<img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Safari/AddToHomeScreen2.png' width='50%' />

4. App 安裝完，出現在主畫面的圖示：

<img src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Safari/AppIcon.png' width='50%' />

### <a id='storeApp'>從 App 商店安裝</a>

#### iOS 14.0+ (iPhone), iPadOS 14.0+ (iPad) - 使用 Apple App Store
<a href='https://apps.apple.com/app/id1546347689' target='_blank'>
<img width="auto" height='60px' src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Download_on_the_App_Store_Badge_CNTC_RGB_blk_100217.svg'/>
</a>

#### Android 4.4+ - 使用 Google Play Store
<a href='https://play.google.com/store/apps/details?id=io.github.mrmyhuang.cbetar2' target='_blank'>
<img width="auto" height='60px' alt='Google Play立即下載' src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/zh-tw_badge_web_generic.png'/>
</a>

#### Android 4.4+ - 使用 Amazon Appstore
<a href='https://www.amazon.com/gp/product/B09VNGZQG6' target='_blank'>
<img width="auto" height='60px' src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/amazon-appstore-badge-english-black.png'/>
</a>

#### Android 4.4+ - 使用 Samsung Galaxy Store
<a href='https://galaxy.store/cbetar2' target='_blank'>
<img width="auto" height='60px' src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/GalaxyStore_ChineseTraditional.png'/>
</a>

#### Android 4.4+ - 使用 Huawei AppGallery (未過審中國大陸)
<a href='https://appgallery.huawei.com/app/C105837365' target='_blank'>
<img width="auto" height='60px' src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/HuaweiAppGallery.png'/>
</a>

#### macOS 10.11+ (x86_64 & arm64) - 使用 Apple App Store
<a href='https://apps.apple.com/app/id1546347689' target='_blank'>
<img width="auto" height='60px' src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Download_on_the_Mac_App_Store_Badge_CNTC_RGB_blk_100217.svg'/>
</a>

#### Windows 10+ (x64 & arm64) - 使用 Microsoft Store
<a href='//www.microsoft.com/store/apps/9P6TDQX46JJL' target='_blank'>
<img width="auto" height='60px' src='https://developer.microsoft.com/store/badges/images/Chinese-Traditional_get-it-from-MS.png' alt='Chinese Traditional badge'/>
</a>

#### Linux (amd64 & arm64) - 使用 Snap Store
<a href='https://snapcraft.io/cbetar2' target='_blank'>
<img width="auto" height='60px' src='https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/[TW]-snap-store-black@2x.png' />
</a>

#### Linux (x86_64 & aarch64) - 使用 Flathub
<a href='https://flathub.org/apps/details/io.github.mrmyhuang.cbetar2' target='_blank'>
<img width="auto" height='60px' src='https://flathub.org/assets/badges/flathub-badge-en.png' />
</a>

### RHEL 8 & 9 / CentOS 8 & 9 / Fedora Linux 34-36 (x86_64 & aarch64) - 使用 Copr
Shell script:
```
sudo dnf copr enable mrmyh/cbetar2
sudo dnf install cbetar2
```

### 下載安裝檔
支援的作業系統如下 (Android 為連線 DB app，其他都是離線 DB app)：

  1. Android (中國大陸使用者也能安裝)
  2. Linux amd64 & arm64 AppImage (Ubuntu, Fedora, Debian, Arch, openSUSE)
  3. Linux amd64 & arm64 DEB (Debian, Ubuntu, ...)
  4. Linux RPM x86_64 & aarch64 (Fedora, ...)
  5. Windows 7+ x64 & arm64
  6. macOS 10.11+ x86_64 & arm64

請開啟任一頁面，下載最新版安裝檔：

  * https://www.electronjs.org/apps/cbetar2
  * https://github.com/MrMYHuang/cbetar2/releases/latest

也可以至此安裝 Electron App Store，搜尋 "cbeta" 找到此 app 安裝檔:
  * https://electron-store.org/

## TODO
1. 離線版 app 未完成或不支援功能：
  1. 搜尋目錄
  2. 全文搜索
  3. 查字典
  4. 查詞典
  5. 經文顯示缺字
  6. 初次啟動 app 仍須網路連線(自動下載前端 app)。

## <a id='knownIssues'>已知問題</a>
1. iOS Safari 在單頁模式下，捲軸無法顯示。
2. 目前多數 Chrome 無法暫停合成語音播放，因此此 app 目前經文語音播放功能不支援暫停，只支援停止。
3. 語音播放速度受限不同引擎、語音限制，可能無法達到指定速度。
4. "避免螢幕自動鎖定"功能僅限部分較新 Chrome 瀏覽器才支援。
5. iOS Safari 13.4 以上才支援"分享此頁"功能。
6. iOS Safari 不支援 app 捷徑 (App Store iOS app 支援)。
7. Safari, iOS Safari 不支援列印直排經文。( https://bugs.webkit.org/show_bug.cgi?id=220043 )
8. iOS Safari 選擇文字後，仍會閃爍彈出式選單才消失。
9. 合成語音選項濾掉非離線語音，以避開非離線語音單次播放最長字串過小的問題。
10. 合成語音選項在 Android Chrome 無效。( https://stackoverflow.com/a/61366224/631869 )
11. 合成語音功能在 Linux 無作用。
12. App Store iOS app 不支援列印。

## <a id='history'></a><a href='https://github.com/MrMYHuang/cbetar2/raw/master/VERSIONS.md'>版本歷史</a>
## <a href='https://github.com/MrMYHuang/cbetar2/raw/master/Development.md'>程式開發</a>

## <a id='privacy'>隱私政策聲明</a>

此app無收集使用者個人資訊，也無收集匿名資訊。

## 第三方軟體版權聲明

1. <a href="http://cbdata.dila.edu.tw/v1.2/" target="_new">CBETA API參考文件</a>
2. <a href="http://glossaries.dila.edu.tw/?locale=zh-TW" target="_new">DILA 佛學術語字辭典</a>
3. <a href="https://data.gov.tw/dataset/5961" target="_new">全字庫字型</a>
4. <a href="https://github.com/g0v/moedict-webkit" target="_new">萌典字典</a>

## <a id='contributors'>App相關貢獻者 (依姓名英、中排序)</a>
* CBETA (https://cbeta.org)
* DILA (https://www.dila.edu.tw/)
* Godfery Wang
* Meng-Yuan Huang (myh@live.com)
* 曹博堯
* 謝仁方
