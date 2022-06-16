import React from 'react';
import { IonContent, IonHeader, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle, IonButton, IonIcon, IonToast, IonLoading, IonPopover } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import './WorkTouch.css';
import { Work, WorkChapter, WorkListType } from '../models/Work';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search, shareSocial, refreshCircle, ellipsisVertical, ellipsisHorizontal } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import SearchAlert from './SearchAlert';
import { TmpSettings } from '../models/TmpSettings';
import fetchJuan from '../fetchJuan';
import { CbetaDbMode, Settings } from '../models/Settings';
import CbetaOfflineIndexedDb from '../CbetaOfflineIndexedDb';
import IndexedDbFuncs from '../IndexedDbFuncs';

const electronBackendApi: any = (window as any).electronBackendApi;

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  settings: Settings;
  tmpSettings: TmpSettings;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

interface State {
  work: Work | null;
  popover: any;
  showSearchAlert: boolean;
  showAddBookmarkDone: boolean;
  isLoading: boolean;
  fetchError: boolean;
}

class _WorkTouchPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      work: null,
      popover: {
        show: false,
        event: null,
      },
      showSearchAlert: false,
      showAddBookmarkDone: false,
      isLoading: false,
      fetchError: false,
    }
  }

  ionViewWillEnter() {
    console.log( `work ${this.props.match.path} will enter` );
    this.fetchWork(this.props.match.params.path);
  }

  componentDidMount() {
  }

  async fetchWork(path: string) {
    this.setState({ isLoading: true });
    let work: Work | null;
    if (this.hasBookmark) {
      work = this.bookmark!.work!;
    } else {
      try {
        let data: any;
        switch (this.props.settings.cbetaOfflineDbMode) {
          case CbetaDbMode.OfflineIndexedDb:
            data = await CbetaOfflineIndexedDb.fetchWork(path);
            break;
          case CbetaDbMode.OfflineFileSystem:
            electronBackendApi?.send("toMain", { event: 'fetchWork', path: path });
            data = await new Promise((ok, fail) => {
              electronBackendApi?.receiveOnce("fromMain", (data: any) => {
                switch (data.event) {
                  case 'fetchWork':
                    ok(data);
                    break;
                }
              });
            });
            break;
          case CbetaDbMode.Online:
            const res = await Globals.axiosInstance.get(`/works?work=${path}`, {
              responseType: 'arraybuffer',
            });
            data = JSON.parse(new TextDecoder().decode(res.data));
            break;
        }
        const works = data.results as [Work];
        work = works[0];

        // [TODO]
        if (this.props.settings.cbetaOfflineDbMode === CbetaDbMode.Online) {
          const resToc = await Globals.axiosInstance.get(`/toc?work=${path}`) as any;
          work.mulu = (resToc.data.results[0].mulu as WorkChapter[]).map((wc) => (wc as WorkChapter));
        }

      } catch (err) {
        console.error(err);
        console.error(new Error().stack);
        this.setState({ fetchError: true, isLoading: false });
        return false;
      }
    }

    this.setState({ fetchError: false, isLoading: false, work: work });
    return true;
  }

  fetchJuan = '';
  async saveJuans() {
    let work = this.state.work!;
    let juans = work.juan_list.split(',');
    for (let i = 0; i < juans.length; i++) {
      this.fetchJuan = juans[i];
      try {
        const res = await fetchJuan(work.work, this.fetchJuan, null);
        IndexedDbFuncs.saveFile(Globals.getFileName(work.work, this.fetchJuan), res.htmlStr);
      } catch (err) {
        console.error(`Fetching juan ${i} failed! ${err}`);
        console.error(new Error().stack);
      }
    }
  }

  async addBookmarkHandler() {
    if (this.props.settings.cbetaOfflineDbMode === CbetaDbMode.Online) {
      await this.saveJuans();
    }
    this.setState({ showAddBookmarkDone: true });
    this.props.dispatch({
      type: "ADD_BOOKMARK",
      bookmark: {
        type: BookmarkType.WORK,
        uuid: this.props.match.params.path,
        selectedText: this.state.work!.title,
        epubcfi: '',
        fileName: '',
        work: this.state.work!,
      } as Bookmark,
    });
  }

  delBookmarkHandler() {
    this.props.dispatch({
      type: "DEL_BOOKMARK",
      uuid: this.props.match.params.path,
    });
  }

  get bookmark() {
    return this.props.bookmarks.find(
      (e) => e.type === BookmarkType.WORK && e.uuid === this.props.match.params.path);
  }

  get hasBookmark() {
    return this.bookmark != null;
  }

  getRowsByChapter() {
    let work = this.state.work;
    const mulu = work?.mulu;
    let rows = Array<JSX.Element>();
    for (let i = 0; i < (mulu?.length || -1); i++) {
      let routeLink = `/catalog/juan/${work?.work}/${mulu![i].juan}`;
      rows.push(
        <IonItem key={`chapterItem` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
          });
        }}>
          <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
          <IonLabel className='ion-text-wrap uiFont' key={`chapterLabel` + i}>
            {mulu![i].title}
          </IonLabel>
        </IonItem>
      );
    }
    return rows;
  }

  getRowsByJuan() {
    let work = this.state.work;
    let rows = Array<JSX.Element>();
    let juans = work?.juan_list.split(',');
    for (let i = 0; i < (juans?.length || -1); i++) {
      //if (work.nodeType == 'html')
      let routeLink = `/catalog/juan/${work?.work}/${juans![i]}`;
      rows.push(
        <IonItem key={`juanItem` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
          });
        }}>
          <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
          <IonLabel className='ion-text-wrap uiFont' key={`juanLabel` + i}>
            卷{juans![i]}
          </IonLabel>
        </IonItem>
      );
    }
    return rows;
  }

  //work = this.works[0] as Work;
  // Default to WorkListType.BY_JUAN, because work list by chapter might be empty.
  workListType = this.props.tmpSettings.workListType !== undefined ? this.props.tmpSettings.workListType : WorkListType.BY_JUAN;
  render() {
    return (
      <>
        <IonHeader>
          <IonToolbar>
            <IonButton fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonButton fill='outline' shape='round' size='large' slot='start' onClick={ev => {
              const newWorkListType = this.workListType === WorkListType.BY_CHAPTER ? WorkListType.BY_JUAN : WorkListType.BY_CHAPTER;
              this.props.dispatch({
                type: "TMP_SET_KEY_VAL",
                key: 'workListType',
                val: newWorkListType
              });
            }}>
              <span className='uiFont' style={{ color: 'var(--color)' }}>{this.workListType === WorkListType.BY_CHAPTER ? '分品' : '分卷'}</span>
            </IonButton>

            <IonButton hidden={!this.state.fetchError} fill="clear" slot='end' onClick={e => this.fetchWork(this.props.match.params.path)}>
              <IonIcon icon={refreshCircle} slot='icon-only' />
            </IonButton>

            <IonButton fill={this.hasBookmark ? 'solid' : 'clear'} slot='end' onClick={e => this.hasBookmark ? this.delBookmarkHandler() : this.addBookmarkHandler()}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>

            <IonButton className='narrowScreenHide' fill="clear" slot='end' onClick={e => this.props.history.push(`/${this.props.match.params.tab}`)}>
              <IonIcon icon={home} slot='icon-only' />
            </IonButton>

            <IonButton className='narrowScreenHide' fill='clear' slot='end' onClick={e => this.setState({ showSearchAlert: true })}>
              <IonIcon icon={search} slot='icon-only' />
            </IonButton>

            <IonButton className='narrowScreenHide' fill='clear' slot='end' onClick={e => Globals.shareByLink(this.props.dispatch)}>
              <IonIcon icon={shareSocial} slot='icon-only' />
            </IonButton>

            <IonButton className='narrowScreenShow' fill="clear" slot='end' onClick={e => {
              this.setState({ popover: { show: true, event: e.nativeEvent } });
            }}>
              <IonIcon ios={ellipsisHorizontal} md={ellipsisVertical} slot='icon-only' />
            </IonButton>
            <IonPopover
              isOpen={this.state.popover.show}
              event={this.state.popover.event}
              onDidDismiss={e => { this.setState({ popover: { show: false, event: null } }) }}
            >
              <IonList>
                <IonItem button onClick={e => {
                  this.props.history.push(`/${this.props.match.params.tab}`);
                  this.setState({ popover: { show: false, event: null } });
                }}>

                  <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                  <IonIcon icon={home} slot='start' />
                  <IonLabel className='ion-text-wrap uiFont'>回首頁</IonLabel>
                </IonItem>

                <IonItem button onClick={e => {
                  this.setState({ popover: { show: false, event: null } });
                  this.setState({ showSearchAlert: true });
                }}>
                  <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                  <IonIcon icon={search} slot='start' />
                  <IonLabel className='ion-text-wrap uiFont'>搜尋經書</IonLabel>
                </IonItem>

                <IonItem button onClick={ev => {
                  this.setState({ popover: { show: false, event: null } });
                  Globals.shareByLink(this.props.dispatch);
                }}>
                  <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                  <IonIcon icon={shareSocial} slot='start' />
                  <IonLabel className='ion-text-wrap uiFont'>分享此頁</IonLabel>
                </IonItem>
              </IonList>
            </IonPopover>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className='uiFontX2' style={{ color: 'var(--ion-color-primary)' }}>{this.state.work?.title}</div>
          {
            this.state.fetchError ? Globals.fetchErrorContent :
              <IonList>
                {this.workListType === WorkListType.BY_CHAPTER ? this.getRowsByChapter() : this.getRowsByJuan()}
              </IonList>
          }

          <SearchAlert
            {...{
              showSearchAlert: (this.state as any).showSearchAlert,
              finish: () => { this.setState({ showSearchAlert: false }) }, ...this.props
            }}
          />

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showAddBookmarkDone}
            onDidDismiss={() => this.setState({ showAddBookmarkDone: false })}
            message={`書籤新增成功！`}
            duration={2000}
          />

          <IonLoading
            cssClass='uiFont'
            isOpen={this.state.isLoading}
            onDidDismiss={() => this.setState({ isLoading: false })}
            message={'載入中...'}
          />
        </IonContent>
      </>
    );
  }
};

const WorkTouchPage = withIonLifeCycle(_WorkTouchPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: state.settings.bookmarks,
    tmpSettings: state.tmpSettings,
    settings: state.settings,
  };
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(WorkTouchPage);
