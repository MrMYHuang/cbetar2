import React from 'react';
import { IonMenu, IonLoading, IonButton, withIonLifeCycle, IonHeader, IonIcon, IonToolbar, IonTitle, IonToast, IonLabel, IonPage } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { ChevronRight, ExpandMore } from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/lab';

import { connect } from 'react-redux';
import { CbetaDbMode, Settings, UiMode } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';
import CbetaOfflineIndexedDb, { CatalogNode } from '../CbetaOfflineIndexedDb';
import EPubView from '../components/EPubView';
import { arrowBackCircle, bookmark, list, shareSocial } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import Constants from '../Constants';
import Globals from '../Globals';

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
  juan: string;
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

class _CatalogDesktopPage extends React.Component<PageProps, State> {
  juanTreeNodeKeyword = '-';
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
          return [node.work2, `${node.work2}${this.juanTreeNodeKeyword}${juan}`];
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

  getCatalogsByBuleiTree(node: CatalogNode): React.ReactNode {
    return <TreeItem
      nodeId={node.work2 ? node.work2 : node.n}
      label={node.label}
      key={node.label} onClick={async (e) => {
        e.preventDefault();

        const routeLink = node.work2 ? `/catalog/work/${node.work2}` : `/catalog/catalog/${node.n}`;
        this.props.history.push({
          pathname: routeLink,
        });
      }}
    >
      {
        node.children ?
          node.children.map((childNode) => {
            return childNode ? this.getCatalogsByBuleiTree(childNode) : null;
          }) :
          node.work2 ? Array.from({ length: node.vols_juans[node.volId] }, (v, i) => {
            const ip1 = node.vol_juan_start + i;
            const id = `${node.work2}${this.juanTreeNodeKeyword}${ip1}`;
            const label = `卷${ip1}`;
            return <TreeItem nodeId={id} label={label} key={id} onClick={async (e) => {
              e.preventDefault();

              const routeLink = `/catalog/juan/${node.work}/${ip1}`;
              this.props.history.push({
                pathname: routeLink,
              });
            }}
            />
          })
            : null
      }
    </TreeItem>;
  }

  getFamousJuansTree(): React.ReactNode {
    return <TreeItem nodeId='famous' label='知名經典' key='famous'>
      {
        Constants.famousJuans.map((v, i) => {
          const id = `${v.url}${this.juanTreeNodeKeyword}`;
          return <TreeItem nodeId={id} label={v.title} key={id} onClick={async () => {
            this.props.history.push({
              pathname: v.url,
            });
          }} />
        })
      }
    </TreeItem>;
  }

  async openMenuAndSelectItem() {
    const isOpen = await this.menuRef.current?.isOpen();
    if (!isOpen) {
      await this.menuRef.current?.open();
    } else {
      return;
    }

    let parentToThisNodeIds: string[] = [];
    if (this.props.match.params.type === 'catalog') {
      parentToThisNodeIds = this.findCatalogParentNodeIds(this.props.match.params.path);
    } else if (this.props.match.params.type === 'work') {
      parentToThisNodeIds = this.findJuanParentNodeIds(this.props.match.params.path, -1, this.state.catalogTree!);
    } else if (this.props.match.params.type === 'juan') {
      parentToThisNodeIds = this.findJuanParentNodeIds(this.props.match.params.path, +this.props.match.params.juan, this.state.catalogTree!);
    }
    this.setState({ expandedNodeIds: parentToThisNodeIds, selectedNodeIds: [`${parentToThisNodeIds[parentToThisNodeIds.length - 1]}`] });
  }

  async addBookmarkHandler() {
    const n = this.state.selectedNodeIds[0];

    if (n === 'famous') {
      this.setState({ showToast: true, toastMessage: '此項目不可加入書籤。' });
      return;
    }

    // node is juan.
    if (n.search(new RegExp(this.juanTreeNodeKeyword)) !== -1) {
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
  }

  render() {
    return <IonPage>
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

            <IonButton hidden={this.state.fetchError} fill="clear" slot='end' onClick={e => {
              if (this.state.selectedNodeIds.length === 0) {
                this.setState({ showToast: true, toastMessage: '請選擇目錄項目，再按此新增書籤！' });
                return;
              }
              this.addBookmarkHandler();
            }}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <TreeView
          id={catalogTreeId}
          defaultCollapseIcon={<ExpandMore />}
          defaultExpandIcon={<ChevronRight />}
          expanded={this.state.expandedNodeIds}
          selected={this.state.selectedNodeIds}
          onNodeToggle={(event: React.SyntheticEvent, nodeIds: string[]) => {
            this.setState({ expandedNodeIds: nodeIds });
          }}
          onNodeSelect={(event: React.SyntheticEvent, nodeIds: string[]) => {
            this.setState({ selectedNodeIds: nodeIds })
          }}
          sx={{ height: '100%', flexGrow: 1, overflowY: 'auto' }}
        >
          {this.getFamousJuansTree()}
          {this.state.catalogTree && this.getCatalogsByBuleiTree(this.state.catalogTree)}
        </TreeView>
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
          <>
            <IonHeader>
              <IonToolbar>
                <IonButton fill="clear" slot='start'
                  hidden={this.props.settings.uiMode === UiMode.Touch}
                  onClick={e => this.openMenuAndSelectItem()}>
                  <IonIcon icon={list} slot='icon-only' />
                </IonButton>

                <IonButton fill='clear' slot='end' onClick={e => Globals.shareByLink(this.props.dispatch)}>
                  <IonIcon icon={shareSocial} slot='icon-only' />
                </IonButton>
              </IonToolbar>
            </IonHeader>
            <div className='contentCenter'>
              <IonLabel>
                <div>
                  <div>請選擇經卷</div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>
                    請按左上方目錄按鈕<IonIcon icon={list} slot='icon-only' />
                  </div>
                </div>
              </IonLabel>
            </div>
          </>
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
    </IonPage>
  }
};

const mapStateToProps = (state: any, ownProps: Props) => {
  return {
    bookmarks: state.settings.bookmarks,
    tmpSettings: state.tmpSettings,
    settings: state.settings,
  };
};

const CatalogDesktopPage = withIonLifeCycle(_CatalogDesktopPage);

export default connect(
  mapStateToProps,
)(CatalogDesktopPage);
