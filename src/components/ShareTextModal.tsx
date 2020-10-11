import React from 'react';
import { IonButton, IonContent, IonLabel, IonModal } from '@ionic/react';
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
}> { }

class _ShareTextModal extends React.Component<PageProps> {
  /*constructor(props: any) {
    super(props);
  }*/

  updateQrCode() {
    navigator.clipboard && navigator.clipboard.writeText(this.props.text);
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
          <div style={{display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center'}}>
            <div>
              <IonLabel className='uiFont'>此頁app連結已複製至剪貼簿！</IonLabel>
            </div>
            <div>
              <IonLabel className='uiFont'>也可以使用QR Code分享:</IonLabel>
            </div>
            <div style={{flexGrow: 1, display: 'flex', alignItems: 'center'}}>
              <canvas id='qrcCanvas' width='500' height='500' style={{margin: '0px auto'}} />
            </div>
            <div>
              <IonButton size='large' onClick={() => this.props.finish()}>關閉</IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>
    );
  }
};

const ShareTextModal = (_ShareTextModal);
export default ShareTextModal;
