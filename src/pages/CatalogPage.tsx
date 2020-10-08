import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, withIonLifeCycle, IonToast } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import './CatalogPage.css';
import { Catalog } from '../models/Catalog';
import Globals from '../Globals';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { bookmark, arrowBack, home, search, shareSocial } from 'ionicons/icons';
import SearchAlert from '../components/SearchAlert';
import queryString from 'query-string';

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  topCatalogsType: number;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

interface State {
  showSearchAlert: boolean;
  showCopyAppLinkSuccess: boolean;
  fetchError: boolean;
  catalogs: Array<Catalog>;
  pathLabel: string;
}

class _CatalogPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      fetchError: false,
      catalogs: [],
      pathLabel: '',
      showSearchAlert: false,
      showCopyAppLinkSuccess: false,
    };
  }

  ionViewWillEnter() {
    console.log(`view will enter: ${this.props.match.url}`);
  }

  /*
  componentWillReceiveProps(nextProps){
    console.log(`route changed: ${nextProps.match.url}`)
 }*/

  componentDidMount() {
    console.log(`did mount: ${this.props.match.url}`);
    this.fetchData(this.props.match.params.path);
  }

  /*
  componentWillUnmount() {
  }*/

  async fetchData(path: string) {
    //console.log('fetch');
    let catalogs = new Array<Catalog>();
    let pathLabel = '';

    if (path == null) {
      return this.fetchTopCatalogs(this.props.topCatalogsType);
    } else {
      try {
        const res = await Globals.axiosInstance.get(`/catalog_entry?q=${path}`, {
          responseType: 'arraybuffer',
        });
        const obj = JSON.parse(new TextDecoder().decode(res.data)) as any;
        const data = obj.results as [any];
        catalogs = data.map((json) => new Catalog(json));

        const parentPath = this.parentPath(path);
        // path is not a top catalog.
        if (parentPath !== '') {
          pathLabel = obj.label;
        } else {
          const topCatalogsByCatLabel = Globals.topCatalogsByCat[path];
          pathLabel = (topCatalogsByCatLabel !== undefined) ? topCatalogsByCatLabel : Globals.topCatalogsByVol[path];
        }

        this.setState({ catalogs: catalogs, pathLabel });
        return true;
      } catch (e) {
        console.error(e);
        this.setState({ fetchError: true });
        return false;
      }
    }
  }

  fetchTopCatalogs(topCatalogsType: number) {
    let catalogs = Array<Catalog>();

    const topCatalogs = topCatalogsType ? Globals.topCatalogsByVol : Globals.topCatalogsByCat;

    Object.keys(topCatalogs).forEach((key) => {
      const catalog: Catalog = {
        n: key,
        nodeType: null,
        work: null,
        label: topCatalogs[key],
        file: null,
      };
      catalogs.push(catalog);
    });
    this.setState({ catalogs: catalogs });
    return true;
  }

  get isTopCatalog() {
    return this.props.match.url === '/catalog';
  }

  parentPath(path: string) {
    let paths = path.split('.');
    paths.pop();
    return paths.join('.');
  }

  addBookmarkHandler() {
    this.props.dispatch({
      type: "ADD_BOOKMARK",
      bookmark: new Bookmark({
        type: BookmarkType.CATALOG,
        uuid: this.props.match.params.path,
        selectedText: this.state.pathLabel,
        epubcfi: '',
        fileName: '',
        work: null,
      }),
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

  getRows() {
    let rows = Array<object>();
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
            search: queryString.stringify(isHtmlNode ? { file: catalog.file! } : {}),
          });
        }}>
          <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
          <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }} key={`${catalog.n}label` + index}>
            {catalog.label}
          </IonLabel>
        </IonItem>
      );
    });
    return rows;
  }

  render() {
    //console.log(`${this.props.match.url} render`)

    let list = <IonList>
      {this.getRows()}
    </IonList>

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>目錄</IonTitle>

            <IonButton hidden={this.isTopCatalog} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonButton hidden={!this.isTopCatalog} slot='end' onClick={ev => {
              const newTopCatalogsType = (this.props.topCatalogsType + 1) % 2
              this.fetchTopCatalogs(newTopCatalogsType);
              this.props.dispatch({
                type: "SET_KEY_VAL",
                key: 'topCatalogsType',
                val: newTopCatalogsType
              });
            }}>
              <span className='uiFont' style={{ color: 'var(--color)' }}>{this.props.topCatalogsType ? '冊分類' : '部分類'}</span>
            </IonButton>

            <IonButton hidden={this.isTopCatalog} fill="clear" color={this.hasBookmark ? 'warning' : 'primary'} slot='end' onClick={e => this.hasBookmark ? this.delBookmarkHandler() : this.addBookmarkHandler()}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>

            <IonButton hidden={this.isTopCatalog} fill="clear" slot='end' onClick={e => this.props.history.push(`/${this.props.match.params.tab}`)}>
              <IonIcon icon={home} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onClick={e => this.setState({ showSearchAlert: true })}>
              <IonIcon icon={search} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onClick={e => {
              navigator.clipboard.writeText(window.location.href);
              this.setState({ showCopyAppLinkSuccess: true });
            }}>
              <IonIcon icon={shareSocial} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {this.state.fetchError ? Globals.fetchErrorContent : list}

          <SearchAlert
            {...{
              showSearchAlert: (this.state as any).showSearchAlert,
              finish: () => { this.setState({ showSearchAlert: false }) }, ...this.props
            }}
          />

          <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}><a href="https://github.com/MrMYHuang/cbetar2#search" target="_new">搜尋經文教學</a></div>

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showCopyAppLinkSuccess}
            onDidDismiss={() => this.setState({ showCopyAppLinkSuccess: false })}
            message="此頁app連結已複製至剪貼簿！"
            duration={2000}
          />
        </IonContent>
      </IonPage>
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: state.settings.bookmarks,
    topCatalogsType: state.settings.topCatalogsType,
  }
};

//const mapDispatchToProps = {};

const CatalogPage = withIonLifeCycle(_CatalogPage);

export default connect(
  mapStateToProps,
)(CatalogPage);
