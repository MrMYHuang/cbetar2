//import * as fs from 'fs';
import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, withIonLifeCycle, IonIcon, IonAlert, IonPopover, IonList, IonItem, IonLabel, IonRange } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import queryString from 'query-string';
import './WebViewPage.css';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search, ellipsisHorizontal, ellipsisVertical, arrowForward, arrowUp, arrowDown, text } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { Work } from '../models/Work';
import SearchAlert from '../components/SearchAlert';
import ePub, { Book, Rendition } from 'epubjs';
import * as nodepub from 'nodepub';

const bookmarkPrefix = 'bookmark_';
function scrollToBookmark(uuidStr: string) {
  console.log('Bookmark uuid: ' + bookmarkPrefix + uuidStr);
  document.getElementById(bookmarkPrefix + uuidStr)?.scrollIntoView();
}
//window.scrollToBookmark = scrollToBookmark;

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  uiFontSize: number;
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

interface State {
  htmlStr: string | null;
  showBookmarkingAlert: boolean;
  showSearchAlert: boolean;
  popover: any;
}

class _WebViewPage extends React.Component<PageProps, State> {
  htmlFile: string;
  book: Book | null;
  rendition: Rendition | null;
  epub: any;
  displayed: any;
  cfiRange: string;

  constructor(props: any) {
    super(props);
    this.state = {
      htmlStr: null,
      showBookmarkingAlert: false,
      showSearchAlert: false,
      popover: {
        show: false,
        event: null,
      },
    }
    this.htmlFile = '';
    this.book = null;
    this.rendition = null;
    this.cfiRange = '';
  }

  uuidStr = '';
  ionViewWillEnter() {
    let queryParams = queryString.parse(this.props.location.search) as any;
    this.htmlFile = queryParams.file;
    let state = this.props.location.state as any;
    this.uuidStr = state ? state.uuid : '';
    //console.log( 'view will enter' );
    this.fetchData(this.props.match.params.path);
  }

  ionViewDidEnter() {
    scrollToBookmark(this.uuidStr);
  }

  get fileName() {
    return `${this.props.match.params.work}_juan${this.props.match.params.path}.html`;
  }

  async fetchData(juan: string) {
    let htmlStr = localStorage.getItem(this.fileName);
    if (htmlStr != null) {
      // Do nothing.
    } else if (this.htmlFile) {
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
      //try {
      const res = await Globals.axiosInstance.get(`/juans?edition=CBETA&work=${this.props.match.params.work}&juan=${juan}`, {
        responseType: 'arraybuffer',
      });
      let data = JSON.parse(new TextDecoder().decode(res.data));
      htmlStr = data.results[0];
    }

    // Download book logo.
    const res = await Globals.axiosInstance.get(`https://github.com/MrMYHuang/MrMYHuang.github.io/raw/master/assets/icon/icon.png`, {
      responseType: 'arraybuffer',
    });
    let fs = require('fs');
    fs.writeFileSync('logo.png', new Uint8Array(res.data));

    // Convert HTML to XML, because ePub requires XHTML.
    // Bad structured HTML will cause DOMParser parse error on some browsers!
    let doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = htmlStr!;
    htmlStr = new XMLSerializer().serializeToString(doc.body);
    // Remove body tag.
    htmlStr = htmlStr.replace('<body', '<div');
    htmlStr = htmlStr.replace('/body>', '/div>');

    this.setState({ htmlStr: htmlStr });
    return true;

    /*
  } catch (e) {
    fetchFail = true;
  }*/
  }

  addBookmarkHandler() {
    let uuidStr = uuid.v4();
    var sel, range;
    if (window.getSelection) {
      sel = (window.getSelection() as any);
      if (sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.startContainer.parentElement.id = bookmarkPrefix + uuidStr;

        const docBody = document.getElementById('cbetarWebView')?.innerHTML;

        this.props.dispatch({
          type: "ADD_BOOKMARK",
          htmlStr: docBody,
          bookmark: new Bookmark({
            type: BookmarkType.JUAN,
            uuid: uuidStr,
            selectedText: sel.toString(),
            fileName: `${this.props.match.params.work}_juan${this.props.match.params.path}.html`,
            work: new Work({
              juan: this.props.match.params.path,
              title: this.props.match.params.label,
              work: this.props.match.params.work,
            }),
          }),
        });
        this.uuidStr = uuidStr;
      } else {
        this.setState({ showBookmarkingAlert: true });
      }
    }

    return;
  }

  delBookmarkHandler() {
    var oldBookmark = document.getElementById(bookmarkPrefix + this.uuidStr);
    if (oldBookmark) {
      oldBookmark.id = '';
      const docBody = document.getElementById('cbetarWebView')?.innerHTML;
      this.props.dispatch({
        type: "DEL_BOOKMARK",
        uuid: this.uuidStr,
        htmlStr: docBody,
        fileName: this.bookmark?.fileName,
      });
      this.uuidStr = '';
    }
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
    this.setState({ htmlStr: null });
    this.book?.destroy();
    this.book = null;
    this.bookCreated = false;
  }

  pagePrev() {
    if (this.props.paginated) {
      this.pageCounter--;
      this.rendition?.prev();
    }
  }

  pageNext() {
    if (this.props.paginated) {
      this.pageCounter++;
      this.rendition?.next();
    }
  }

