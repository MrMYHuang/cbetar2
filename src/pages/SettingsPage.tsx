import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonRange, IonIcon, IonLabel, IonToggle, IonButton, IonAlert, IonSelect, IonSelectOption, IonProgressBar, IonToast, withIonLifeCycle } from '@ionic/react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import Globals from '../Globals';
import { helpCircle, text, documentText, refreshCircle, musicalNotes, colorPalette, bug, download, print, informationCircle } from 'ionicons/icons';

import './SettingsPage.css';
import PackageInfos from '../../package.json';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { Settings } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';

interface StateProps {
  showFontLicense: boolean;
  juansDownloadedRatio: number;
  showUpdateAllJuansDone: boolean;
  showBugReportAlert: boolean;
  showClearAlert: boolean;
  showToast: boolean;
  toastMessage: string;
}

interface Props {
  dispatch: Function;
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

class _SettingsPage extends React.Component<PageProps, StateProps> {
  constructor(props: any) {
    super(props);

    this.state = {
      showFontLicense: false,
      juansDownloadedRatio: 0,
      showBugReportAlert: false,
      showUpdateAllJuansDone: false,
      showClearAlert: false,
      showToast: false,
      toastMessage: '',
    };
  }

  ionViewWillEnter() {
  }

  updateBookmark(newBookmarks: Array<Bookmark>, newBookmark: Bookmark) {
    const updateIndex = newBookmarks.findIndex((b: Bookmark) => b.uuid === newBookmark.uuid);
    if (updateIndex === -1) {
      console.error(`Update bookmark fails! Can't find the original bookmark with UUID: ${newBookmark.uuid}`);
    } else {
      newBookmarks[updateIndex] = newBookmark;
    }
    return;
  }

  async updateAllJuans() {
    this.setState({ juansDownloadedRatio: 0 });
    const workBookmarksWithHtml = this.props.settings.bookmarks.filter((b) => b.type === BookmarkType.WORK);
    const juanBookmarksWithHtml = this.props.settings.bookmarks.filter((b) => b.type === BookmarkType.JUAN);
    const juanBookmarksNotInWorkBookmarksWithHtml = juanBookmarksWithHtml.filter((b) => workBookmarksWithHtml.findIndex((wb) => wb.work?.work === b.work?.work) === -1);

    // Total juans to download.
    let juansToDownload = juanBookmarksNotInWorkBookmarksWithHtml.length;
    for (let i = 0; i < workBookmarksWithHtml.length; i++) {
      const work = workBookmarksWithHtml[i].work!;
      juansToDownload += work.juan_list.split(',').length;
    }

    let juansDownloaded = 0;
    for (let i = 0; i < workBookmarksWithHtml.length; i++) {
      const bookmarkWithHtml = workBookmarksWithHtml[i];
      const work = bookmarkWithHtml.work!;
      const juans = work.juan_list.split(',');
      for (let j = 0; j < juans.length; j++) {
        const fetchJuan = juans[j];
        juansDownloaded += 1;
        this.setState({ juansDownloadedRatio: juansDownloaded / juansToDownload });
        const res = await Globals.fetchJuan(work.work, fetchJuan, null, true);
        const fileName = Globals.getFileName(work.work, fetchJuan);
        // Update HTML.
        if (!this.props.tmpSettings.cbetaOfflineDbMode) {
          Globals.saveFileToIndexedDB(fileName, res.htmlStr);
        }
        if (j === 0) {
          // Update bookmarks for once.
          this.updateBookmark(this.props.settings.bookmarks, Object.assign(bookmarkWithHtml, { work: res.workInfo }));
        }
        console.log(`File saved: ${fileName}`);
      }
    }
    for (let i = 0; i < juanBookmarksNotInWorkBookmarksWithHtml.length; i++) {
      juansDownloaded += 1;
      this.setState({ juansDownloadedRatio: juansDownloaded / juansToDownload });
      const bookmarkWithHtml = juanBookmarksNotInWorkBookmarksWithHtml[i];
      const work = bookmarkWithHtml.work!;
      const res = await Globals.fetchJuan(work.work, `${work.juan}`, null, true);
      const fileName = Globals.getFileName(work.work, `${work.juan}`);
      let newWork = res.workInfo;
      newWork.juan = work.juan;
      // Update HTML.
      if (!this.props.tmpSettings.cbetaOfflineDbMode) {
        Globals.saveFileToIndexedDB(fileName, res.htmlStr);
      }
      // Update bookmarks
      this.updateBookmark(this.props.settings.bookmarks, Object.assign(bookmarkWithHtml, { work: newWork }));
      console.log(`File saved: ${fileName}`);
    }

    this.props.dispatch({
      type: "UPDATE_BOOKMARKS",
      bookmarks: this.props.settings.bookmarks,
    });
    this.setState({ showUpdateAllJuansDone: true });
  }

