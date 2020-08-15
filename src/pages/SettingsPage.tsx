import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonRange, IonIcon } from '@ionic/react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';
import Globals from '../Globals';
import { star, helpCircle, text } from 'ionicons/icons';
import './SettingsPage.css';
import PackageInfos from '../../package.json';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

class SettingsPage extends React.Component<PageProps> {
  /*
  constructor(props: any) {
    super(props);
  }*/

  uuidStr = '';
  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>設定</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonItem>
              <div><IonIcon icon={text}></IonIcon></div>
              <div className="contentBlock">
                <div style={{ flexDirection: "column" }}>
                  <div>列表字型大小: {this.props.settings.listFontSize}</div>
                  <IonRange min={10} max={64} value={this.props.settings.listFontSize} onIonChange={e => {
                    this.props.dispatch({
                      type: "SET_KEY_VAL",
                      key: 'listFontSize',
                      val: e?.currentTarget?.value
                    });
                  }} />
                </div>
              </div>
            </IonItem>
            <IonItem>
              <div><IonIcon icon={text}></IonIcon></div>
              <div class="contentBlock">
                <div style={{ flexDirection: "column" }}>
                  <div>經文字型大小: {this.props.settings.fontSize}</div>
                  <IonRange min={10} max={64} value={this.props.settings.fontSize} onIonChange={e => {
                    this.props.dispatch({
                      type: "SET_KEY_VAL",
                      key: 'fontSize',
                      val: e.currentTarget.value
                    });
                  }} /></div>
              </div>
            </IonItem>
            <IonItem>
              <div><IonIcon icon={star}></IonIcon></div>
              <div class="contentBlock">
                <div>特色</div>
                <div>搜尋經文、書籤功能、離線瀏覽、暗色主題、字型調整。</div>
              </div>
            </IonItem>
            <IonItem style={{ alignItems: "start" }}>
              <div><IonIcon icon={helpCircle}></IonIcon></div>
              <div class="contentBlock">
                <div>關於</div>
                <div>程式版本: {PackageInfos.version}</div>
                <div>CBETA API版本: {Globals.apiVersion}</div>
                <div>作者: Meng-Yuan Huang</div>
                <div><a href="mailto:myh@live.com" target="__new">myh@live.com</a></div>
                <div><a href="https://github.com/MrMYHuang/cbetar2" target="__new">操作說明與開放原始碼</a></div>
                <div><a href="http://cbdata.dila.edu.tw/v1.2/" target="__new">CBETA API參考文件</a></div>
              </div>
            </IonItem>
          </IonList>
        </IonContent>
      </IonPage >
    );
  }
};

const mapStateToProps = (state /*, ownProps*/) => {
  return {
    settings: state.settings
  }
};

export default connect(
  mapStateToProps,
)(SettingsPage);
