import React from 'react';
import { IonPage, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Bookmark } from '../models/Bookmark';
import { TmpSettings } from '../models/TmpSettings';
import { Settings } from '../models/Settings';
import WorkTouch from '../components/WorkTouch';

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
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
      <IonPage id='WorkPage'>
        <WorkTouch
          history={this.props.history}
          location={this.props.location}
          match={this.props.match}
        />
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
