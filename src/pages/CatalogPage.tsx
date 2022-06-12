import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { IonPage, withIonLifeCycle } from '@ionic/react';

import { Catalog } from '../models/Catalog';
import Globals from '../Globals';
import { Bookmark } from '../models/Bookmark';
import { TmpSettings } from '../models/TmpSettings';
import { Settings, UiMode } from '../models/Settings';
import CatalogTouch from '../components/CatalogTouch';
import CatalogDesktop from '../components/CatalogDesktop';

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  type: string;
  path: string;
}> { }

interface State {
  showSearchAlert: boolean;
  fetchError: boolean;
  catalogs: Array<Catalog>;
  pathLabel: string;
  isLoading: boolean;
}

class _CatalogPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      fetchError: false,
      catalogs: [],
      pathLabel: '',
      showSearchAlert: false,
      isLoading: false,
    };
  }

  ionViewWillEnter() {
  }

  /* * /

  componentDidMount() {
    console.log(`did mount: ${this.props.match.url}`);
  }
    ionViewDidEnter() {
    console.log(`${this.props.match.url} did enter.`);
    //console.log(this.props.history.length);
  }

  ionViewWillLeave() {
    console.log(`${this.props.match.url} will leave.`);
    //console.log(this.props.history.length);
  }

  ionViewDidLeave() {
    console.log(`${this.props.match.url} did leave.`);
    //console.log(this.props.history.length);
  }

  componentWillUnmount() {
    console.log(`${this.props.match.url} unmount`);
  }


  componentWillReceiveProps(nextProps: any) {
    console.log(`route changed: ${nextProps.match.url}`)
  }

  /**/

  render() {
    //console.log(`${this.props.match.url} render`)

    return (
      <IonPage id='CatalogPage'>
        {
          this.state.fetchError ?
            Globals.fetchErrorContent :
            this.props.settings.uiMode === UiMode.Touch ?
              <CatalogTouch
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
    bookmarks: state.settings.bookmarks,
    state: state,
    tmpSettings: state.tmpSettings,
    settings: state.settings,
  };
};

//const mapDispatchToProps = {};

const CatalogPage = withIonLifeCycle(_CatalogPage);

export default connect(
  mapStateToProps,
)(CatalogPage);
