//import * as fs from 'fs';
import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, withIonLifeCycle, IonIcon, IonAlert, IonPopover, IonList, IonItem, IonLabel, IonRange, IonFab, IonFabButton, IonToast, IonLoading } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import queryString from 'query-string';
import './EPubViewPage.css';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search, ellipsisHorizontal, ellipsisVertical, arrowForward, text, playCircle, pauseCircle } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { Work } from '../models/Work';
import SearchAlert from '../components/SearchAlert';
import ePub, { Book, Rendition } from 'epubjs-myh';
import * as nodepub from 'nodepub';

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  fontSize: number;
  scrollbarSize: number;
  settings: any;
  darkMode: boolean;
  showComments: boolean;
  paginated: Boolean;
  rtlVerticalLayout: boolean;
  useFontKai: boolean;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  work: string;
  path: string;
  label: string;
}> { }

enum SpeechState {
  UNINITIAL,
  SPEAKING,
  PAUSE
}

interface State {
  isLoading: boolean;
  fetchError: boolean;
  htmlStr: string | null;
  showBookmarkingAlert: boolean;
  showAddBookmarkSuccess: boolean;
  showSearchAlert: boolean;
  popover: any;
  speechState: SpeechState;
}

class _EPubViewPage extends React.Component<PageProps, State> {
  htmlFile: string;
  book: Book | null;
  rendition: Rendition | null;
  epub: any;
  displayed: any;
  cfiRange: string;

  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: true,
      fetchError: false,
      htmlStr: null,
      showBookmarkingAlert: false,
      showAddBookmarkSuccess: false,
      showSearchAlert: false,
      popover: {
        show: false,
        event: null,
      },
      speechState: SpeechState.UNINITIAL,
    }
    this.htmlFile = '';
    this.book = null;
    this.rendition = null;
    this.cfiRange = '';
    document.addEventListener("keyup", this.keyListener.bind(this), false);
  }

  async loadEpubCoverToMemFs() {
    let logoArray = new Uint8Array(JSON.parse(localStorage.getItem('logo.png') || '[]'));

    if (logoArray.length === 0) {
      // Download book logo.
      const res = await Globals.axiosInstance.get(`${window.location.origin}/assets/icon/icon.png`, {
        responseType: 'arraybuffer',
      });
      logoArray = new Uint8Array(res.data);
      let logoStr = JSON.stringify(Array.from(logoArray));
      localStorage.setItem('logo.png', logoStr);
    }
    let fs = require('fs');
    fs.writeFileSync('logo.png', logoArray);
  }

  uuidStr = '';
  ionViewWillEnter() {
    this.setState({ isLoading: true });
    let queryParams = queryString.parse(this.props.location.search) as any;
    this.htmlFile = queryParams.file;
    let state = this.props.location.state as any;
    this.uuidStr = state ? state.uuid : '';
    //console.log( 'view will enter' );
    this.fetchData(this.props.match.params.path);
  }

  ionViewDidEnter() {
  }

  get fileName() {
    return `${this.props.match.params.work}_juan${this.props.match.params.path}.html`;
  }

  async fetchData(juan: string) {
    let htmlStr = localStorage.getItem(this.fileName);

    try {
      if (htmlStr != null) {
        // Do nothing.
      } else {
        if (this.htmlFile) {
          const res = await Globals.axiosInstance.get(`/${this.htmlFile}`, {
            responseType: 'arraybuffer',
          });
          let tryDecoder = new TextDecoder();
          let tryDecodeHtmlStr = tryDecoder.decode(res.data);
          if (tryDecodeHtmlStr.includes('charset=big5')) {
            htmlStr = new TextDecoder('big5').decode(res.data);
          } else {
            htmlStr = tryDecodeHtmlStr;
          }
        } else {
          const res = await Globals.axiosInstance.get(`/juans?edition=CBETA&work=${this.props.match.params.work}&juan=${juan}`, {
            responseType: 'arraybuffer',
          });
          let data = JSON.parse(new TextDecoder().decode(res.data));
          htmlStr = data.results[0];
        }

        // Convert HTML to XML, because ePub requires XHTML.
        // Bad structured HTML will cause DOMParser parse error on some browsers!
        let doc = document.implementation.createHTMLDocument("");
        doc.body.innerHTML = htmlStr!;
        htmlStr = new XMLSerializer().serializeToString(doc.body);
        // Remove body tag.
        htmlStr = htmlStr.replace('<body', '<div');
        htmlStr = htmlStr.replace('/body>', '/div>');
      }
    } catch (e) {
      console.error(e);
      this.setState({ isLoading: false, fetchError: true });
      return false;
    }

    await this.loadEpubCoverToMemFs();

    this.setState({ htmlStr: htmlStr });
    return true;
  }

  epubcfi = '';
  addBookmarkHandler() {
    let iframeWin = document.getElementsByTagName('iframe')[0].contentWindow;
    let sel = iframeWin?.getSelection();
    if (sel?.rangeCount) {
      let uuidStr = uuid.v4();
      this.props.dispatch({
        type: "ADD_BOOKMARK",
        // IMPORTANT!!! Don't arbitrarily change the HTML structure of htmlStr.
        // Otherwise, saved epubcfi bookmarks will become invalid!
        htmlStr: this.state.htmlStr,
        bookmark: new Bookmark({
          type: BookmarkType.JUAN,
          uuid: uuidStr,
          selectedText: sel.toString(),
          epubcfi: this.epubcfi,
          fileName: `${this.props.match.params.work}_juan${this.props.match.params.path}.html`,
          work: new Work({
            juan: this.props.match.params.path,
            title: this.props.match.params.label,
            work: this.props.match.params.work,
          }),
        }),
      });
      sel?.removeAllRanges();
      this.setState({ showAddBookmarkSuccess: true });
    } else {
      this.setState({ showBookmarkingAlert: true });
    }

    return;
  }

  get isTopPage() {
    return this.props.match.url === '/catalog';
  }

  get bookmark() {
    return this.props.bookmarks.find(
      (e) => e.type === BookmarkType.JUAN && e.uuid === this.uuidStr);
  }

  get hasBookmark() {
    return this.bookmark != null;
  }

  ionViewWillLeave() {
    speechSynthesis.pause();
    this.setState({ htmlStr: null, speechState: SpeechState.PAUSE });
    this.book?.destroy();
    this.book = null;
    this.bookCreated = false;
  }

  pagePrev() {
    if (this.props.paginated) {
      this.rendition?.prev();
    }
  }

  pageNext() {
    if (this.props.paginated) {
      this.rendition?.next();
    }
  }

  keyListener(e: KeyboardEvent) {
    let key = e.keyCode || e.which;

    console.log(e.type)

    // Left/down Key
    if (key === (this.props.rtlVerticalLayout ? 37 : 40)) {
      this.pageNext()
    }

    // Right/top Key
    if (key === (this.props.rtlVerticalLayout ? 39 : 38)) {
      this.pagePrev();
    }
  };

  bookCreated = false;
  async html2Epub() {
    this.bookCreated = true;
    this.epub = nodepub.document({
      id: '123-123456789',
      title: 'Title',
      series: '',
      sequence: 1,
      author: 'Author',
      fileAs: '',
      genre: 'genre',
      tags: '',
      copyright: '',
      publisher: '',
      published: '',
      language: 'en',
      description: 'A temp book.',
      contents: this.props.match.params.label,
      source: '',
      images: ['logo.png'],
    }, 'logo.png');
    this.epub.addSection('', this.state.htmlStr, true, false);

    let rtlVerticalStyles = `
    html {
      writing-mode: vertical-rl;
      direction: ltr;
    }
    `;
    this.epub.addCSS(`
    @font-face {
        font-family: 'Kai';
        font-style: normal;
        font-weight: 500;
        /* Font source: https://data.gov.tw/dataset/5961 */
        src: url('${window.location.origin}/assets/TW-Kai-98_1.woff');
        font-display: swap;
    }

    @font-face {
        font-family: 'Times';
        src: local('Times New Roman');
        unicode-range: U+0-007F;
    }

    /* Workaround parenthesis orientation problem of TW-Kai-98_1 on iOS Safari. */
    @font-face {
        font-family: 'Heiti';
        src: local('Heiti TC');
        unicode-range: U+3008-301B, U+FF01-FF60;
    }

    .lb {
      display: none
    }
  
    ${this.props.rtlVerticalLayout ? rtlVerticalStyles : ''}

    .t, p, div {
      color: ${getComputedStyle(document.body).getPropertyValue('--ion-text-color')};
      font-family: ${getComputedStyle(document.body).getPropertyValue('--ion-font-family')};
      font-size: ${this.props.fontSize}px;
    }
    
    /* Disable this to workaround epubjs page counting problem.
    #back, #cbeta-copyright {
      display: ${this.props.showComments ? "block" : "none"};
    }*/
    `);
    //await new Promise((ok, fail) => {
    this.epub.writeEPUB(
      (e: any) => {
        console.log(`Error: ${e}`);
      },
      '.', 'temp',
      async () => {
        let fs = require('fs');
        let tempEpubBuffer = fs.readFileSync('temp.epub');
        this.book = ePub(tempEpubBuffer.buffer, {
          openAs: 'binary',
        });
        this.rendition = this.book.renderTo('cbetarEPubView', {
          width: "100%", height: "100%",
          spread: 'none',
          flow: this.props.paginated ? 'paginated' : 'scrolled',
          scrollbarWidth: Globals.scrollbarSizeIdToValue(this.props.scrollbarSize),
          defaultDirection: this.props.rtlVerticalLayout ? 'rtl' : 'ltr',
        });
        //this.rendition.on("keyup", this.keyListener.bind(this));

        this.rendition.on("selected", (cfiRange: any, contents: any) => {
          this.epubcfi = cfiRange;
          /*
          this.rendition?.annotations.highlight(cfiRange, {}, (e: any) => {
            console.log("highlight clicked", e.target);
          });*/
          //contents.window.getSelection().removeAllRanges();
        });

        let epubcfi = this.hasBookmark ? this.bookmark!.epubcfi : 'epubcfi(/6/6[s1]!/4/4/2/6[body]/6,/1:0,/1:1)';
        await this.rendition.display(this.props.paginated ? epubcfi : undefined);
        if (!this.props.paginated) {
          // Skip cover page.
          await this.rendition?.next();
          // Skip TOC page.
          await this.rendition?.next();
        }
        this.setState({ isLoading: false });

        if (this.hasBookmark) {
          try {
            this.rendition?.annotations.highlight(epubcfi);
          } catch (e) {
            console.error(e);
          }
        }
        this.book?.locations.generate(150);
      }
    );
    //});
  }

  render() {
    let epubjsScrollRtlModeVerticalScrollbarBugWokaroundCss = `
    <style>
    .epub-view {
      height: 100% !important;
    }
    </style>
    `;

    let header = (
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>{this.props.match.params.label}</IonTitle>
          <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
            <IonIcon icon={arrowBack} slot='icon-only' />
          </IonButton>
          <IonButton fill="clear" slot='end' onClick={e => {
            if (speechSynthesis.getVoices().length === 0) {
              return;
            }

            switch (this.state.speechState) {
              case SpeechState.UNINITIAL:
                const ePubIframe = document.getElementsByTagName('iframe')[0];
                const workText = ePubIframe.contentDocument?.getElementById('body')?.innerText;
                let ssu = new SpeechSynthesisUtterance(workText);
                //ssu.lang = 'zh_TW_#Hant';
                ssu.rate = 0.8;
                ssu.volume = 1;
                speechSynthesis.speak(ssu);
                this.setState({speechState: SpeechState.SPEAKING});
                break;
              case SpeechState.SPEAKING:
                speechSynthesis.pause();
                this.setState({speechState: SpeechState.PAUSE});
                break;
              case SpeechState.PAUSE:
                speechSynthesis.resume();
                this.setState({speechState: SpeechState.SPEAKING});
                break;
            }
          }}>
            <IonIcon icon={this.state.speechState === SpeechState.SPEAKING ? pauseCircle : playCircle } slot='icon-only' />
          </IonButton>
          <IonButton fill="clear" slot='end' onClick={e => this.addBookmarkHandler()}>
            <IonIcon icon={bookmark} slot='icon-only' />
          </IonButton>

          <IonButton fill="clear" slot='end' onClick={e => this.setState({ popover: { show: true, event: e.nativeEvent } })}>
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
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>回首頁</IonLabel>
              </IonItem>
              <IonItem button onClick={e => {
                this.setState({ showSearchAlert: true });
                this.setState({ popover: { show: false, event: null } });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={search} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>搜尋經文</IonLabel>
              </IonItem>
              <IonItem>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={text} slot='start' />
                <div style={{ width: '100%' }}>
                  <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>跳頁(%)</IonLabel>
                  <IonRange min={0} max={100} step={10} snaps pin onIonChange={e => {
                    let percent = e.detail.value as number;
                    let ratio = percent / 100 + '';
                    ratio = (ratio === '0' || ratio === '1') ? `${ratio}.0` : ratio;
                    this.rendition?.display(ratio);
                  }} />
                </div>
              </IonItem>
            </IonList>
          </IonPopover>
        </IonToolbar>
      </IonHeader>
    );

    const fabButtonOpacity = 0.2;
    let navButtons = (<>
      <IonFab vertical='center' horizontal='start' slot='fixed'>
        <IonFabButton style={{ opacity: fabButtonOpacity }} onClick={e => this.props.rtlVerticalLayout ? this.pageNext() : this.pagePrev()}
          onTouchStart={e => {
            e.currentTarget.style.setProperty('opacity', '1');
          }}
          onMouseOver={e => {
            // Disable mouse events for iOS. Because a touch stat gesture can trigger onMouseOver, but a touch-end gesture can't trigger onMouseLeave.
            if (Globals.isTouchDevice()) {
              return;
            }
            e.currentTarget.style.setProperty('opacity', '1');
          }}
          onTouchEnd={e => {
            e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
          }}
          onMouseLeave={e => {
            if (Globals.isTouchDevice()) {
              return;
            }
            e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
          }}>
          <IonIcon icon={arrowBack} />
        </IonFabButton>
      </IonFab>
      <IonFab vertical='center' horizontal='end' slot='fixed'>
        <IonFabButton style={{ opacity: fabButtonOpacity }} onClick={e => this.props.rtlVerticalLayout ? this.pagePrev() : this.pageNext()} onTouchStart={e => {
          e.currentTarget.style.setProperty('opacity', '1');
        }}
          onMouseOver={e => {
            if (Globals.isTouchDevice()) {
              return;
            }
            e.currentTarget.style.setProperty('opacity', '1');
          }}
          onTouchEnd={e => {
            e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
          }}
          onMouseLeave={e => {
            if (Globals.isTouchDevice()) {
              return;
            }
            e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
          }}>
          <IonIcon icon={arrowForward} />
        </IonFabButton>
      </IonFab>
    </>);

    if (!this.bookCreated && this.state.htmlStr != null) {
      this.html2Epub();
    }

    return (
      <IonPage>
        {header}
        <IonContent>
          {this.props.paginated ? navButtons : <></>}

          <IonLoading
            cssClass='uiFont'
            isOpen={this.state.isLoading}
            onDidDismiss={() => this.setState({ isLoading: false })}
            message={'載入中...'}
          />

          {this.state.fetchError ? Globals.fetchErrorContent : <></>}

          <div id='cbetarEPubView' style={{ width: '100%', height: '100%', userSelect: "text", WebkitUserSelect: "text" }} dangerouslySetInnerHTML={{
            __html: `
            ${this.props.rtlVerticalLayout && !this.props.paginated ? epubjsScrollRtlModeVerticalScrollbarBugWokaroundCss : ''}
            `
          }}>
          </div>

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

          <IonAlert
            cssClass='uiFont'
            isOpen={this.state.showBookmarkingAlert}
            backdropDismiss={false}
            header='書籤新增失敗'
            message='請確認是否已選擇一段文字，再新增書籤!'
            buttons={[
              {
                text: '確定',
                cssClass: 'primary uiFont',
                handler: (value) => {
                  this.setState({
                    showBookmarkingAlert: false,
                  });
                },
              }
            ]}
          />

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showAddBookmarkSuccess}
            onDidDismiss={() => this.setState({ showAddBookmarkSuccess: false })}
            message="書籤新增成功！"
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
    fontSize: state.settings.fontSize,
    showComments: state.settings.showComments,
    paginated: state.settings.paginated,
    rtlVerticalLayout: state.settings.rtlVerticalLayout,
    settings: state.settings,
    scrollbarSize: state.settings.scrollbarSize,
  }
};

const EPubViewPage = withIonLifeCycle(_EPubViewPage);

export default connect(
  mapStateToProps,
)(EPubViewPage);
