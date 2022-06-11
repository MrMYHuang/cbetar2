import React from 'react';
import { IonItem, IonLabel, IonList, IonLoading } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { SwipeableDrawer } from '@mui/material';
import queryString from 'query-string';

import { Catalog } from '../models/Catalog';
import SearchAlert from './SearchAlert';
import { connect } from 'react-redux';
import { CbetaDbMode, Settings } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';
import CbetaOfflineIndexedDb from '../CbetaOfflineIndexedDb';
import Globals from '../Globals';

const electronBackendApi: any = (window as any).electronBackendApi;

const famousJuans = [
  { title: '般若波羅蜜多心經', url: `/catalog/juan/T0251/1` },
  { title: '金剛般若波羅蜜經', url: `/catalog/juan/T0235/1` },
  { title: '佛說阿彌陀經', url: `/catalog/juan/T0366/1` },
  { title: '佛說無量壽經卷上', url: `/catalog/juan/T0360/1` },
  { title: '佛說觀無量壽佛經', url: `/catalog/juan/T0365/1` },
  { title: '藥師琉璃光如來本願功德經', url: `/catalog/juan/T0450/1` },
  { title: '佛說觀彌勒菩薩上生兜率天經', url: `/catalog/juan/T0452/1` },
  { title: '佛說彌勒下生成佛經', url: `/catalog/juan/T0454/1` },
  { title: '地藏菩薩本願經', url: `/catalog/juan/T0412/1` },
  { title: '妙法蓮華經觀世音菩薩普門品經', url: `/catalog/juan/T0262/7` },
  { title: '大佛頂如來密因修證了義諸菩薩萬行首楞嚴經卷第一', url: `/catalog/juan/T0945/1` },
  { title: '佛說法滅盡經', url: `/catalog/juan/T0396/1` },
];

interface Props {
  topCatalogsType: number;
  setFetchData: Function;
}

interface ReduxProps {
  dispatch: Function;
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface PageProps extends Props, ReduxProps, RouteComponentProps<{
  tab: string;
  path: string;
}> { }

interface State {
  showSearchAlert: boolean;
  fetchError: boolean;
  catalogs: Array<Catalog>;
  isLoading: boolean;
}

class _CatalogDesktop extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      fetchError: false,
      catalogs: [],
      showSearchAlert: false,
      isLoading: false,
    };

    this.props.setFetchData(this.fetchData.bind(this));
  }

  async fetchData() {
    //console.log('fetch');
    this.setState({ isLoading: true });
    let catalogs = new Array<Catalog>();

        //electronBackendApi?.send("toMain", { event: 'ready' });
        try {
          let obj: any;
          switch (this.props.settings.cbetaOfflineDbMode) {
            case CbetaDbMode.OfflineIndexedDb:
              obj = await CbetaOfflineIndexedDb.fetchAllCatalogs();
              break;
            case CbetaDbMode.OfflineFileSystem:
              electronBackendApi?.send("toMain", { event: 'fetchAllCatalogs' });
              obj = await new Promise((ok, fail) => {
                electronBackendApi?.receiveOnce("fromMain", (data: any) => {
                  switch (data.event) {
                    case 'fetchAllCatalogs':
                      ok(data);
                      break;
                  }
                });
              });
              break;
          }
          const data = obj.results as [any];
          catalogs = data.map((json) => new Catalog(json));

          this.setState({ fetchError: false, isLoading: false, catalogs: catalogs });
          return true;
        } catch (e) {
          console.error(e);
          console.error(new Error().stack);
          this.setState({ fetchError: true, isLoading: false });
          return false;
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
    this.setState({ fetchError: false, isLoading: false, catalogs: catalogs });
    return true;
  }

  parentPath(path: string) {
    let paths = path.split('.');
    paths.pop();
    return paths.join('.');
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
    famousJuans.forEach(({ title, url }, i) => {
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
      {this.props.topCatalogsType === 2 ? this.getFamousJuanRows() : this.getRows()}
    </IonList>

    return <>
      {list}

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
    state: state,
    tmpSettings: state.tmpSettings,
    settings: state.settings,
  };
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(_CatalogDesktop);
