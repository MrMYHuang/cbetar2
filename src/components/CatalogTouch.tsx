import React from 'react';
import { IonContent, IonHeader, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, withIonLifeCycle, IonLoading, IonSelectOption, IonSelect } from '@ionic/react';
import { bookmark, arrowBack, home, search, shareSocial, refreshCircle } from 'ionicons/icons';
import { RouteComponentProps } from 'react-router-dom';
import queryString from 'query-string';

import { Catalog } from '../models/Catalog';
import SearchAlert from './SearchAlert';
import { connect } from 'react-redux';
import { CbetaDbMode, Settings } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';
import CbetaOfflineDb from '../CbetaOfflineDb';
import Globals from '../Globals';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import Constants from '../Constants';

const electronBackendApi: any = (window as any).electronBackendApi;

interface Props {
}

interface ReduxProps {
  dispatch: Function;
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface PageProps extends Props, ReduxProps, RouteComponentProps<{
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

class _CatalogTouch extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      topCatalogsType: 0,
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

    this.setState({ topCatalogsType }, () => {
      this.fetchData(this.props.match.params.path);
    });
  }

  async fetchData(path: string) {
    //console.log('fetch');
    this.setState({ isLoading: true });
    let catalogs = new Array<Catalog>();
    let pathLabel = '';

    if (this.state.topCatalogsType === 2) {
      this.setState({ fetchError: false, isLoading: false, pathLabel: '' });
    } else {
      //electronBackendApi?.send("toMain", { event: 'ready' });
      try {
        let obj: any;
        switch (this.props.settings.cbetaOfflineDbMode) {
          case CbetaDbMode.OfflineIndexedDb:
          case CbetaDbMode.OfflineFileSystemV2:
          case CbetaDbMode.OfflineFileSystemV3:
            obj = await CbetaOfflineDb.fetchCatalogs(path || 'CBETA', this.props.settings.cbetaOfflineDbMode);
            break;
          case CbetaDbMode.OfflineFileSystem:
            electronBackendApi?.send("toMain", { event: 'fetchCatalog', path: path });
            obj = await new Promise((ok, fail) => {
              electronBackendApi?.receiveOnce("fromMain", (data: any) => {
                switch (data.event) {
                  case 'fetchCatalog':
                    ok(data);
                    break;
                }
              });
            });
            break;
          case CbetaDbMode.Online:
            if (this.isTopCatalog) {
              switch (this.state.topCatalogsType) {
                case 0:
                  path = 'root';
                  break;
                case 1:
                  path = 'vol';
                  break;
              }
            }
            const res = await Globals.axiosInstance.get(`/catalog_entry?q=${path}`, {
              responseType: 'arraybuffer',
            });
            obj = JSON.parse(new TextDecoder().decode(res.data)) as any;
            break;
        }
        const data = obj.results as [any];
        catalogs = data.map((json) => new Catalog(json));
        pathLabel = obj.label;

        this.setState({ fetchError: false, isLoading: false, catalogs: catalogs, pathLabel });
        return true;
      } catch (e) {
        console.error(e);
        console.error(new Error().stack);
        this.setState({ fetchError: true, isLoading: false, pathLabel: '' });
        return false;
      }
    }
  }

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
    return this.props.settings.bookmarks.find(
      (e) => e.type === BookmarkType.CATALOG && e.uuid === this.props.match.params.path) != null;
  }

  get isTopCatalog() {
    return [`/catalog`, `/catalog/volumes`, `/catalog/famous`].some((v) => v === this.props.match.url);
  }

  getRows() {
    let rows = Array<JSX.Element>();
    this.state.catalogs.forEach((catalog: Catalog, index: number) => {
      let routeLink = '';
      const isHtmlNode = catalog.nodeType === 'html';
      if (isHtmlNode) {
        routeLink = `/catalog/juan/${catalog.n}/1`;
      } else if (catalog.work == null) {
        routeLink = `/catalog/catalog/${catalog.n}`;
      } else {
        routeLink = `/catalog/work/${catalog.work}`;
      }
      rows.push(
        <IonItem key={`${catalog.n}item` + index} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
            search: queryString.stringify(isHtmlNode ? { file: catalog.file!, title: catalog.label } : {}),
          });
        }}>
          <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
          <IonLabel className='ion-text-wrap uiFont' key={`${catalog.n}label` + index}>
            {catalog.label}
          </IonLabel>
        </IonItem>
      );
    });
    return rows;
  }

  getFamousJuanRows() {
    let rows = Array<JSX.Element>();
    Constants.famousJuans.forEach(({ title, url }, i) => {
      rows.push(
        <IonItem key={`famousJuanItem_` + i} button={true} onClick={async event => {
          this.props.history.push(url);
        }}>
          <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
          <IonLabel className='ion-text-wrap uiFont' key={`famousItemLabel_` + i}>
            {title}
          </IonLabel>
        </IonItem>
      );
    });
    return rows;
  }

  render() {
    let list = <IonList>
      {this.state.topCatalogsType === 2 ? this.getFamousJuanRows() : this.getRows()}
    </IonList>

    return <>

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

              this.setState({ topCatalogsType: value }, () => {
                let nextPage = '';
                switch (value) {
                  case 0: nextPage = `/catalog`; break;
                  case 1: nextPage = `/catalog/volumes`; break;
                  case 2: nextPage = `/catalog/famous`; break;
                  case -1: nextPage = this.props.match.url; break;
                }
                if (this.props.match.url !== nextPage) {
                  this.props.history.push(nextPage);
                }
              });
            }}>
            <IonSelectOption className='uiFont' value={0}>部分類</IonSelectOption>
            <IonSelectOption className='uiFont' value={2}>知名經典</IonSelectOption>
          </IonSelect>

          <IonButton hidden={!this.state.fetchError} fill="clear" slot='end' onClick={e => this.fetchData(this.props.match.params.path)}>
            <IonIcon icon={refreshCircle} slot='icon-only' />
          </IonButton>

          <IonButton hidden={this.isTopCatalog} fill={this.hasBookmark ? 'solid' : 'clear'} slot='end' onClick={e => this.hasBookmark ? this.delBookmarkHandler() : this.addBookmarkHandler()}>
            <IonIcon icon={bookmark} slot='icon-only' />
          </IonButton>

          <IonButton hidden={this.isTopCatalog} fill="clear" slot='end' onClick={e => this.props.history.push(`/${this.props.match.params.tab}`)}>
            <IonIcon icon={home} slot='icon-only' />
          </IonButton>

          <IonButton fill="clear" slot='end' onClick={e => this.setState({ showSearchAlert: true })}>
            <IonIcon icon={search} slot='icon-only' />
          </IonButton>

          <IonButton fill="clear" slot='end' onClick={e => Globals.shareByLink(this.props.dispatch)}>
            <IonIcon icon={shareSocial} slot='icon-only' />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {this.state.fetchError ?
          Globals.fetchErrorContent :
          <>
            <div className='uiFontX2' style={{ color: 'var(--ion-color-primary)' }}>{this.state.pathLabel}</div>
            {list}

            <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}><a href="https://github.com/MrMYHuang/cbetar2#bookmark" target="_new">書籤與離線瀏覽說明</a></div>
            <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}><a href="https://github.com/MrMYHuang/cbetar2#search" target="_new">搜尋經書教學</a></div>
          </>
        }
      </IonContent>

      <SearchAlert
        {...{
          showSearchAlert: this.state.showSearchAlert,
          finish: () => { this.setState({ showSearchAlert: false }) }, ...this.props
        }}
      />

      <IonLoading
        cssClass='uiFont'
        isOpen={this.state.isLoading}
        onDidDismiss={() => this.setState({ isLoading: false })}
        message={'載入中...'}
      />
    </>
  }
};

const mapStateToProps = (state: any, ownProps: Props) => {
  return {
    bookmarks: state.settings.bookmarks,
    tmpSettings: state.tmpSettings,
    settings: state.settings,
  };
};

//const mapDispatchToProps = {};

const CatalogTouch = withIonLifeCycle(_CatalogTouch);

export default connect(
  mapStateToProps,
)(CatalogTouch);
