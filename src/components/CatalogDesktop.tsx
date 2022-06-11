import React from 'react';
import { IonMenu, IonLoading, IonButton, withIonLifeCycle, IonHeader, IonIcon, IonToolbar, IonTitle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { ChevronRight, ExpandMore } from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/lab';

import { connect } from 'react-redux';
import { CbetaDbMode, Settings } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';
import CbetaOfflineIndexedDb, { CatalogNode } from '../CbetaOfflineIndexedDb';
import EPubView from './EPubView';
import { arrowBackCircle } from 'ionicons/icons';

const electronBackendApi: any = (window as any).electronBackendApi;

const catalogTreeId = 'catalogTree';

interface Props {
}

interface ReduxProps {
  dispatch: Function;
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface PageProps extends Props, ReduxProps, RouteComponentProps<{
  tab: string;
  work: string;
  path: string;
}> { }

interface State {
  showSearchAlert: boolean;
  fetchError: boolean;
  catalogTree: CatalogNode | null;
  isLoading: boolean;
  defaultSelectedNode: string;
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
      defaultSelectedNode: '',
    };
    this.menuRef = React.createRef<HTMLIonMenuElement>();
  }

  componentDidMount() {
    this.fetchData().then(() => {
      const work = this.props.match.params.work;
      work && this.setState({ defaultSelectedNode: `${catalogTreeId}-${work}_${this.props.match.params.path}` });
    });
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

  getTreeView(node: CatalogNode): React.ReactNode {
    return <TreeItem nodeId={node.n} label={node.label} key={node.label}>
      {
        node.children ?
          node.children.map((childNode) => {
            return childNode ? this.getTreeView(childNode) : null;
          }) :
          node.work ? Array.from({ length: +node.juan }, (v, i) => {
            const ip1 = i + 1;
            const id = `${node.work}_${ip1}`;
            const label = `卷${ip1}`;
            return <TreeItem nodeId={id} label={label} key={id} onClick={async () => {
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

  render() {
    return <>
      <IonMenu
        ref={this.menuRef}
        onIonWillClose={() => {
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonButton fill="clear" slot='start'
              onClick={e => this.menuRef.current?.close()}>
              <IonIcon icon={arrowBackCircle} slot='icon-only' />
            </IonButton>

            <IonTitle className='uiFont'>目錄</IonTitle>
          </IonToolbar>
        </IonHeader>

        <TreeView
          id={catalogTreeId}
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
        showMenu={() => { this.menuRef.current?.open(); }}
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

const CatalogDesktop = withIonLifeCycle(_CatalogDesktop);

export default connect(
  mapStateToProps,
)(CatalogDesktop);
