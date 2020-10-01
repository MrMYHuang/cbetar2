import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonRange, IonIcon, IonLabel, IonToggle, IonButton, IonAlert, IonSelect, IonSelectOption, IonProgressBar, IonToast } from '@ionic/react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import Globals from '../Globals';
import { helpCircle, text, documentText, refreshCircle, musicalNotes, colorPalette } from 'ionicons/icons';
import './SettingsPage.css';
import PackageInfos from '../../package.json';
import { Bookmark, BookmarkType } from '../models/Bookmark';

interface StateProps {
  showFontLicense: boolean;
  juansDownloadedRatio: number;
  showUpdateAllJuansDone: boolean;
}

interface Props {
  dispatch: Function;
  theme: number;
  uiFontSize: number;
  scrollbarSize: number;
  settings: any;
  showComments: boolean;
  paginated: boolean;
  rtlVerticalLayout: boolean;
  useFontKai: boolean;
  speechRate: number;
  bookmarks: [Bookmark];
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

class SettingsPage extends React.Component<PageProps, StateProps> {
  constructor(props: any) {
    super(props);

    this.state = {
      showFontLicense: false,
      juansDownloadedRatio: 0,
      showUpdateAllJuansDone: false,
    }
  }

  async updateAllJuans() {
    this.setState({ juansDownloadedRatio: 0 });
    const workBookmarksWithHtml = this.props.bookmarks.filter((b) => b.type === BookmarkType.WORK);
    const juanBookmarksWithHtml = this.props.bookmarks.filter((b) => b.type === BookmarkType.JUAN);
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
        localStorage.setItem(fileName, res.htmlStr);
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
      localStorage.setItem(fileName, res.htmlStr);
      console.log(`File saved: ${fileName}`);
    }
    this.setState({ showUpdateAllJuansDone: true });
  }

  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>設定</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={refreshCircle} slot='start' />
              <div style={{ width: '100%' }}>
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>電子佛典app版本: {PackageInfos.version}</IonLabel>
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>檢查app更新 (若無更新則無回應)</IonLabel>
              </div>
              <IonButton slot='end' size='large' style={{ fontSize: 'var(--ui-font-size)' }} onClick={e => {
                Globals.updateApp();
              }}>檢查</IonButton>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={refreshCircle} slot='start' />
              <div style={{ width: '100%' }}>
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>更新離線經文檔</IonLabel>
                <IonProgressBar value={this.state.juansDownloadedRatio} />
              </div>
              <IonButton slot='end' size='large' style={{ fontSize: 'var(--ui-font-size)' }} onClick={async (e) => this.updateAllJuans()}>更新</IonButton>
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
              <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>佈景主題</IonLabel>
              <IonSelect slot='end'
                value={this.props.theme}
                style={{ fontSize: 'var(--ui-font-size)' }}
                interface='popover'
                interfaceOptions={{ cssClass: 'cbetar2themes' }}
                onIonChange={e => {
                  const value = e.detail.value;
                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'theme',
                    val: value,
                  });
                  document.body.classList.forEach((val) => document.body.classList.remove(val));
                  document.body.classList.toggle(`theme${value}`, true);
                }}>
                <IonSelectOption className='cbeta' value={0}>CBETA</IonSelectOption>
                <IonSelectOption className='dark' value={1}>暗色</IonSelectOption>
                <IonSelectOption className='light' value={2}>亮色</IonSelectOption>
                <IonSelectOption className='oldPaper' value={3}>舊書</IonSelectOption>
                <IonSelectOption className='marble' value={4}>大理石</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={documentText} slot='start' />
              <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>經文直式、右至左書寫</IonLabel>
              <IonToggle slot='end' checked={this.props.rtlVerticalLayout} onIonChange={e => {
                const isChecked = e.detail.checked;
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
              <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>單頁/分頁</IonLabel>
              <IonToggle slot='end' checked={this.props.paginated} onIonChange={e => {
                const isChecked = e.detail.checked;
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
              <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>單頁經文捲軸大小</IonLabel>
              <IonSelect slot='end'
                value={this.props.scrollbarSize}
                style={{ fontSize: 'var(--ui-font-size)' }}
                interface='popover'
                interfaceOptions={{ cssClass: 'uiFont' }}
                onIonChange={e => {
                  const value = e.detail.value;
                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'scrollbarSize',
                    val: value,
                  });
                  Globals.updateCssVars(this.props.settings);
                }}>
                <IonSelectOption value={0}>無</IonSelectOption>
                <IonSelectOption value={1}>中</IonSelectOption>
                <IonSelectOption value={2}>大</IonSelectOption>
              </IonSelect>
            </IonItem>
            {/*
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. * /}
              <IonIcon icon={documentText} slot='start' />
              <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>顯示經文註解、版權</IonLabel>
              <IonToggle slot='end' checked={this.props.showComments} onIonChange={e => {
                const isChecked = e.detail.checked;
                (this.props as any).dispatch({
                  type: "SET_KEY_VAL",
                  key: 'showComments',
                  val: isChecked
                });
              }} />
            </IonItem>
            */}
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={text} slot='start' />
              <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>黑體/楷書字體(初次載入要等待)</IonLabel>
              <IonToggle slot='end' checked={this.props.useFontKai} onIonChange={e => {
                const isChecked = e.detail.checked;
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
                  <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>UI字型大小: {this.props.uiFontSize}</IonLabel>
                  <IonRange min={10} max={64} value={this.props.uiFontSize} onIonChange={e => {
                    this.props.dispatch({
                      type: "SET_KEY_VAL",
                      key: 'uiFontSize',
                      val: e.detail.value,
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
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>經文字型大小: {this.props.settings.fontSize}</IonLabel>
                <IonRange min={10} max={64} value={this.props.settings.fontSize} onIonChange={e => {
                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'fontSize',
                    val: e.detail.value,
                  });
                }} />
              </div>
            </IonItem>
            <IonItem>
              <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
              <IonIcon icon={musicalNotes} slot='start' />
              <div className="contentBlock">
                <div style={{ flexDirection: "column" }}>
                  <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>合成語音語速: {this.props.speechRate}</IonLabel>
                  <IonRange min={0.1} max={1.5} step={0.1} value={this.props.speechRate} onIonChange={e => {
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
              <div style={{ fontSize: 'var(--ui-font-size)' }}>
                <div>關於</div>
                <div><a href="https://github.com/MrMYHuang/cbetar2#web-app" target="_new">程式安裝說明</a></div>
                <div><a href="https://github.com/MrMYHuang/cbetar2" target="_new">操作說明與開放原始碼</a></div>
                <div>CBETA API版本: {Globals.apiVersion}</div>
                <div><a href="http://cbdata.dila.edu.tw/v1.2/" target="_new">CBETA API參考文件</a></div>
                <div><a href="http://glossaries.dila.edu.tw/?locale=zh-TW" target="_new">DILA 佛學術語字辭典</a></div>
                <div>作者: Meng-Yuan Huang</div>
                <div><a href="mailto:myh@live.com" target="_new">myh@live.com</a></div>
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
              message="此app使用的全字庫字型(2020-08-18版)由國家發展委員會提供。此開放資料依政府資料開放授權條款 (Open Government Data License) 進行公眾釋出，使用者於遵守本條款各項規定之前提下，得利用之。政府資料開放授權條款：https://data.gov.tw/license"
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
        </IonContent>
      </IonPage >
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    settings: state.settings,
    theme: state.settings.theme,
    showComments: state.settings.showComments,
    paginated: state.settings.paginated,
    rtlVerticalLayout: state.settings.rtlVerticalLayout,
    scrollbarSize: state.settings.scrollbarSize,
    useFontKai: state.settings.useFontKai,
    uiFontSize: state.settings.uiFontSize,
    speechRate: state.settings.speechRate,
    bookmarks: state.settings.bookmarks,
  }
};

export default connect(
  mapStateToProps,
)(SettingsPage);
