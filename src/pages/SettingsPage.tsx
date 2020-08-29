import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonRange, IonIcon, IonLabel, IonToggle, IonButton, IonAlert } from '@ionic/react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import Globals from '../Globals';
import { star, helpCircle, text, moon, documentText, refreshCircle } from 'ionicons/icons';
import './SettingsPage.css';
import PackageInfos from '../../package.json';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

class SettingsPage extends React.Component<PageProps> {
  constructor(props: any) {
    super(props);

    this.state = {
      showFontLicense: false,
    }
  }

  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: (this.props as any).uiFontSize }}>設定</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonItem>
              <IonIcon icon={moon} slot='start' />
              <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).uiFontSize }}>暗色模式</IonLabel>
              <IonToggle slot='end' checked={(this.props as any).darkMode} onIonChange={e => {
                const isChecked = e.detail.checked;
                document.body.classList.toggle('dark', isChecked);
                (this.props as any).dispatch({
                  type: "SET_KEY_VAL",
                  key: 'darkMode',
                  val: isChecked
                });
              }} />
            </IonItem>
            <IonItem>
              <IonIcon icon={documentText} slot='start' />
              <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).uiFontSize }}>經文直式、右至左書寫</IonLabel>
              <IonToggle slot='end' checked={(this.props as any).rtlVerticalLayout} onIonChange={e => {
                const isChecked = e.detail.checked;
                (this.props as any).dispatch({
                  type: "SET_KEY_VAL",
                  key: 'rtlVerticalLayout',
                  val: isChecked
                });
              }} />
            </IonItem>
            <IonItem>
              <IonIcon icon={documentText} slot='start' />
              <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).uiFontSize }}>顯示經文註解、版權</IonLabel>
              <IonToggle slot='end' checked={(this.props as any).showComments} onIonChange={e => {
                const isChecked = e.detail.checked;
                (this.props as any).dispatch({
                  type: "SET_KEY_VAL",
                  key: 'showComments',
                  val: isChecked
                });
              }} />
            </IonItem>
            <IonItem>
              <IonIcon icon={text} slot='start' />
              <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).uiFontSize }}>楷書字型(初次載入要等待)</IonLabel>
              <IonToggle slot='end' checked={(this.props as any).useFontKai} onIonChange={e => {
                const isChecked = e.detail.checked;
                Globals.updateFont(isChecked);
                (this.props as any).dispatch({
                  type: "SET_KEY_VAL",
                  key: 'useFontKai',
                  val: isChecked
                });
              }} />
            </IonItem>
            <IonItem>
              <IonIcon icon={text} slot='start' />
              <div className="contentBlock">
                <div style={{ flexDirection: "column" }}>
                  <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).uiFontSize }}>UI字型大小: {(this.props as any).settings.uiFontSize}</IonLabel>
                  <IonRange min={10} max={64} value={(this.props as any).settings.uiFontSize} onIonChange={e => {
                    (this.props as any).dispatch({
                      type: "SET_KEY_VAL",
                      key: 'uiFontSize',
                      val: e.detail.value,
                    });
                  }} />
                </div>
              </div>
            </IonItem>
            <IonItem>
              <IonIcon icon={text} slot='start' />
              <div className="contentBlock">
                <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).uiFontSize }}>經文字型大小: {(this.props as any).settings.fontSize}</IonLabel>
                <IonRange min={10} max={64} value={(this.props as any).settings.fontSize} onIonChange={e => {
                  (this.props as any).dispatch({
                    type: "SET_KEY_VAL",
                    key: 'fontSize',
                    val: e.detail.value,
                  });
                }} />
              </div>
            </IonItem>
            <IonItem>
              <IonIcon icon={star} slot='start' />
              <div>
                <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).uiFontSize }}>特色</IonLabel>
                <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).uiFontSize }}>搜尋經文、書籤功能、離線瀏覽、暗色模式、字型調整、直式文字。</IonLabel>
              </div>
            </IonItem>
            <IonItem>
              <IonIcon icon={helpCircle} slot='start' />
              <div style={{ fontSize: (this.props as any).uiFontSize }}>
                <div>關於</div>
                <div>程式版本: {PackageInfos.version}</div>
                <div>CBETA API版本: {Globals.apiVersion}</div>
                <div>作者: Meng-Yuan Huang</div>
                <div><a href="mailto:myh@live.com" target="__new">myh@live.com</a></div>
                <div><a href="https://github.com/MrMYHuang/cbetar2" target="__new">操作說明與開放原始碼</a></div>
                <div><a href="http://cbdata.dila.edu.tw/v1.2/" target="__new">CBETA API參考文件</a></div>
                <div><a href='javascript:void(0)' onClick={e => this.setState({ showFontLicense: true })}>全字庫字型版權聲明</a></div>
              </div>
            </IonItem>
            <IonItem>
              <IonIcon icon={refreshCircle} slot='start' />
              <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).uiFontSize }}>檢查app更新 (若無更新則無回應)</IonLabel>
              <IonButton slot='end' size='large' style={{ fontSize: (this.props as any).uiFontSize }} onClick={e => {
                Globals.updateApp();
              }}>檢查</IonButton>
            </IonItem>
            <IonAlert
              isOpen={(this.state as any).showFontLicense}
              backdropDismiss={false}
              message="此app使用的全字庫字型(2020-08-18版)由國家發展委員會提供。此開放資料依政府資料開放授權條款 (Open Government Data License) 進行公眾釋出，使用者於遵守本條款各項規定之前提下，得利用之。政府資料開放授權條款：https://data.gov.tw/license"
              buttons={[
                {
                  text: '關閉',
                  cssClass: 'primary',
                  handler: (value) => {
                    this.setState({
                      showFontLicense: false,
                    });
                  },
                },
                {
                  text: '開啟授權',
                  cssClass: 'secondary',
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
    darkMode: state.settings.darkMode,
    showComments: state.settings.showComments,
    rtlVerticalLayout: state.settings.rtlVerticalLayout,
    useFontKai: state.settings.useFontKai,
    uiFontSize: state.settings.uiFontSize,
  }
};

export default connect(
  mapStateToProps,
)(SettingsPage);