  reportText = '';
  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle className='uiFont'>設定</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            {/*
            // Disable this for Apple App Store submissions!
            <IonItem>
              <IonIcon icon={shareSocial} slot='start' />
              <IonLabel className='ion-text-wrap uiFont' onClick={async e => {
                const hasUpdate = await Globals.updateApp();

                if (!hasUpdate) {
                  this.setState({ showToast: true, toastMessage: 'App 已是最新版' });
                }
              }}>PWA版本: <a href="https://github.com/MrMYHuang/cbetar2#history" target="_new">{PackageInfos.pwaVersion}</a></IonLabel>
              <IonButton fill='outline' shape='round' slot='end' size='large' className='uiFont' onClick={e => {
                this.props.dispatch({
                  type: "TMP_SET_KEY_VAL",
                  key: 'shareTextModal',
                  val: {
                    show: true,
                    text: window.location.origin,
                  },
                });
              }}>分享</IonButton>
            </IonItem>
            <IonItem hidden={!this.props.tmpSettings.mainVersion}>
              <IonIcon icon={informationCircle} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>Backend app版本: {this.props.tmpSettings.mainVersion}</IonLabel>
            </IonItem>
          */}
            <IonItem hidden={!this.props.tmpSettings.mainVersion}>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={informationCircle} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>使用CBETA離線經文資料檔</IonLabel>
              <IonToggle slot='end' disabled checked={this.props.tmpSettings.cbetaOfflineDbMode} />
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={bug} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'><a href="https://github.com/MrMYHuang/cbetar2#report" target="_new">啟用app異常記錄</a></IonLabel>
              <IonToggle slot='end' checked={this.props.settings.hasAppLog} onIonChange={e => {
                const isChecked = e.detail.checked;

                if (this.props.settings.hasAppLog === isChecked) {
                  return;
                }

                isChecked ? Globals.enableAppLog() : Globals.disableAppLog();
                this.props.dispatch({
                  type: "SET_KEY_VAL",
                  key: 'hasAppLog',
                  val: isChecked
                });
              }} />
            </IonItem>
            <IonItem hidden={!this.props.settings.hasAppLog}>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={bug} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>回報app異常記錄</IonLabel>
              <IonButton fill='outline' shape='round' slot='end' size='large' className='uiFont' onClick={e => {
                this.reportText = "問題描述(建議填寫)：\n\n瀏覽器：" + navigator.userAgent + "\n\nApp版本：" + PackageInfos.pwaVersion + "\n\nApp設定：" + JSON.stringify(this.props.settings) + "\n\nLog：\n" + Globals.getLog();
                this.setState({ showBugReportAlert: true });
              }}>回報</IonButton>
              <IonAlert
                cssClass='uiFont'
                backdropDismiss={false}
                isOpen={this.state.showBugReportAlert}
                header={'異常回報'}
                subHeader='輸入您的 E-mail，以後續聯絡'
                inputs={[
                  {
                    name: 'name0',
                    type: 'email',
                    placeholder: '例：abc@example.com'
                  },
                ]}
                buttons={[
                  {
                    text: '送出',
                    cssClass: 'primary uiFont',
                    handler: async (value) => {
                      try {
                        await Globals.axiosInstance.post(Globals.bugReportApiUrl, {
                          subject: `${PackageInfos.productName}異常記錄回報`,
                          text: `E-mail: ${value.name0}\n${this.reportText}`,
                        });
                        this.setState({ showBugReportAlert: false, showToast: true, toastMessage: `異常回報成功` });
                      } catch (error) {
                        console.error(error);
                        this.setState({ showBugReportAlert: false, showToast: true, toastMessage: `異常回報失敗` });
                      }
                    },
                  },
                  {
                    text: '取消',
                    role: 'cancel',
                    cssClass: 'secondary uiFont',
                    handler: () => this.setState({ showBugReportAlert: false }),
                  },
                ]}
              />
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={download} slot='start' />
              <div className='contentBlock'>
                <div style={{ flexDirection: 'column' }}>
                  <IonLabel className='ion-text-wrap uiFont'>App設定與書籤</IonLabel>
                  <div style={{ textAlign: 'right' }}>
                    <IonButton fill='outline' shape='round' size='large' className='uiFont' onClick={async (e) => {
                      const settingsJsonUri = `data:text/json;charset=utf-8,${encodeURIComponent(localStorage.getItem(Globals.storeFile) || '')}`;
                      const a = document.createElement('a');
                      a.href = settingsJsonUri;
                      a.download = Globals.storeFile;
                      a.click();
                      a.remove();
                    }}>匯出</IonButton>
                    <input id='importJsonInput' type='file' accept='.json' style={{ display: 'none' }} onChange={async (ev) => {
                      const file = ev.target.files?.item(0);
                      const fileText = await file?.text() || '';
                      try {
                        // JSON text validation.
                        JSON.parse(fileText);
                        localStorage.setItem(Globals.storeFile, fileText);
                        this.props.dispatch({ type: 'LOAD_SETTINGS' });
                        this.updateAllJuans();
                      } catch (e) {
                        console.error(e);
                        console.error(new Error().stack);
                      }
                      (document.getElementById('importJsonInput') as HTMLInputElement).value = '';
                    }} />

