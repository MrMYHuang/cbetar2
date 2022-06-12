import React from 'react';
import { IonPage, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Bookmark } from '../models/Bookmark';
import { TmpSettings } from '../models/TmpSettings';
import { Settings, UiMode } from '../models/Settings';
import WorkTouch from '../components/WorkTouch';
import CatalogDesktop from '../components/CatalogDesktop';

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface PageProps extends Props, RouteComponentProps<{
}> { }

interface State {
}

class _WorkPage extends React.Component<PageProps, State> {
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
            <WorkTouch
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

const WorkPage = withIonLifeCycle(_WorkPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    tmpSettings: state.tmpSettings,
    settings: state.settings,
  };
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(WorkPage);