  keyListener(e: any) {
    let key = e.keyCode || e.which;

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
  pageCounter = 1;
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
      contents: 'Table of Contents',
      source: '',
      images: ['logo.png'],
    }, 'logo.png');
    this.epub.addSection('', this.state.htmlStr, true, false);

    let rtlVerticalStyles = `
    html {
      writing-mode: vertical-rl;
    }
    #body, #back, #cbeta-copyright, #cbetarWebView>p {
      direction: ltr;
      display: inline;
    }
    `;
    this.epub.addCSS(`
    .lb {
      display: none
    }
  
    ${this.props.rtlVerticalLayout ? rtlVerticalStyles : ''}

    .t, p, div {
      color: ${getComputedStyle(document.body).getPropertyValue('--ion-text-color')};
      font-family: ${getComputedStyle(document.body).getPropertyValue('--ion-font-family')};
      font-size: ${this.props.fontSize}px;
    }
    
    #back, #cbeta-copyright {
      display: ${this.props.showComments ? "block" : "none"};
    }
    `);
    //await new Promise((ok, fail) => {
    this.epub.writeEPUB(
      (e: any) => {
        console.log(`Error: ${e}`);
      },
      '.', 'temp',
      () => {
        let fs = require('fs');
        let tempEpubBuffer = fs.readFileSync('temp.epub');
        this.book = ePub(tempEpubBuffer.buffer, {
          openAs: 'binary',
          //openAs: 'epub'
          //replacements: 'base64',
         });
        this.rendition = this.book.renderTo('cbetarWebView', {
          width: "100%", height: "100%",
          spread: 'none',
          flow: this.props.paginated ? 'paginated' : 'scrolled',
          defaultDirection: this.props.rtlVerticalLayout ? 'rtl' : 'ltr',
        });
        this.rendition.on("keyup", this.keyListener.bind(this));
        document.addEventListener("keyup", this.keyListener.bind(this), false);

        this.rendition.on("selected", (cfiRange: any, contents: any) => {
          this.cfiRange = cfiRange;
          console.log(cfiRange);
          this.rendition?.annotations.highlight(cfiRange, {}, (e: any) => {
            console.log("highlight clicked", e.target);
          });
          contents.window.getSelection().removeAllRanges();
        });

        if (this.props.paginated) {
          this.pageCounter = 1;
        }
        this.rendition.display('epubcfi(/6/6[s1]!/4/4/2/6[body]/6,/1:0,/1:1)').then(() => {
          this.book?.locations.generate(150);
        });
      }
    );
    //});
  }

  render() {
    if (!this.bookCreated && this.state.htmlStr != null) {
      this.html2Epub();
    }
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: this.props.uiFontSize }}>{this.props.match.params.label}</IonTitle>
            <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" color={this.hasBookmark ? 'warning' : 'primary'} slot='end' onClick={e => this.hasBookmark ? this.delBookmarkHandler() : this.addBookmarkHandler()}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" slot='end' onClick={e => this.pageNext()}>
              <IonIcon icon={this.props.rtlVerticalLayout ? arrowBack : arrowDown} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" slot='end' onClick={e => this.pagePrev()}>
              <IonIcon icon={this.props.rtlVerticalLayout ? arrowForward : arrowUp} slot='icon-only' />
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
                  <IonIcon icon={home} slot='start' />
                  <IonLabel className='ion-text-wrap' style={{ fontSize: this.props.uiFontSize }}>回首頁</IonLabel>
                </IonItem>
                <IonItem button onClick={e => {
                  this.setState({ showSearchAlert: true });
                  this.setState({ popover: { show: false, event: null } });
                }}>
                  <IonIcon icon={search} slot='start' />
                  <IonLabel className='ion-text-wrap' style={{ fontSize: this.props.uiFontSize }}>搜尋經文</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={text} slot='start' />
                    <IonLabel className='ion-text-wrap' style={{ fontSize: this.props.uiFontSize }}>跳頁(%)</IonLabel>
                    <IonRange min={0} max={100} step={10} snaps pin onIonChange={e => {
                      let percent = e.detail.value as number;
                      let ratio = percent / 100 + '';
                      ratio = (ratio === '0' || ratio === '1') ? `${ratio}.0` : ratio;
                      this.rendition?.display(ratio);
                    }} />
                </IonItem>
              </IonList>
            </IonPopover>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div id='cbetarWebView' className='scrollbar' style={{ width: '100%', height: '100%', userSelect: "text", WebkitUserSelect: "text" }} dangerouslySetInnerHTML={{ __html: '' }}></div>

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
            isOpen={(this.state as any).showBookmarkingAlert}
            backdropDismiss={false}
            header='書籤新增失敗'
            message='請確認是否已選擇一段文字，再新增書籤!'
            buttons={[
              {
                text: '確定',
                cssClass: 'primary',
                handler: (value) => {
                  this.setState({
                    showBookmarkingAlert: false,
                  });
                },
              }
            ]}
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
    uiFontSize: state.settings.uiFontSize,
    showComments: state.settings.showComments,
    paginated: state.settings.paginated,
    rtlVerticalLayout: state.settings.rtlVerticalLayout,
    settings: state.settings,
  }
};

const WebViewPage = withIonLifeCycle(_WebViewPage);

export default connect(
  mapStateToProps,
)(WebViewPage);
