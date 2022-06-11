import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { IonContent, IonPage, withIonLifeCycle } from '@ionic/react';

import './CatalogPage.css';
import { Catalog } from '../models/Catalog';
import Globals from '../Globals';
import { Bookmark } from '../models/Bookmark';
import { TmpSettings } from '../models/TmpSettings';
import { Settings } from '../models/Settings';
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
  fetchDataCatalogTouch: Function;

  constructor(props: any) {
    super(props);
    this.fetchDataCatalogTouch = () => { console.log('Uninitialized!'); };
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
      <IonPage>
          {this.state.fetchError ?
            Globals.fetchErrorContent :
            this.props.match.params.type === 'desktop' ?
            <CatalogDesktop
              history={this.props.history}
              location={this.props.location}
              match={this.props.match}
            />
            :
            <CatalogTouch
              history={this.props.history}
              location={this.props.location}
              match={this.props.match}
              setFetchData={(fetchData: Function) => { this.fetchDataCatalogTouch = fetchData; }}
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
