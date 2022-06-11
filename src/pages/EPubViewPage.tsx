import React from 'react';
import { IonPage, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import EPubView from '../components/EPubView';
import { Settings, UiMode } from '../models/Settings';
import CatalogDesktop from '../components/CatalogDesktop';

interface Props {
  dispatch: Function;
  settings: Settings;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  work: string;
  path: string;
  label: string;
}> { }

interface State {
}

class _EPubViewPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <IonPage>
        {
          this.props.settings.uiMode === UiMode.Touch ?
            <EPubView
              history={this.props.history}
              location={this.props.location}
              match={this.props.match}
            />
            :
            <CatalogDesktop
              history={this.props.history}
              location={this.props.location}
              match={this.props.match}
            />
        }
      </IonPage>
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    tmpSettings: state.tmpSettings,
    settings: state.settings,
  };
};

const EPubViewPage = withIonLifeCycle(_EPubViewPage);

export default connect(
  mapStateToProps,
)(EPubViewPage);
