import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { IonContent, IonHeader, IonPage, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, withIonLifeCycle, IonLoading, IonSelectOption, IonSelect } from '@ionic/react';
import { bookmark, arrowBack, home, search, shareSocial, refreshCircle } from 'ionicons/icons';

import './CatalogPage.css';
import { Catalog } from '../models/Catalog';
import Globals from '../Globals';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { TmpSettings } from '../models/TmpSettings';
import { Settings } from '../models/Settings';
import CatalogTouch from '../components/CatalogTouch';

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
  topCatalogsType: number;
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
      topCatalogsType: -1,
      fetchError: false,
      catalogs: [],
      pathLabel: '',
      showSearchAlert: false,
      isLoading: false,
    };
  }

  ionViewWillEnter() {
    console.log(`${this.props.match.url} will enter.`);
    let topCatalogsType = -1;
    switch (this.props.match.url) {
      case `/catalog`: topCatalogsType = 0; break;
      case `/catalog/volumes`: topCatalogsType = 1; break;
      case `/catalog/famous`: topCatalogsType = 2; break;
      default: topCatalogsType = -1; break;
    }
    this.setState({ topCatalogsType: topCatalogsType }, () => {
      //console.log(this.props.history.length);
      this.fetchDataCatalogTouch(this.props.match.params.path);
    });
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
  addBookmarkHandler() {
    this.props.dispatch({
      type: "ADD_BOOKMARK",
      bookmark: {
        type: BookmarkType.CATALOG,
        uuid: this.props.match.params.path,
        selectedText: this.state.pathLabel,
        epubcfi: '',
        fileName: '',
        work: null,
      } as Bookmark,
    });
  }

  delBookmarkHandler() {
    this.props.dispatch({
      type: "DEL_BOOKMARK",
      uuid: this.props.match.params.path,
    });
  }

  get hasBookmark() {
    return this.props.bookmarks.find(
      (e) => e.type === BookmarkType.CATALOG && e.uuid === this.props.match.params.path) != null;
  }

  get isTopCatalog() {
    return [`/catalog`, `/catalog/volumes`, `/catalog/famous`].reduce((prev, curr) => prev || curr === this.props.match.url, false);
  }

  render() {
    //console.log(`${this.props.match.url} render`)

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButton hidden={this.isTopCatalog} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonSelect
              hidden={!this.isTopCatalog} slot='start'
              value={this.state.topCatalogsType}
              className='buttonRounded'
              interface='popover'
              interfaceOptions={{ cssClass: 'cbetar2themes' }}
              onIonChange={e => {
                const value = +e.detail.value;

                this.setState({ topCatalogsType: value });

                let nextPage = '';
                switch (value) {
                  case 0: nextPage = `/catalog`; break;
                  case 1: nextPage = `/catalog/volumes`; break;
                  case 2: nextPage = `/catalog/famous`; break;
                  case 3: nextPage = `/catalog/desktop`; break;
                  case -1: nextPage = this.props.match.url; break;
                }
                if (this.props.match.url !== nextPage) {
                  this.props.history.push(nextPage);
                }
              }}>
              <IonSelectOption className='uiFont' value={0}>部分類</IonSelectOption>
              <IonSelectOption className='uiFont' value={1}>冊分類</IonSelectOption>
              <IonSelectOption className='uiFont' value={2}>知名經典</IonSelectOption>
              <IonSelectOption className='uiFont' value={3}>桌面模式</IonSelectOption>
            </IonSelect>

            {/*
            <IonButton hidden={!this.state.fetchError} fill="clear" slot='end' onClick={e => this.fetchData(this.props.match.params.path)}>
              <IonIcon icon={refreshCircle} slot='icon-only' />
            </IonButton>
            */}

            <IonButton hidden={this.isTopCatalog} fill={this.hasBookmark ? 'solid' : 'clear'} slot='end' onClick={e => this.hasBookmark ? this.delBookmarkHandler() : this.addBookmarkHandler()}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>

            <IonButton hidden={this.isTopCatalog} fill="clear" slot='end' onClick={e => this.props.history.push(`/${this.props.match.params.tab}`)}>
              <IonIcon icon={home} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onClick={e => this.setState({ showSearchAlert: true })}>
              <IonIcon icon={search} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onClick={e => {
              this.props.dispatch({
                type: "TMP_SET_KEY_VAL",
                key: 'shareTextModal',
                val: {
                  show: true,
                  text: decodeURIComponent(window.location.href),
                },
              });
            }}>
              <IonIcon icon={shareSocial} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {this.state.fetchError ?
            Globals.fetchErrorContent :
            <CatalogTouch
              history={this.props.history}
              location={this.props.location}
              match={this.props.match}
              topCatalogsType={this.state.topCatalogsType}
              setFetchData={(fetchData: Function) => { this.fetchDataCatalogTouch = fetchData; }}
            />
          }
        </IonContent>
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
