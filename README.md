# CBETA電子佛典閱讀器2(非官方)

## 特色

搜尋經文、書籤功能、離線瀏覽、語音播放、經文分頁、暗色模式、字型調整、楷書字型、直式文字、app更新、跨平台、無廣告、開放原始碼。

## 說明

CBETA電子佛典閱讀器2(非官方)，使用CBETA API存取電子佛經，支援以下功能

* 搜尋
    1. 在目錄頁，按下右上角放大鏡圖示。在對話框輸入經文部分標題，確認後會列出相關經文。
    ![Search](https://github.com/MrMYHuang/cbetar2/raw/master/docs/images/Search.png)
* 書籤
    1. 開啟某經文後，(手機、平板)長按後選擇想標記為書籤的字串位置，再按右上角書籤圖示，即新增一書籤，可至書籤頁查詢。
    2. 刪除：至書籤頁，左滑項目即出現刪除鈕，再點擊。
* 離線瀏覽
    1. 書籤頁包含的"經"或"卷"書籤都具有離線瀏覽的功能，並用圖示標示。
* 語音播放:
    1. 使用電腦語音合成技術 - text to speech，作唸經文功能，即所謂的"有聲書"。(注意，當代電腦語音合成技術與"真人發音"仍有落差。因此聽到的經文發音偶爾不正確是正常現象。)
    2. 播放步驟：開啟經文 / 按下右上方播放鍵（如擷圖所示）

<img src='./docs/images/PlaySpeech.png' width='70%' />

* 經文分頁
    1. 經文可調整成單頁或分頁模式。單頁模式，使用滑動方式閱讀經文。分頁模式，可使用鍵盤方向鍵或螢幕方向鍵切換經文頁。
* 字型調整
    1. 考量視力不佳的同修，提供最大64px的經文字型設定。若有需要更大字型，請E-mail或GitHub聯絡開發者新增。
    2. 支援全字庫楷書字型。
* 直式文字
    1. 傳統中文書的直式文字、由右至左排版。
* App更新

    此app不定期發佈更新，包含新功能或bug修正。注意!App檔案更新後，要關閉、重啟1次app才會載入新版程式。目前支援2種更新方式:

    1. App啟動: app啟動後，會自動檢查一次有無新版。
    2. 手動: 至設定頁，按更新按鈕。
    3. 若已知有新版app，但按手動更新卻一直沒反應(bug!)，請嘗試關閉、重啟app，就會更新。

程式碼為開放，可自由下載修改。

## 支援平台
已在這些環境作過安裝、測試:
* Windows 10 + Edge Chrome
* Android 9 + Chrome
* macOS 10.15 + Edge Chrome
* iPad 7 (模擬器) + Safari
* iPhone 8 (模擬器) + Safari
* Debian Linux 10 + Chrome

## Web App
此progressive web app (PWA)，可不安裝直接在網頁瀏覽器執行，或安裝至手機、平板、筆電、桌機。建議安裝，以避免瀏覽器定期清除快取，導致書籤資料不見！

### 網址
https://MrMYHuang.github.io

### 安裝
#### Chrome (Windows, macOS, Linux, Android)
請參考Chrome官方文件： 

https://support.google.com/chrome/answer/9658361?hl=zh-Hant&co=GENIE.Platform%3DDesktop

#### Safari (iOS)
1. 使用Safari開啟web app網址，再點擊下方中間的"分享"圖示：

<img src='./docs/images/Safari/OpenAppUrl.png' width='50%' height='50%' />

2. 滑動頁面至下方，點選"加入主畫面"(Add to Home Screen)：

<img src='./docs/images/Safari/AddToHomeScreen.png' width='50%' height='50%' />

3. 點擊"新增"(Add)：

<img src='./docs/images/Safari/AddToHomeScreen2.png' width='50%' height='50%' />

4. App安裝完，出現在主畫面的圖示：

<img src='./docs/images/Safari/AppIcon.png' width='50%' height='50%' />

## Run Locally
Please refer to https://ionicframework.com/ for building Ionic development environment.
```
git clone https://github.com/MrMYHuang/cbetar2.git
cd cbetar2
npm run start
```

## 未來功能
1. 支援更新所有離線經文。

## 已知問題
1. iOS Safari在單頁模式下，捲軸無法顯示。
2. 經文註腳、版權無法隱藏(因為會影響跳頁功能正確性)。
3. 目前多數Chrome無法暫停合成語音播放，因此此app目前有聲書功能不支援暫停，只支援停止。
4. 語音播放速度受限不同引擎、語音限制，可能無法達到指定速度。
5. "避免螢幕自動鎖定"功能僅限部分較新Chrome瀏覽器才支援。

## 版本歷史
* 2.5.0:
  * 解決在新電腦直接開啟此app的某經文連結無法正確顯示的問題。
* 2.4.0:
  * 支援以"經"為單位存檔作離線瀏覽。
* 2.3.2:
  * 避免螢幕自動鎖定。
  * 語音播放速度支援至1.5倍。
* 2.3.1:
  * 修正macOS Safari經文語音播放異常問題。
* 2.3.0:
  * 支援經文語音播放功能。
  * 修正部分文字，綁定UI字型大小設定。
* 2.2.11:
  * 修復經文捲軸。
  * 修正單頁直式顯示，"載入中"提示未正確顯示。
* 2.2.10:
  * 修正經文第1次開啟後，加入的書籤被開啟後，無法正確還原書籤位置。
  * 使用黑體作另一種字體選擇。
* 2.2.9:
  * 修正部分對話框字型，綁定UI字型大小設定。
* 2.2.8:
  * 修正"標記(highlight)選取的書籤文字功能失效"。
* 2.2.7:
  * 修正"跳頁100%時，頁面卻切到開頭、不是結尾"。
  * 修正跳頁UI寬度。
* 2.2.6:
  * 修正分頁模式，上/下頁沒有反應問題。
  * 修正直式顯示時，經文上下補白隨視窗寬度增加的問題。
* 2.2.4:
  * 修正"直式、單頁模式，開啟經文卻顯示經文結尾處"。
* 2.2.3:
  * 對話框字型大小綁定UI字型大小設定。
  * 避開macOS Safari 14的bug。
* 2.2.1:
  * 使用iOS黑體解決直式楷書括號方向問題。
* 2.2.0:
  * 經文頁加入"載入中"提示。
  * 若連線CBETA API失敗，會顯示錯誤訊息。
  * 修正經文書籤無法離線瀏覽的問題。
  * 關閉經文中標記選取的書籤文字，以解決切至目錄頁後無法切回經文的問題。
* 2.1.0:
  * 修正書籤頁左滑刪除一書籤後，刪除鈕不會隱藏。
  * 經文頁新增書籤成功會有提示訊息。
  * 修正經文頁用鍵盤操作時會一次跳多頁。
  * Basic Latin字元改用Times New Roman字型。
* 2.0.6:
  * 支援分頁。
  * 書籤改用ePub CFI。
  * 刪除書籤改成在書籤頁左滑，再點刪除。
* 1.6.0:
  * 支援經文捲軸。
* 1.5.10:
  * 使用全字庫字型作楷書支援。
* 1.5.1:
  * 支援直式文字與楷書。
* 1.2.26:
  * 修正app無法在Chrome安裝的問題。
* 1.2.20:
  * 支援app啟動與手動檢查更新。
* 1.0.0:
  * 第1版。

## 隱私政策聲明

此app無收集使用者個人資訊。

## 第三方軟體版權聲明

1. 全字庫字型 ( https://data.gov.tw/dataset/5961 )

    此app使用的全字庫字型(2020-08-18版)由國家發展委員會提供。此開放資料依政府資料開放授權條款 (Open Government Data License) 進行公眾釋出，使用者於遵守本條款各項規定之前提下，得利用之。政府資料開放授權條款：https://data.gov.tw/license