import React from 'react';
import { IonButton, IonCol, IonContent, IonLabel, IonModal, IonRow, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import * as qrcode from 'qrcode';

interface Props {
  showModal: boolean;
  text: string;
  finish: Function;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

class _ShareTextModal extends React.Component<PageProps> {
  /*constructor(props: any) {
    super(props);
  }*/

  updateQrCode() {
    const qrcCanvas = document.getElementById('qrcCanvas');
    qrcode.toCanvas(qrcCanvas, this.props.text, { version: 6, errorCorrectionLevel: 'L', margin: 1 });
    return qrcCanvas;
  }

  render() {
    return (
      <IonModal
        isOpen={this.props.showModal}
        cssClass='uiFont'
        swipeToClose={true}
        //presentingElement={router || undefined}
        onWillPresent={() => this.updateQrCode()}
        onDidDismiss={() => this.props.finish()}>
        <IonContent>
          <IonRow>
            <IonCol>
              <IonLabel className='uiFont'>此頁app連結已複製至剪貼簿！</IonLabel>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonLabel className='uiFont'>也可以使用QR Code分享:</IonLabel>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <canvas id='qrcCanvas' width='500' height='500' />
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton size='large' onClick={() => this.props.finish()}>關閉</IonButton>
            </IonCol>
          </IonRow>
        </IonContent>
      </IonModal>
    );
  }
};

const ShareTextModal = (_ShareTextModal);
export default ShareTextModal;
