//import * as fs from 'fs';
import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, withIonLifeCycle, IonIcon, IonAlert, IonPopover, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonToast, IonLoading } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import queryString from 'query-string';
import './EPubViewPage.css';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search, ellipsisHorizontal, ellipsisVertical, arrowForward, musicalNotes, stopCircle, book, shareSocial, print } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { Work } from '../models/Work';
import SearchAlert from '../components/SearchAlert';
import ePub, { Book, Rendition, EVENTS } from 'epubjs-myh';
import * as nodepub from 'nodepub';

// Load TW-Kai font in iframe.
async function loadTwKaiFont(this: any) {
  const fontData = await Globals.getFileFromIndexedDB(Globals.twKaiFontKey);
  const fontFace = new (window as any).FontFace('Kai', fontData);
  await fontFace.load();
  (this.document as any).fonts.add(fontFace);
}

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  fontSize: number;
  scrollbarSize: number;
  settings: any;
  showComments: boolean;
  paginated: Boolean;
  rtlVerticalLayout: boolean;
  useFontKai: boolean;
  speechRate: number;
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
  workInfo: Work;
  htmlStr: string | null;
  currentPage: number;
  pageCount: number;
  showJumpPageAlert: boolean;
  showNoSelectedTextAlert: boolean;
  searchText: string;
  showSearchTextToast: boolean;
  showAddBookmarkSuccess: boolean;
  showsCopyToClipboardSuccess: boolean;
  showsCitationFail: boolean;
  showSearchTextAlert: boolean;
  showToast: boolean;
  toastMessage: string;
  showSearchAlert: boolean;
  popover: any;
  lookupDictPopover: any;
  speechState: SpeechState;
}

