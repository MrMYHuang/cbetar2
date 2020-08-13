import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonRange, IonButton, IonLabel } from '@ionic/react';
import { RouteComponentProps, Route } from 'react-router-dom';
import * as uuid from 'uuid';
//import './SettingsPage.css';

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
              <div style={{flexDirection: "column", width: "100%"}}>
              <div style={{ fontSize: this.state.fontSize, wordWrap: "break-all" }}>經文字型大小: {this.state.fontSize}</div>
              <IonRange min={10} max={64} onClick={e => {
                this.setState({
                  fontSize: e.currentTarget.value
                })
              }} /></div>
            </IonItem>
          </IonList>
        </IonContent>
      </IonPage>
    );
  }
};

export default SettingsPage;
