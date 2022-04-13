import React from 'react';
import { IonContent, IonLabel, IonModal, IonProgressBar } from '@ionic/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import { RouteComponentProps } from '../models/Prop';

interface Props {
  showModal: boolean;
  progress: number;
}

interface PageProps extends Props, RouteComponentProps<{
}> { }

interface State {
  isAppSettingsExport: Array<boolean>;
}

class _DownloadModal extends React.Component<PageProps, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      isAppSettingsExport: Array<boolean>(Object.keys(Globals.appSettings).length)
    }
  }

  render() {
    return (
      <IonModal
        isOpen={this.props.showModal}
        backdropDismiss={false}
        swipeToClose={false}
      >
        <IonContent>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
            <div style={{marginBottom: '50px'}}>
              <IonLabel className='uiFont'>後端app下載進度</IonLabel>
            </div>
              <IonProgressBar style={{ height: '40px' }} value={this.props.progress} />
              <IonLabel className='uiFont'>{Math.floor(this.props.progress * 100)}%</IonLabel>
          </div>
        </IonContent>
      </IonModal>
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(_DownloadModal);
