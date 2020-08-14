import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonRange, IonButton, IonLabel, IonIcon } from '@ionic/react';
import { RouteComponentProps, Route } from 'react-router-dom';
import * as uuid from 'uuid';
import Globals from '../Globals';
import { star, helpCircleOutline, helpCircle, language, text } from 'ionicons/icons';
import './SettingsPage.css';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

class SettingsPage extends React.Component<PageProps> {
  constructor(props) {
    super(props);
    this.state = {
      fontSize: 12
    };
  }

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
              <div class="contentBlock">
                <div style={{ flexDirection: "column" }}>
                  <div>列表字型大小: {this.state.fontSize}</div>
                  <IonRange min={10} max={64} onIonChange={e => {
                    this.setState({
                      fontSize: e.currentTarget.value
                    })
                  }} />
                </div>
              </div>
            </IonItem>
          <IonItem>
            <div><IonIcon icon={text}></IonIcon></div>
            <div class="contentBlock">
              <div style={{ flexDirection: "column" }}>
                <div>經文字型大小: {this.state.fontSize}</div>
                <IonRange min={10} max={64} onIonChange={e => {
                  this.setState({
                    fontSize: e.currentTarget.value
                  })
                }} /></div>
            </div>
          </IonItem>
          <IonItem>
            <div><IonIcon icon={star}></IonIcon></div>
            <div class="contentBlock">
              <div>特色</div>
              <div>搜尋經文、書籤功能、離線瀏覽、暗色模式、字型調整。</div>
            </div>
          </IonItem>
          <IonItem style={{ alignItems: "start" }}>
            <div><IonIcon icon={helpCircle}></IonIcon></div>
            <div class="contentBlock">
              <div>關於</div>
              <div></div>
              <div>CBETA API版本: {Globals.apiVersion}</div>
              <div>作者: Meng-Yuan Huang</div>
              <div><a href="mailto:myh@live.com">myh@live.com</a></div>
              <div><a href="https://github.com/MrMYHuang/cbetar2">操作說明與開放原始碼</a></div>
              <div><a href="http://cbdata.dila.edu.tw/v1.2/">CBETA API參考文件</a></div>
            </div>
          </IonItem>
          </IonList>
        </IonContent>
      </IonPage >
    );
  }
};

export default SettingsPage;