class _EPubViewPage extends React.Component<PageProps, State> {
  htmlFile: string;
  htmlTitle: string;
  book: Book | null;
  rendition: Rendition | null;
  epub: any;
  displayed: any;
  cfiRange: string;
  speechSynthesisUtterance: SpeechSynthesisUtterance;

  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: true,
      fetchError: false,
      workInfo: new Work({}),
      htmlStr: null,
      currentPage: 1,
      pageCount: 1,
      showJumpPageAlert: false,
      showNoSelectedTextAlert: false,
      showAddBookmarkSuccess: false,
      showsCopyToClipboardSuccess: false,
      showsCitationFail: false,
      showSearchTextAlert: false,
      searchText: '',
      showSearchTextToast: false,
      showToast: false,
      toastMessage: '',
      showSearchAlert: false,
      popover: {
        show: false,
        event: null,
      },
      lookupDictPopover: {
        show: false,
        data: [],
      },
      speechState: SpeechState.UNINITIAL,
    }
    this.htmlFile = '';
    this.htmlTitle = '';
    this.book = null;
    this.rendition = null;
    this.cfiRange = '';
    this.speechSynthesisUtterance = new SpeechSynthesisUtterance();
    this.speechSynthesisUtterance.lang = 'zh-TW';
    this.speechSynthesisUtterance.onend = (ev: SpeechSynthesisEvent) => {
      if (this.state.speechState === SpeechState.UNINITIAL) {
        return;
      }

      if (this.workTextsIndex < this.workTexts.length - 1) {
        this.workTextsIndex += 1;
        this.speechSynthesisUtterance.text = this.workTexts[this.workTextsIndex];
        speechSynthesis.speak(this.speechSynthesisUtterance);
        console.log(`Play work text to speech part: ${this.workTextsIndex}`);
      } else {
        this.setState({ speechState: SpeechState.UNINITIAL });
        console.log(`Stop work text to speech.`);
      }
    };
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
  epubcfiFromUrl = '';
  ionViewWillEnter() {
    this.setState({ isLoading: true });
    let queryParams = queryString.parse(this.props.location.search) as any;
    this.htmlFile = queryParams.file;
    this.htmlTitle = queryParams.title;
    this.epubcfiFromUrl = queryParams.bookmark || '';
    let state = this.props.location.state as any;
    this.uuidStr = state ? state.uuid : '';
    //console.log( 'view will enter' );
    this.fetchData();
  }

  ionViewDidEnter() {
  }

  get fileName() {
    return Globals.getFileName(
      this.props.match.params.work,
      this.props.match.params.path
    );
  }

  async fetchData() {
    try {
      const res = await Globals.fetchJuan(
        this.props.match.params.work,
        this.props.match.params.path,
        this.htmlFile,
      );

      await this.loadEpubCoverToMemFs();

      this.setState({ workInfo: res.workInfo, htmlStr: res.htmlStr });
    } catch (e) {
      console.error(e);
      this.setState({ isLoading: false, fetchError: true });
    }
  }

  epubcfiFromSelectedString = '';
  addBookmarkHandler() {
    const selectedText = this.getSelectedString();
    if (selectedText === '') {
      this.setState({ showNoSelectedTextAlert: true });
      return;
    }

    let uuidStr = uuid.v4();
    this.props.dispatch({
      type: "ADD_BOOKMARK",
      // IMPORTANT!!! Don't arbitrarily change the HTML structure of htmlStr.
      // Otherwise, saved epubcfi bookmarks will become invalid!
      htmlStr: this.state.htmlStr,
      bookmark: new Bookmark({
        type: this.htmlFile ? BookmarkType.HTML : BookmarkType.JUAN,
        uuid: uuidStr,
        selectedText: selectedText,
        epubcfi: this.epubcfiFromSelectedString,
        fileName: this.htmlFile || `${this.props.match.params.work}_juan${this.props.match.params.path}.html`,
        work: Object.assign(this.state.workInfo, {
          title: this.htmlFile ? this.htmlTitle : this.state.workInfo.title,
          juan: this.props.match.params.path,
        }
        ),
      }),
    });
    this.setState({ showAddBookmarkSuccess: true });
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
    return this.epubcfiFromUrl !== '' || this.bookmark != null;
  }

  get epubcfi() {
    return this.epubcfiFromUrl !== '' ? this.epubcfiFromUrl : this.bookmark != null ? this.bookmark!.epubcfi : 'epubcfi(/6/6[s1]!/4/4/2/6[body]/6,/1:0,/1:1)';
  }

  ionViewWillLeave() {
    speechSynthesis.cancel();
    this.setState({ htmlStr: null, currentPage: 1, speechState: SpeechState.UNINITIAL, showSearchTextToast: false });
    this.book?.destroy();
    this.book = null;
    this.bookCreated = false;
  }

  pagePrev(n: number = 1) {
    if (this.props.paginated && this.state.currentPage > 1) {
      this.rendition?.prev(n);
      this.setState({ currentPage: this.state.currentPage - n });
    }
  }

  pageNext(n: number = 1) {
    if (this.props.paginated && this.state.currentPage < this.state.pageCount) {
      this.rendition?.next(n);
      this.setState({ currentPage: this.state.currentPage + n });
    }
  }

  jumpToPage(page: number) {
    if (page === 0) {
      return;
    }
    page = isNaN(page) ? 1 : Math.max(Math.min(this.state.pageCount, page), 1);
    const currentPage = this.state.currentPage;
    let step = currentPage < page ? 1 : -1;
    let diff = Math.abs(page - currentPage);
    if (step === 1) {
      this.pageNext(diff);
    } else {
      this.pagePrev(diff);
    }
  }

  keyListener(e: KeyboardEvent) {
    let key = e.keyCode || e.which;

    console.log(e.type)

    // Left/down Key
    if (key === (this.props.rtlVerticalLayout ? 37 : 40)) {
      this.buttonNext()
    }

    // Right/top Key
    if (key === (this.props.rtlVerticalLayout ? 39 : 38)) {
      this.buttonPrev();
    }
  };

  bookCreated = false;
  ePubIframe: HTMLIFrameElement | null = null;
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
      contents: this.state.workInfo.title,
      source: '',
      images: ['logo.png'],
    }, 'logo.png');

    let htmlStrModifiedStyles = this.state.htmlStr!;
    if (this.props.rtlVerticalLayout) {
      htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/margin-left/g, 'margin-top');
    }
    /* else {
      htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/margin-top/g, 'margin-left');
    }*/

    const htmlStrWithCssJs = htmlStrModifiedStyles + `
    <script>
    </script>
    `;

    this.epub.addSection('', htmlStrWithCssJs, true, false);

    let rtlVerticalStyles = `
    html {
      writing-mode: vertical-rl;
      direction: ltr;
    }
    `;

    this.epub.addCSS(`
    @page {
      size: A4;
      margin: 0.5in;
    }

    @page :left {
      margin-right: 1in;
    }

    @page :right {
      margin-left: 1in;
    }

    @media print {
      body {
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        column-gap: unset !important;
        column-width: unset !important;
      }
    }

    html {
      background: ${getComputedStyle(document.body).getPropertyValue('--ion-background-color')};
      /*
      Because different fonts have different line heights with 'line-height: normal,'
      the content size of epubjs iframe changes after the fallback font is swapped with the web font.
      Unfortunately, epubjs can't detect the size change and update the iframe.
      This problem causes the total page count is incorrect.
      Fortunately, we can set the line height based on the same font size as below.
      */
      line-height: 1.2;
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

    /* In-HTML anchor jumps don't update this.state.currentPage.
    Thus, we disable thems. */
    .noteAnchor {
      pointer-events: none;
      text-decoration: inherit;
      color: inherit;
      cursor: auto;
    }

    .doube-line-note, .doube-line-note .t {
      font-size: ${this.props.fontSize * 0.8}px;
    }

    .doube-line-note::before {
      content: "（";
    }

    .doube-line-note::after {
      content: "）";
    }

    .bip-table {
      display: table;
    }

    .bip-table-row {
      display: table-row;
    }

    .bip-table-cell {
      display: table-cell;
      border: 1px solid ${getComputedStyle(document.body).getPropertyValue('--ion-text-color')};
      text-align: center;
    }
  
    ${this.props.rtlVerticalLayout ? rtlVerticalStyles : ''}

    .t, p, div {
      color: ${getComputedStyle(document.body).getPropertyValue('--ion-text-color')};
      font-family: ${getComputedStyle(document.body).getPropertyValue('--ion-font-family')};
      font-size: ${this.props.fontSize}px;
    }
    
    /* Disable this to workaround epubjs page counting problem.*/
    #back, #cbeta-copyright {
      display: ${this.props.showComments ? "block" : "none"};
    }/**/
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
          this.epubcfiFromSelectedString = cfiRange;
          /*
          this.rendition?.annotations.highlight(cfiRange, {}, (e: any) => {
            console.log("highlight clicked", e.target);
          });*/
          //contents.window.getSelection().removeAllRanges();
        });

        this.rendition.on(EVENTS.RENDITION.DISPLAYED, () => {
          this.updatePageInfos();
        });

        this.rendition.on(EVENTS.VIEWS.RENDERED, () => {
          this.updateEPubIframe();
        });

        await this.rendition.display(this.props.paginated ? this.epubcfi : undefined);
        // Navigate to the first work page.
        if (!this.props.paginated) {
          // Skip cover page.
          await this.rendition?.next();
          // Skip TOC page.
          await this.rendition?.next();
          this.updateEPubIframe();
        }
        this.setState({ isLoading: false });

        if (this.hasBookmark) {
          try {
            this.rendition?.annotations.highlight(this.epubcfi);
          } catch (e) {
            console.error(e);
          }
        }

        this.book?.locations.generate(150);
      }
    );
  }

  updateEPubIframe() {
    const iframes = document.getElementsByTagName('iframe');
    if (iframes.length === 1) {
      this.ePubIframe = iframes[0];
      this.ePubIframe.contentDocument?.addEventListener('keyup', this.keyListener.bind(this), false);
      (this.ePubIframe!.contentWindow! as any).loadTwKaiFont = loadTwKaiFont;
      (this.ePubIframe!.contentWindow! as any).loadTwKaiFont();
      /*
      this.ePubIframe.contentWindow?.addEventListener('unload', () => {
        console.log('iframe unloaded!');
        this.ePubIframe?.contentDocument?.removeEventListener('keyup', this.keyListener.bind(this), false);
      });*/
    } else if (iframes.length > 1) {
      alert('Error! This component locates ePub iframe by the only iframe.');
    } else {
      console.error('ePub iframes count is 0.');
    }
  }

  updatePageInfos() {
    const displayed = (this.rendition?.currentLocation() as any).start.displayed;
    this.setState({ currentPage: displayed.page, pageCount: displayed.total });
  }

  getSelectedString() {
    let selectedText = '';
    const sel = this.ePubIframe?.contentDocument?.getSelection();
    if ((sel?.rangeCount || 0) > 0 && sel!.getRangeAt(0).toString().length > 0) {
      selectedText = sel!.toString();
      sel?.removeAllRanges();
    }
    return selectedText;
  }

  getRemainingWorkTextFromSelectedRange() {
    let selection = this.ePubIframe!.contentWindow!.getSelection();
    let remainingWorkText;

    if (selection!.type === 'Range') {
      const back = this.ePubIframe!.contentDocument!.getElementById('back')!;
      let s = selection!.getRangeAt(0);
      // Get a range from selected texts to end of id='body' (start of id='back').
      s.setEnd(back, 0);
      // Get document fragment containing the range.
      let docFragment = s.cloneContents();
      selection?.removeAllRanges();

      // For manipulate content of docFragment laterly.
      let doc = new Document();
      let docHtml = doc.createElement('html')
      doc.appendChild(docHtml);
      docHtml.appendChild(docFragment);

      // Remove texts being not part of speech including line number and note texts in work texts.
      Globals.removeElementsByClassName(doc, 'lb');
      Globals.removeElementsByClassName(doc, 'doube-line-note');
      remainingWorkText = doc.getElementById('body')!.innerText;
    }

    return remainingWorkText;
  }

  getAllTextNodes(root: any) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    return walker;
  }

  searchTextRanges: Array<Range> = [];

  findSearchTextRanges(searchText: string) {
    this.searchTextRanges = [];
    this.showedSearchTextIndex = 0;
    const cbetaHtmlBody = this.ePubIframe!.contentDocument!.getElementById('body');
    const sel = this.ePubIframe!.contentWindow!.getSelection()!;
    const textNodesWalker = this.getAllTextNodes(cbetaHtmlBody);
    let visibleTextNodes: Array<Node> = [];

    let node;
    while ((node = textNodesWalker.nextNode()) != null) {
      if (node.parentElement?.className === 'lb' || node.textContent?.replace(/[\r\n\t ]*/g, '') === '') {
        continue;
      }

      visibleTextNodes.push(node);
    }

    const r = new Range();
    r.setStart(visibleTextNodes[0], 0);
    const lastVisiableTextNode = visibleTextNodes[visibleTextNodes.length - 1] as any;
    r.setEnd(lastVisiableTextNode, lastVisiableTextNode.length);
    sel.removeAllRanges();
    sel.addRange(r);
    const allTexts = sel.toString().replace(/[\n]/g, '');
    sel.removeAllRanges();

    let searchTextIndexes: Array<number> = []

    let startIndex = 0;
    let searchTextIndex = 1;
    do {
      searchTextIndex = allTexts.indexOf(searchText, startIndex);
      if (searchTextIndex === -1) {
        break;
      }
      startIndex = searchTextIndex + searchText.length;
      searchTextIndexes.push(searchTextIndex);
      searchTextIndexes.push(searchTextIndex + searchText.length);
    } while (searchTextIndex < allTexts.length - 1);

    if (searchTextIndexes.length === 0) {
      return;
    }

    let searchTextNodes: Array<any> = [];
    let i = 0;
    searchTextIndex = searchTextIndexes.shift()!;
    for (let n = 0; n < visibleTextNodes.length; n++) {
      const visibleTextNode = visibleTextNodes[n];
      for (let c = 0; c < (visibleTextNode as any).length; c++) {
        if (i === searchTextIndex) {
          searchTextNodes.push({ node: visibleTextNode, offset: c });
          searchTextIndex = searchTextIndexes.shift() || -1;

          if (searchTextIndex === -1) {
            break;
          }
        }
        i++;
      }

      if (searchTextIndex === -1) {
        break;
      }
    }

    for (let i = 0; i < searchTextNodes.length / 2; i += 1) {
      const r = new Range();
      let start = searchTextNodes[i * 2];
      let end = searchTextNodes[i * 2 + 1];
      r.setStart(start.node, start.offset);
      r.setEnd(end.node, end.offset);
      this.searchTextRanges.push(r);
    }
  }

  showedSearchTextIndex = 0;
  searchTextPrev() {
    if (this.showedSearchTextIndex > 0) {
      this.showedSearchTextIndex--;
    }
    this.moveToSearchText(this.showedSearchTextIndex);
  }

  searchTextNext() {
    if (this.showedSearchTextIndex < this.searchTextRanges.length - 1) {
      this.showedSearchTextIndex++;
    }
    this.moveToSearchText(this.showedSearchTextIndex);
  }

  moveToSearchText(index: number) {
    this.epubcfiFromSelectedString = '';
    const sel = this.ePubIframe!.contentWindow!.getSelection()!;
    sel.removeAllRanges();

    setTimeout(() => {
      const range = this.searchTextRanges[index];
      this.ePubIframe!.contentWindow!.focus();
      sel.addRange(range);

      if (this.props.paginated) {
        let timer: any;
        timer = setInterval(() => {
          if (this.epubcfiFromSelectedString !== '') {
            clearInterval(timer);
            this.rendition?.display(this.epubcfiFromSelectedString).then(() => {
            });
          }
        }, 100);
      } else {
        range.startContainer.parentElement?.scrollIntoView();
      }
    }, 100);
  }

  buttonPrev() {
    if (this.state.showSearchTextToast) {
      this.searchTextPrev();
    } else {
      this.pagePrev();
    }
  }

  buttonNext() {
    if (this.state.showSearchTextToast) {
      this.searchTextNext();
    } else {
      this.pageNext();
    }
  }

  findCbetaHtmlLine(node: Node) {
    let parent: HTMLElement | null | undefined = node.parentElement;
    do {
      if (parent?.getAttribute('l')) {
        break;
      }
    } while((parent = parent?.parentElement));
    return parent;
  }

  // There is a max characters per utterance limit on Android Chrome.
  // This max value is obtained by try and error.
  maxCharsPerUtterance = 1000;
  workTexts: Array<string> = [];
  workTextsIndex = 0;
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
          <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}></IonTitle>

          <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
            <IonIcon icon={arrowBack} slot='icon-only' />
          </IonButton>

          <IonButton slot='end' onClick={ev => {
            this.setState({ showJumpPageAlert: true });
          }}>
            <span className='uiFont' style={{ color: 'var(--color)' }}>頁{this.state.currentPage}/{this.state.pageCount}</span>
          </IonButton>

          <IonButton fill="clear" slot='end' onClick={e => {
            const voices = speechSynthesis.getVoices();
            if (voices.length === 0) {
              return;
            }

            switch (this.state.speechState) {
              case SpeechState.UNINITIAL:
                const zhTwVoice = voices.find((voice: SpeechSynthesisVoice) => {
                  return voice.lang.indexOf('zh-TW') > -1 || voice.lang.indexOf('zh_TW') > -1
                })
                if (zhTwVoice !== undefined) {
                  this.speechSynthesisUtterance.voice = zhTwVoice;
                }

                const remainingWorkText = this.getRemainingWorkTextFromSelectedRange();
                const workText = remainingWorkText || this.ePubIframe?.contentDocument?.getElementById('body')?.innerText || '無法取得經文內容';

                this.workTexts = [];
                for (let i = 0; i < Math.ceil(workText.length / this.maxCharsPerUtterance); i++) {
                  this.workTexts.push(workText.substring(i * this.maxCharsPerUtterance, (i + 1) * this.maxCharsPerUtterance));
                }

                this.workTextsIndex = 0;
                this.speechSynthesisUtterance.text = this.workTexts[this.workTextsIndex];
                this.speechSynthesisUtterance.rate = this.props.speechRate;
                // Improve reliability by cancel first.
                speechSynthesis.cancel();
                speechSynthesis.speak(this.speechSynthesisUtterance);
                this.setState({ speechState: SpeechState.SPEAKING });
                break;
              case SpeechState.SPEAKING:
                // Unfortunately, pause() doesn't work on most Chrome browser.
                // Instead, we support stop.
                /*
                speechSynthesis.pause();
                this.setState({speechState: SpeechState.PAUSE});
                */
                speechSynthesis.cancel();
                this.setState({ speechState: SpeechState.UNINITIAL });
                break;
              case SpeechState.PAUSE:
                speechSynthesis.resume();
                this.setState({ speechState: SpeechState.SPEAKING });
                break;
            }
          }}>
            <IonIcon icon={this.state.speechState === SpeechState.SPEAKING ? stopCircle : musicalNotes} slot='icon-only' />
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
                this.setState({ popover: { show: false, event: null } });
                this.props.history.push(`/catalog/work/${this.props.match.params.work}`);
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={home} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>回經目錄</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.props.history.push(`/${this.props.match.params.tab}`);
                this.setState({ popover: { show: false, event: null } });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={home} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>回首頁</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                this.addBookmarkHandler();
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={bookmark} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>新增書籤</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                this.setState({ showSearchTextToast: false, showSearchTextAlert: true });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={search} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>搜尋文字</IonLabel>
              </IonItem>
              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                this.setState({ showSearchAlert: true });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={search} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>搜尋經書</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                const selectedText = this.getSelectedString();
                if (selectedText === '') {
                  this.setState({ showNoSelectedTextAlert: true });
                  return;
                }

                this.props.history.push({
                  pathname: `/dictionary/search/${selectedText}`,
                });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={book} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>查詞典</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                const selectedText = this.getSelectedString();
                if (selectedText === '') {
                  this.setState({ showNoSelectedTextAlert: true });
                  return;
                }

                this.props.history.push({
                  pathname: `/dictionary/searchWord/${selectedText}`,
                });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={book} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>查字典</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                this.ePubIframe?.contentWindow?.print();
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={print} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>列印</IonLabel>
              </IonItem>

              <IonItem button onClick={ev => {
                this.setState({ popover: { show: false, event: null } });
                const sel = this.ePubIframe?.contentDocument?.getSelection()!;
                if ((sel.rangeCount || 0) > 0 && sel.getRangeAt(0).toString().length > 0) {
                  const selectedText = sel!.toString();
                  const range = sel.getRangeAt(0);
                  let startLine = this.findCbetaHtmlLine(range.startContainer)?.getAttribute('l');
                  let endLine = this.findCbetaHtmlLine(range.endContainer)?.getAttribute('l');
                  sel?.removeAllRanges();
                  if (startLine == null || endLine == null) {
                    this.setState({ showsCitationFail: true });
                    return;
                  }
                  const startLineMatches = /0*([1-9]*)([a-z])0*([1-9]*)/.exec(startLine!)!;
                  const startLineModified = `${startLineMatches[1]}${startLineMatches[2]}${startLineMatches[3]}`;
                  const endLineModified = /0*([1-9]*)([a-z])0*([1-9]*)/.exec(endLine!)![3];

                  let lineInfo = `${startLineModified}`;
                  if (startLine !== endLine) {
                    lineInfo += `-${endLineModified}`;
                  }
                  const citation = `《${this.state.workInfo.title}》卷${this.props.match.params.path}：「${selectedText}」(CBETA, ${this.state.workInfo.vol}, no. ${/[^0-9]*(.*)/.exec(this.state.workInfo.work)![1]}, p. ${lineInfo})`;
                  navigator.clipboard && navigator.clipboard.writeText(citation);
                  this.setState({ showsCopyToClipboardSuccess: true });
                } else {
                  this.setState({ showNoSelectedTextAlert: true });
                }
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={shareSocial} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>引用文章</IonLabel>
              </IonItem>

              <IonItem button onClick={ev => {
                let sharedUrl = window.location.href.split('?')[0];
                const selectedText = this.getSelectedString();
                if (selectedText !== '') {
                  sharedUrl += `?bookmark=${this.epubcfiFromSelectedString}`;
                }

                this.props.dispatch({
                  type: "TMP_SET_KEY_VAL",
                  key: 'shareTextModal',
                  val: {
                    show: true,
                    text: decodeURIComponent(sharedUrl),
                  },
                });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={shareSocial} slot='start' />
                <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>分享此頁</IonLabel>
              </IonItem>
            </IonList>
          </IonPopover>
        </IonToolbar>
      </IonHeader>
    );

    const fabButtonOpacity = 0.2;
    let navButtons = (<>
      <IonFab vertical='center' horizontal='start' slot='fixed'>
        <IonFabButton style={{ opacity: fabButtonOpacity }} onClick={e => this.props.rtlVerticalLayout ? this.buttonNext() : this.buttonPrev()}
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
        <IonFabButton style={{ opacity: fabButtonOpacity }} onClick={e => this.props.rtlVerticalLayout ? this.buttonPrev() : this.buttonNext()} onTouchStart={e => {
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
          {this.props.paginated || this.state.showSearchTextToast ? navButtons : <></>}

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

          <IonAlert
            cssClass='uiFont'
            isOpen={this.state.showJumpPageAlert}
            header={'跳頁'}
            subHeader={`請輸入頁碼(1 - ${this.state.pageCount})`}
            inputs={[
              {
                name: 'name0',
                type: 'number',
                min: 1,
                max: this.state.pageCount,
                value: this.state.currentPage,
              },
            ]}
            buttons={[
              {
                text: '取消',
                role: 'cancel',
                cssClass: 'secondary uiFont',
                handler: () => this.setState({ showJumpPageAlert: false }),
              },
              {
                text: '確定',
                cssClass: 'primary uiFont',
                handler: (value) => {
                  this.setState({ showJumpPageAlert: false });
                  this.jumpToPage(value.name0);
                },
              }
            ]}
          />

          <SearchAlert
            {...{
              showSearchAlert: (this.state as any).showSearchAlert,
              finish: () => { this.setState({ showSearchAlert: false }) }, ...this.props
            }}
          />

          <IonAlert
            cssClass='uiFont'
            isOpen={this.state.showNoSelectedTextAlert}
            backdropDismiss={false}
            header='失敗'
            message='請確認是否已選擇一段文字，然後再執行所選的功能!'
            buttons={[
              {
                text: '確定',
                cssClass: 'primary uiFont',
                handler: (value) => {
                  this.setState({
                    showNoSelectedTextAlert: false,
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

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showsCopyToClipboardSuccess}
            onDidDismiss={() => this.setState({ showsCopyToClipboardSuccess: false })}
            message="已複製到剪貼簿！"
            duration={2000}
          />

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showsCitationFail}
            onDidDismiss={() => this.setState({ showsCitationFail: false })}
            message="所選文字無法引用！"
            duration={2000}
          />

          <IonAlert
            cssClass='uiFont'
            isOpen={this.state.showSearchTextAlert}
            header={'搜尋文字'}
            subHeader='按下搜尋後，左右方向鈕變為搜尋文字方向鈕。按下方通知UI關閉鈕，離開搜尋文字模式。'
            inputs={[
              {
                name: 'name0',
                type: 'search',
                placeholder: '例:如是我聞'
              },
            ]}
            buttons={[
              {
                text: '取消',
                role: 'cancel',
                cssClass: 'secondary uiFont',
                handler: () => this.setState({ showSearchTextAlert: false }),
              },
              {
                text: '搜尋',
                cssClass: 'primary uiFont',
                handler: (value) => {
                  if (value.name0 === '') {
                    this.setState({ showSearchTextAlert: false });
                    return;
                  }

                  this.findSearchTextRanges(value.name0);
                  if (this.searchTextRanges.length === 0) {
                    this.setState({ showSearchTextAlert: false, showToast: true, toastMessage: `找不到文字：${value.name0}` });
                  } else {
                    this.setState({ showSearchTextAlert: false, showSearchTextToast: true, searchText: value.name0 });
                    this.searchTextPrev();
                  }
                },
              },
            ]}
          />

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showSearchTextToast}
            onDidDismiss={() => this.setState({ showSearchTextToast: false })}
            message={`搜尋：${this.state.searchText}`}
            buttons={[
              {
                text: '關閉',
                role: 'cancel',
                handler: () => this.setState({ showSearchTextToast: false })
              }
            ]}
          />

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showToast}
            onDidDismiss={() => this.setState({ showToast: false })}
            message={this.state.toastMessage}
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
    speechRate: state.settings.speechRate,
  }
};

const EPubViewPage = withIonLifeCycle(_EPubViewPage);

export default connect(
  mapStateToProps,
)(EPubViewPage);