                    <IonButton fill='outline' shape='round' size='large' className='uiFont' onClick={(e) => {
                      (document.querySelector('#importJsonInput') as HTMLInputElement).click();
                    }}>匯入</IonButton
                    >
                    <IonButton fill='outline' shape='round' size='large' className='uiFont' onClick={(e) => {
                      this.setState({ showClearAlert: true });
                    }}>重置</IonButton>
                    <IonAlert
                      cssClass='uiFont'
                      isOpen={this.state.showClearAlert}
                      backdropDismiss={false}
                      onDidPresent={(ev) => {
                      }}
                      header={'重置會還原app設定預設值並清除書籤、字型檔！確定重置？'}
                      buttons={[
                        {
                          text: '取消',
                          cssClass: 'primary uiFont',
                          handler: (value) => {
                            this.setState({
                              showClearAlert: false,
                            });
                          },
                        },
                        {
                          text: '重置',
                          cssClass: 'secondary uiFont',
                          handler: async (value) => {
                            await Globals.clearAppData();
                            this.props.dispatch({ type: 'DEFAULT_SETTINGS' });
                            while (document.body.classList.length > 0) {
                              document.body.classList.remove(document.body.classList.item(0)!);
                            }
                            document.body.classList.toggle(`theme${this.props.settings.theme}`, true);
                            document.body.classList.toggle(`print${this.props.settings.printStyle}`, true);
                            this.setState({ showClearAlert: false, showToast: true, toastMessage: "清除成功!" });
                          },
                        }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={refreshCircle} slot='start' />
              <div style={{ width: '100%' }}>
                <IonLabel className='ion-text-wrap uiFont'>更新離線經文檔</IonLabel>
                <IonProgressBar value={this.state.juansDownloadedRatio} />
              </div>
              <IonButton fill='outline' shape='round' slot='end' size='large' className='uiFont' onClick={async (e) => this.updateAllJuans()}>更新</IonButton>
              <IonToast
                cssClass='uiFont'
                isOpen={this.state.showUpdateAllJuansDone}
                onDidDismiss={() => this.setState({ showUpdateAllJuansDone: false })}
                message={`離線經文檔更新完畢！`}
                duration={2000}
              />
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={colorPalette} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>{Globals.appSettings['theme']}</IonLabel>
              <IonSelect slot='end'
                value={this.props.settings.theme}
                className='uiFont'
                interface='popover'
                interfaceOptions={{ cssClass: 'cbetar2themes' }}
                onIonChange={e => {
                  const value = +e.detail.value;
                  // Important! Because it can results in rerendering of its parent component but
                  // store states of this component is not updated yet! And IonSelect value is changed
                  // back to the old value and onIonChange is triggered again!
                  // Thus, we use this check to ignore this invalid change.
                  if (this.props.settings.theme === value) {
                    return;
                  }

                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'theme',
                    val: value,
                  });
                }}>
                <IonSelectOption className='uiFont cbeta' value={0}>CBETA</IonSelectOption>
                <IonSelectOption className='uiFont dark' value={1}>暗色</IonSelectOption>
                <IonSelectOption className='uiFont light' value={2}>亮色</IonSelectOption>
                <IonSelectOption className='uiFont oldPaper' value={3}>舊書</IonSelectOption>
                <IonSelectOption className='uiFont marble' value={4}>大理石</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={documentText} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>{Globals.appSettings['rtlVerticalLayout']}</IonLabel>
              <IonToggle slot='end' checked={this.props.settings.rtlVerticalLayout} onIonChange={e => {
                const isChecked = e.detail.checked;

                if (this.props.settings.rtlVerticalLayout === isChecked) {
                  return;
                }

                this.props.dispatch({
                  type: "SET_KEY_VAL",
                  key: 'rtlVerticalLayout',
                  val: isChecked
                });
              }} />
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={documentText} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>{Globals.appSettings['paginated']}</IonLabel>
              <IonToggle slot='end' checked={this.props.settings.paginated} onIonChange={e => {
                const isChecked = e.detail.checked;

                if (this.props.settings.paginated === isChecked) {
                  return;
                }

                this.props.dispatch({
                  type: "SET_KEY_VAL",
                  key: 'paginated',
                  val: isChecked
                });
              }} />
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={documentText} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>單頁經文捲軸大小</IonLabel>
              <IonSelect slot='end'
                value={this.props.settings.scrollbarSize}
                className='uiFont'
                interface='popover'
                interfaceOptions={{ cssClass: 'uiFont' }}
                onIonChange={e => {
                  const value = +e.detail.value;
                  if (this.props.settings.scrollbarSize === value) {
                    return;
                  }

                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'scrollbarSize',
                    val: value,
                  });
                  Globals.updateCssVars(this.props.settings);
                }}>
                <IonSelectOption className='uiFont' value={0}>無</IonSelectOption>
                <IonSelectOption className='uiFont' value={1}>中</IonSelectOption>
                <IonSelectOption className='uiFont' value={2}>大</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={documentText} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>{Globals.appSettings['showComments']}</IonLabel>
              <IonToggle slot='end' checked={this.props.settings.showComments} onIonChange={e => {
                const isChecked = e.detail.checked;

                if (this.props.settings.showComments === isChecked) {
                  return;
                }

                (this.props as any).dispatch({
                  type: "SET_KEY_VAL",
                  key: 'showComments',
                  val: isChecked
                });
              }} />
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={text} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>{Globals.appSettings['useFontKai']}</IonLabel>
              <IonToggle slot='end' checked={this.props.settings.useFontKai} onIonChange={e => {
                const isChecked = e.detail.checked;

                if (this.props.settings.useFontKai === isChecked) {
                  return;
                }

                (this.props as any).dispatch({
                  type: "SET_KEY_VAL",
                  key: 'useFontKai',
                  val: isChecked
                });
                Globals.updateCssVars(this.props.settings);
              }} />
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={text} slot='start' />
              <div className="contentBlock">
                <div style={{ flexDirection: "column" }}>
                  <IonLabel className='ion-text-wrap uiFont'>{Globals.appSettings['uiFontSize']}: {this.props.settings.uiFontSize}</IonLabel>
                  <IonRange min={10} max={128} pin={true} snaps={true} value={this.props.settings.uiFontSize} onIonChange={e => {
                    this.props.dispatch({
                      type: "SET_KEY_VAL",
                      key: 'uiFontSize',
                      val: +e.detail.value,
                    });
                    Globals.updateCssVars(this.props.settings);
                  }} />
                </div>
              </div>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={text} slot='start' />
              <div className="contentBlock">
                <IonLabel className='ion-text-wrap uiFont'>{Globals.appSettings['fontSize']}: <span className='textFont'>{this.props.settings.fontSize}</span></IonLabel>
                <IonRange min={10} max={128} pin={true} snaps={true} value={this.props.settings.fontSize} onIonChange={e => {
                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'fontSize',
                    val: e.detail.value,
                  });
                  Globals.updateCssVars(this.props.settings);
                }} />
              </div>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={print} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>{Globals.appSettings['printStyle']}</IonLabel>
              <IonSelect slot='end'
                value={this.props.settings.printStyle}
                className='uiFont'
                interface='popover'
                interfaceOptions={{ cssClass: 'cbetar2themes' }}
                onIonChange={e => {
                  const value = +e.detail.value;
                  if (this.props.settings.printStyle === value) {
                    return;
                  }

                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'printStyle',
                    val: value,
                  });
                }}>
                <IonSelectOption className='uiFont blackWhite printVar' value={0}>白底黑字</IonSelectOption>
                <IonSelectOption className='uiFont manuscript printVar' value={1}>抄經本</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={print} slot='start' />
              <IonLabel className='ion-text-wrap uiFont'>合成語音</IonLabel>
              <IonSelect slot='end'
                value={this.props.settings.voiceURI}
                className='uiFont'
                interface='action-sheet'
                cancelText='取消'
                onIonChange={e => {
                  const value = e.detail.value;
                  if (this.props.settings.voiceURI === value) {
                    return;
                  }

                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'voiceURI',
                    val: value,
                  });
                }}>
                {
                  Globals.zhVoices().map((v, i) => <IonSelectOption key={i} className='uiFont blackWhite printVar' value={v.voiceURI}>{v.name}</IonSelectOption>)
                }
              </IonSelect>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={musicalNotes} slot='start' />
              <div className="contentBlock">
                <div style={{ flexDirection: "column" }}>
                  <IonLabel className='ion-text-wrap uiFont'><a href="https://github.com/MrMYHuang/cbetar2#text2speech" target="_new">合成語音語速</a>: {this.props.settings.speechRate}</IonLabel>
                  <IonRange min={0.1} max={1.5} step={0.1} snaps={true} value={this.props.settings.speechRate} onIonChange={e => {
                    this.props.dispatch({
                      type: "SET_KEY_VAL",
                      key: 'speechRate',
                      val: (e.detail.value as number).toFixed(1),
                    });
                  }} />
                </div>
              </div>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={helpCircle} slot='start' />
              <div className='uiFont'>
                <div>關於</div>
                <div><a href="https://github.com/MrMYHuang/cbetar2" target="_new">操作說明</a></div>
                <div>CBETA API 版本: {Globals.apiVersion}</div>
                <div><a href="http://cbdata.dila.edu.tw/v1.2/" target="_new">CBETA API 參考文件</a></div>
                <div><a href="http://glossaries.dila.edu.tw/?locale=zh-TW" target="_new">DILA 佛學術語字辭典</a></div>
                <div>作者: Meng-Yuan Huang</div>
                <div><a href="mailto:myh@live.com" target="_new">myh@live.com</a></div>
                <div><a href="https://github.com/MrMYHuang/cbetar2#contributors" target="_new">App 相關貢獻者</a></div>
                <div><a href='/' onClick={e => {
                  e.preventDefault();
                  this.setState({ showFontLicense: true });
                }}>全字庫字型版權聲明</a></div>
              </div>
            </IonItem>
            <IonAlert
              cssClass='uiFont'
              isOpen={this.state.showFontLicense}
              backdropDismiss={false}
              message="此 app 使用的全字庫字型(2020-08-18版)由國家發展委員會提供。此開放資料依政府資料開放授權條款 (Open Government Data License) 進行公眾釋出，使用者於遵守本條款各項規定之前提下，得利用之。政府資料開放授權條款：https://data.gov.tw/license"
              buttons={[
                {
                  text: '關閉',
                  cssClass: 'primary uiFont',
                  handler: (value) => {
                    this.setState({
                      showFontLicense: false,
                    });
                  },
                },
                {
                  text: '開啟授權',
                  cssClass: 'secondary uiFont',
                  handler: (value) => {
                    this.setState({
                      showFontLicense: false,
                    });
                    window.open('https://data.gov.tw/license');
                  },
                }
              ]}
            />
          </IonList>

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showToast}
            onDidDismiss={() => this.setState({ showToast: false })}
            message={this.state.toastMessage}
            duration={2000}
          />
        </IonContent>
      </IonPage >
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    settings: state.settings,
    tmpSettings: state.tmpSettings,
  }
};

const SettingsPage = withIonLifeCycle(_SettingsPage);

export default connect(
  mapStateToProps,
)(SettingsPage);
