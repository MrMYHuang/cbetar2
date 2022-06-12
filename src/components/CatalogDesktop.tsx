import React from 'react';
import { IonMenu, IonLoading, IonButton, withIonLifeCycle, IonHeader, IonIcon, IonToolbar, IonTitle, IonToast, IonLabel } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { ChevronRight, ExpandMore } from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/lab';

import { connect } from 'react-redux';
import { CbetaDbMode, Settings } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';
import CbetaOfflineIndexedDb, { CatalogNode } from '../CbetaOfflineIndexedDb';
import EPubView from './EPubView';
import { arrowBackCircle } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';

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
  type: string;
  work: string;
  path: string;
}> { }

interface State {
  showSearchAlert: boolean;
  fetchError: boolean;
  showToast: boolean;
  toastMessage: string;
  catalogTree: CatalogNode | null;
  isLoading: boolean;
  expandedNodeIds: string[];
  selectedNodeIds: string[];
}

class _CatalogDesktop extends React.Component<PageProps, State> {
  menuRef: React.RefObject<HTMLIonMenuElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      fetchError: false,
      catalogTree: null,
      showToast: false,
      toastMessage: '',
      showSearchAlert: false,
      isLoading: false,
      expandedNodeIds: [],
      selectedNodeIds: [],
    };
    this.menuRef = React.createRef<HTMLIonMenuElement>();
  }

  ionViewWillEnter() {
    this.fetchData().then(() => {
      this.openMenuAndSelectItem();
    })
  }

  async fetchData() {
    if (this.state.catalogTree) {
      return true;
    }

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

      return new Promise(ok => {
        this.setState({ fetchError: false, isLoading: false, catalogTree: catalogTree }, () => {
          ok(true);
        });
      });
    } catch (e) {
      console.error(e);
      console.error(new Error().stack);
      this.setState({ fetchError: true, isLoading: false });
      return false;
    }
  }

  findCatalogParentNodeIds(path: string) {
    if (!path) {
      return [];
    }

    const paths = path.split('.');
    const parentNodeIds: string[] = [];
    for (let i = 1; i <= paths.length; i++) {
      parentNodeIds.push(paths.slice(0, i).join('.'));
    }
    return parentNodeIds;
  }

  findJuanParentNodeIds(work: string, juan: number, node: CatalogNode): string[] {
    if (!node.children) {
      const findWork = juan === -1;
      const vol_juan_end = node.vol_juan_start + node.vols_juans[node.volId] - 1;
      if (node.work === work) {
        if (findWork) {
          return [node.work2];
        } else if (node.vol_juan_start <= juan && juan <= vol_juan_end) {
          return [node.work2, `${node.work2}-${juan}`];
        } else {
          return [];
        }
      } else {
        return [];
      }
    }

    for (let i = 0; i < node.children.length; i++) {
      let result = this.findJuanParentNodeIds(work, juan, node.children[i]);
      if (result.length > 0) {
        result.unshift(node.n);
        return result;
      }
    }
    return [];
  }

  getTreeView(node: CatalogNode): React.ReactNode {
    return <TreeItem nodeId={node.work2 ? node.work2 : node.n} label={node.label} key={node.label}>
      {
        node.children ?
          node.children.map((childNode) => {
            return childNode ? this.getTreeView(childNode) : null;
          }) :
          node.work2 ? Array.from({ length: node.vols_juans[node.volId] }, (v, i) => {
            const ip1 = node.vol_juan_start + i;
            const id = `${node.work2}-${ip1}`;
            const label = `卷${ip1}`;
            return <TreeItem nodeId={id} label={label} key={id} onClick={async () => {
              const routeLink = `/catalog/juan/${node.work}/${ip1}`;
              this.props.history.push({
                pathname: routeLink,
              });
            }} />
          })
            : null
      }
    </TreeItem>;
  }

  openMenuAndSelectItem() {
    if (this.props.match.params.type === 'catalog') {
      const parentNodeIds = this.findCatalogParentNodeIds(this.props.match.params.path);
      this.setState({ expandedNodeIds: parentNodeIds, selectedNodeIds: [this.props.match.params.path] }, () => {
        this.menuRef.current?.open();
      });
    } else if (this.props.match.params.type === 'work') {
      const parentNodeIds = this.findJuanParentNodeIds(this.props.match.params.path, -1, this.state.catalogTree!);
      this.setState({ expandedNodeIds: parentNodeIds, selectedNodeIds: [`${parentNodeIds.pop()}`] }, () => {
        this.menuRef.current?.open();
      });
    } else if (this.props.match.params.type === 'juan') {
      const parentNodeIds = this.findJuanParentNodeIds(this.props.match.params.work, +this.props.match.params.path, this.state.catalogTree!);
      this.setState({ expandedNodeIds: parentNodeIds, selectedNodeIds: [`${parentNodeIds.pop()}`] }, () => {
        this.menuRef.current?.open();
      });
    } else {
      this.menuRef.current?.open();
    }
  }

  render() {
    return <>
      <IonMenu
        ref={this.menuRef}
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
          expanded={this.state.expandedNodeIds}
          selected={this.state.selectedNodeIds}
          onNodeToggle={(event: React.SyntheticEvent, nodeIds: string[]) => {
            this.setState({ expandedNodeIds: nodeIds })
          }}
          onNodeSelect={(event: React.SyntheticEvent, nodeIds: string[]) => {
            this.setState({ selectedNodeIds: nodeIds })
          }}
          onDoubleClick={async () => {
            const n = (this.state.selectedNodeIds as any) as string;

            // node is juan.
            if (n.search(/-/) !== -1) {
              this.setState({ showToast: true, toastMessage: '請用右上方書籤按鈕新增經文書籤。' });
              return;
            }

            // node is work.
            if (n.search(/CBETA/) === -1) {
              const matches = /([A-Z]*[0-9]*)/.exec(n)!;
              const work = (await CbetaOfflineIndexedDb.fetchWork(matches[1])).results[0];
              this.props.dispatch({
                type: "ADD_BOOKMARK",
                bookmark: {
                  type: BookmarkType.WORK,
                  uuid: matches[1],
                  selectedText: work.title,
                  epubcfi: '',
                  fileName: '',
                  work: { mulu: [], juan: +work.juan, juan_list: work.juan_list, title: work.title, vol: work.vol, work: work.work },
                } as Bookmark,
              });
              this.setState({ showToast: true, toastMessage: '書籤新增成功！' });
              return;
            }

            // node is catalog.
            const catalog = await CbetaOfflineIndexedDb.fetchCatalogs(n);
            this.props.dispatch({
              type: "ADD_BOOKMARK",
              bookmark: {
                type: BookmarkType.CATALOG,
                uuid: n,
                selectedText: catalog.label,
                epubcfi: '',
                fileName: '',
                work: null,
              } as Bookmark,
            });
            this.setState({ showToast: true, toastMessage: '書籤新增成功！' });
          }}
          sx={{ height: '100%', flexGrow: 1, overflowY: 'auto' }}
        >
          {this.state.catalogTree && this.getTreeView(this.state.catalogTree)}
        </TreeView>

        <IonLabel class='treeItem'>雙擊新增目錄書籤</IonLabel>
      </IonMenu>

      {
        this.props.match.params.type === 'juan' ?
          <EPubView
            history={this.props.history}
            location={this.props.location}
            match={this.props.match}
            showMenu={() => {
              this.openMenuAndSelectItem();
            }}
          />
          :
          null
      }

      <IonLoading
        cssClass='uiFont'
        isOpen={this.state.isLoading}
        onDidDismiss={() => this.setState({ isLoading: false })}
        message={'載入中...'}
      />

      <IonToast
        cssClass='uiFont'
        isOpen={this.state.showToast}
        onDidDismiss={() => this.setState({ showToast: false })}
        message={this.state.toastMessage}
        duration={2000}
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
