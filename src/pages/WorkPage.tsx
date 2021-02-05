import React from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle, IonButton, IonIcon, IonToast, IonLoading } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import './WorkPage.css';
import { Work, WorkChapter, WorkListType } from '../models/Work';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search, shareSocial, refreshCircle } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import SearchAlert from '../components/SearchAlert';

const electronBackendApi: any = (window as any).electronBackendApi;

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  workListType: WorkListType;
  cbetaOfflineDbMode: boolean;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

interface State {
  work: Work | null;
  showSearchAlert: boolean;
  showAddBookmarkDone: boolean;
  isLoading: boolean;
  fetchError: boolean;
}

class _WorkPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      work: null,
      showSearchAlert: false,
      showAddBookmarkDone: false,
      isLoading: false,
      fetchError: false,
    }
  }

  ionViewWillEnter() {
    //console.log( `${this.props.match.params} will enter` );
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
        if (this.props.cbetaOfflineDbMode) {
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
        } else {
          const res = await Globals.axiosInstance.get(`/works?work=${path}`, {
            responseType: 'arraybuffer',
          });
          data = JSON.parse(new TextDecoder().decode(res.data));
        }
        const works = data.results as [Work];
        work = works[0];

        // [TODO]
        if (!this.props.cbetaOfflineDbMode) {
          const resToc = await Globals.axiosInstance.get(`/toc?work=${path}`) as any;
          work.mulu = (resToc.data.results[0].mulu as WorkChapter[]).map((wc) => new WorkChapter(wc));
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
        const res = await Globals.fetchJuan(work.work, this.fetchJuan, null);
        Globals.saveFileToIndexedDB(Globals.getFileName(work.work, this.fetchJuan), res.htmlStr);
      } catch (err) {
        console.error(`Fetching juan ${i} failed! ${err}`);
        console.error(new Error().stack);
      }
    }
  }

  async addBookmarkHandler() {
    if (!this.props.cbetaOfflineDbMode) {
      await this.saveJuans();
    }
    this.setState({ showAddBookmarkDone: true });
    this.props.dispatch({
      type: "ADD_BOOKMARK",
      bookmark: new Bookmark({
        type: BookmarkType.WORK,
        uuid: this.props.match.params.path,
        selectedText: this.state.work!.title,
        epubcfi: '',
        fileName: '',
        work: this.state.work!,
      }),
    });
  }

  delBookmarkHandler() {
    this.props.dispatch({
      type: "DEL_BOOKMARK",
      uuid: this.props.match.params.path,
    });
  }

  get isTopPage() {
    return this.props.match.url === '/catalog';
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
    let rows = Array<object>();
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
    let rows = Array<object>();
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
  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonButton fill='outline' shape='round' size='large' slot='start' onClick={ev => {
              const newWorkListType = this.props.workListType === WorkListType.BY_CHAPTER ? WorkListType.BY_JUAN : WorkListType.BY_CHAPTER;
              this.props.dispatch({
                type: "TMP_SET_KEY_VAL",
                key: 'workListType',
                val: newWorkListType
              });
            }}>
              <span className='uiFont' style={{ color: 'var(--color)' }}>{this.props.workListType === WorkListType.BY_CHAPTER ? '分品' : '分卷'}</span>
            </IonButton>

            <IonButton hidden={!this.state.fetchError} fill="clear" slot='end' onClick={e => this.fetchWork(this.props.match.params.path)}>
              <IonIcon icon={refreshCircle} slot='icon-only' />
            </IonButton>

            <IonButton fill={this.hasBookmark ? 'solid' : 'clear'} slot='end' onClick={e => this.hasBookmark ? this.delBookmarkHandler() : this.addBookmarkHandler()}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onClick={e => this.props.history.push(`/${this.props.match.params.tab}`)}>
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
          <div className='uiFontX2' style={{ color: 'var(--ion-color-primary)' }}>{this.state.work?.title}</div>
          {
            this.state.fetchError ? Globals.fetchErrorContent :
              <IonList>
                {this.props.workListType === WorkListType.BY_CHAPTER ? this.getRowsByChapter() : this.getRowsByJuan()}
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
      </IonPage>
    );
  }
};

const WorkPage = withIonLifeCycle(_WorkPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: state.settings.bookmarks,
    // Default to WorkListType.BY_JUAN, because work list by chapter might be empty.
    workListType: state.tmpSettings.workListType !== undefined ? state.tmpSettings.workListType : WorkListType.BY_JUAN,
    cbetaOfflineDbMode: state.tmpSettings.cbetaOfflineDbMode,
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(WorkPage);
