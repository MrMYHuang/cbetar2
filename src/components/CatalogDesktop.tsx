import React from 'react';
import { IonItem, IonLabel, IonMenu, IonLoading, IonButton, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { SwipeableDrawer } from '@mui/material';
import { ChevronRight, ExpandMore } from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/lab';
import queryString from 'query-string';

import { Catalog } from '../models/Catalog';
import { connect } from 'react-redux';
import { CbetaDbMode, Settings } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';
import CbetaOfflineIndexedDb, { CatalogNode } from '../CbetaOfflineIndexedDb';
import Globals from '../Globals';
import EPubView from './EPubView';

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
  catalogTree: CatalogNode | null;
  isLoading: boolean;
}

class _CatalogDesktop extends React.Component<PageProps, State> {
  menuRef: React.RefObject<HTMLIonMenuElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      fetchError: false,
      catalogTree: null,
      showSearchAlert: false,
      isLoading: false,
    };
    this.menuRef = React.createRef<HTMLIonMenuElement>();
  }

  ionViewWillEnter() {
    this.fetchData();
  }

  async fetchData() {
    //console.log('fetch');
    this.setState({ isLoading: true });
    let catalogTree: CatalogNode;

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
      catalogTree = obj as CatalogNode;

      this.setState({ fetchError: false, isLoading: false, catalogTree: catalogTree });
      return true;
    } catch (e) {
      console.error(e);
      console.error(new Error().stack);
      this.setState({ fetchError: true, isLoading: false });
      return false;
    }
  }

  parentPath(path: string) {
    let paths = path.split('.');
    paths.pop();
    return paths.join('.');
  }

  getTreeView(node: CatalogNode): React.ReactNode {

    return <TreeItem nodeId={node.n} label={node.label} key={node.label}>
      {
        node.children ?
          node.children.map((childNode) => {
            return childNode ? this.getTreeView(childNode) : null;
          }) :
          node.work ? Array.from({length: +node.juan}, (v, i) => {
            const ip1 = i + 1;
            const id = `${node.work}_${ip1}`;
            const label = `卷${ip1}`;
            return <TreeItem nodeId={id} label={label} key={id} onClick={() => {
              const routeLink = `/catalog/desktop/${node.work}/${ip1}`;
              this.props.history.push({
                pathname: routeLink,
              });
            }} />
          })
            : null
      }
    </TreeItem>;
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
    return <>
      <IonMenu
        ref={this.menuRef}
        contentId='abc'
        type='overlay'
        onIonWillClose={() => {
          this.props.dispatch({
            type: "SET_KEY_VAL",
            key: 'drawerOpen',
            val: false,
          });
        }}
      >
        <TreeView
          defaultCollapseIcon={<ExpandMore />}
          defaultExpandIcon={<ChevronRight />}
          sx={{ height: '100%', flexGrow: 1, overflowY: 'auto' }}
        >
          {this.state.catalogTree && this.getTreeView(this.state.catalogTree)}
        </TreeView>
      </IonMenu>

      <EPubView
        history={this.props.history}
        location={this.props.location}
        match={this.props.match}
      />

      <IonButton id='abc' onClick={() => {
        this.menuRef.current?.open();
      }}>Hi</IonButton>

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

const CatalogDesktop = withIonLifeCycle(_CatalogDesktop);

export default connect(
  mapStateToProps,
)(CatalogDesktop);
