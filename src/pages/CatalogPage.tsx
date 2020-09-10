import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import queryString from 'query-string';
import { connect } from 'react-redux';
import './CatalogPage.css';
import { Catalog } from '../models/Catalog';
import Globals from '../Globals';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { bookmark, arrowBack, home, search } from 'ionicons/icons';
import SearchAlert from '../components/SearchAlert';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

interface State {
  showSearchAlert: boolean;
  fetchError: boolean;
  catalogs: Array<Catalog>;
}

class _CatalogPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      fetchError: false,
      catalogs: [],
      showSearchAlert: false,
    };
  }

  ionViewWillEnter() {
    //console.log( `view will enter: ${this.props.match.url}` );
    this.fetchData(this.props.match.params.path);
  }

  /*
  componentWillReceiveProps(nextProps){
    console.log(`route changed: ${nextProps.match.url}`)
 }

  componentDidMount() {
    console.log(`did mount: ${this.props.match.url}`)
  }

  componentWillUnmount() {
  }*/

  async fetchData(path: string) {
    //console.log('fetch');
    let catalogs = new Array<Catalog>();

    if (this.props.match.params.path == null) {
      catalogs = this.getTopCatalogs();
    } else {
      try {
        const res = await Globals.axiosInstance.get(`/catalog_entry?q=${path}`, {
          responseType: 'arraybuffer',
        });
        const data = JSON.parse(new TextDecoder().decode(res.data)).results as [any];
        catalogs = data.map((json) => new Catalog(json));
      } catch (e) {
        this.setState({ fetchError: true });
        return false;
      }
    }

    this.setState({ catalogs: catalogs });
    return true;
  }

  getTopCatalogs() {
    let catalogs = Array<Catalog>();
    Object.keys(Globals.topCatalogs).forEach((key) => {
      const catalog: Catalog = {
        n: key,
        nodeType: null,
        work: null,
        label: Globals.topCatalogs[key],
        file: null,
      };
      catalogs.push(catalog);
    });
    return catalogs;
  }

  get isTopCatalog() {
    return this.props.match.url === '/catalog';
  }

  addBookmarkHandler() {
    (this.props as any).dispatch({
      type: "ADD_BOOKMARK",
      bookmark: new Bookmark({
        type: BookmarkType.CATALOG,
        uuid: this.props.match.params.path,
        selectedText: this.props.match.params.label,
        epubcfi: '',
        fileName: '',
        work: null,
      }),
    });
  }

  delBookmarkHandler() {
    (this.props as any).dispatch({
      type: "DEL_BOOKMARK",
      uuid: this.props.match.params.path,
    });
  }

  get hasBookmark() {
    return ((this.props as any).bookmarks as [Bookmark])?.find(
      (e) => e.type === BookmarkType.CATALOG && e.uuid === this.props.match.params.path) != null;
  }

  getRows() {
    let rows = Array<object>();
    (this.state as any).catalogs.forEach((catalog: Catalog, index: number) => {
      //if (catalog.nodeType == 'html')
      let routeLink = '';
      if (catalog.nodeType === 'html') {
        routeLink = `/catalog/webview/${catalog.n}/1/${catalog.label}`;
      } else if (catalog.work == null) {
        routeLink = `/catalog/catalog/${catalog.n}/${catalog.label}`;
      } else {
        routeLink = `/catalog/work/${catalog.work}/${catalog.label}`;
      }
      rows.push(
        <IonItem key={`${catalog.n}item` + index} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
            search: queryString.stringify({ file: catalog.file! }),
          });
        }}>
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
            <IonButton hidden={this.isTopCatalog} fill="clear" color={this.hasBookmark ? 'warning' : 'primary'} slot='end' onClick={e => this.hasBookmark ? this.delBookmarkHandler() : this.addBookmarkHandler()}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>
            <IonButton hidden={this.isTopCatalog} fill="clear" slot='end' onClick={e => this.props.history.push(`/${this.props.match.params.tab}`)}>
              <IonIcon icon={home} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" slot='end' onClick={e => this.setState({ showSearchAlert: true })}>
              <IonIcon icon={search} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {this.state.fetchError ? Globals.fetchErrorContent : list }

          <SearchAlert
            {...{
              showSearchAlert: (this.state as any).showSearchAlert,
              searchCancel: () => { this.setState({ showSearchAlert: false }) },
              searchOk: (keyword: string) => {
                this.props.history.push(`/catalog/search/${keyword}`);
                this.setState({ showSearchAlert: false });
              }, ...this.props
            }}
          />
        </IonContent>
      </IonPage>
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: state.settings.bookmarks,
  }
};

//const mapDispatchToProps = {};

const CatalogPage = withIonLifeCycle(_CatalogPage);

export default connect(
  mapStateToProps,
)(CatalogPage);
