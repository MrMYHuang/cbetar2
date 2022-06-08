import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, withIonLifeCycle, IonIcon, IonAlert, IonPopover, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonToast, IonLoading, isPlatform, IonProgressBar, IonFabList } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import queryString from 'query-string';
import './EPubViewPage.css';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search, ellipsisHorizontal, ellipsisVertical, arrowForward, musicalNotes, stopCircle, book, shareSocial, print, refreshCircle, copy, arrowUp, arrowDown, musicalNote, link, chevronUpOutline, playSkipForward, playSkipBack, expand } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { Work } from '../models/Work';
import SearchAlert from '../components/SearchAlert';
import ePub, { Book, Rendition, EVENTS } from 'epubjs-myh';
import * as nodepub from 'nodepub';
import { TmpSettings } from '../models/TmpSettings';
import { clearTimeout } from 'timers';
import fetchJuan from '../fetchJuan';
import { CbetaDbMode } from '../models/Settings';
import IndexedDbFuncs from '../IndexedDbFuncs';
import VirtualHtml from '../models/VirtualHtml';

// Load TW-Kai font in iframe.
async function loadTwKaiFonts(this: Window) {
  Globals.loadTwKaiFonts(undefined, this);
}

function addCbetaLineBreaks(this: any) {
  this.document.querySelectorAll('.pre .lb').forEach((el: HTMLElement) => {
    const newBr = this.document.createElement('br');
    el.before(newBr);
  });
}

function addSwpiedEvents(this: Window) {
  require('swiped-events-myh/src/add')(this.window, this.document);
}

let clicksInInterval = 0;
function doubleClicksEvents(callback: Function) {
  clicksInInterval += 1;
  setTimeout(() => {
    clicksInInterval = 0;
  }, 250);

  if (clicksInInterval >= 2) {
    clicksInInterval = 0;
    callback();
  }
}

interface VisibleChar {
  node: Node;
  offset: number;
  page: number;
  char: string;
}

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  fontSize: number;
  scrollbarSize: number;
  settings: any;
  showComments: boolean;
  paginated: boolean;
  rtlVerticalLayout: boolean;
  useFontKai: boolean;
  voiceURI: string;
  speechRate: number;
  tmpSettings: TmpSettings;
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
  showSearchTextAlert: boolean;
  showToast: boolean;
  toastMessage: string;
  showSearchAlert: boolean;
  popover: any;
  lookupDictPopover: any;
  canTextToSpeech: boolean;
  speechState: SpeechState;
  isSpeechRepeatMode: boolean;
  showSpeechRepeatStart: boolean;
  showSpeechRepeatEnd: boolean;
}

class _EPubViewPage extends React.Component<PageProps, State> {
  htmlFile: string;
  htmlTitle: string;
  book: Book | null;
  rendition: Rendition | null;
  epub: any;
  displayed: any;
  cfiRange: string;
  speechSynthesisUtterance: SpeechSynthesisUtterance | null;

  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: false,
      fetchError: false,
      workInfo: ({} as Work),
      htmlStr: null,
      currentPage: 1,
      pageCount: 1,
      showJumpPageAlert: false,
      showNoSelectedTextAlert: false,
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
      canTextToSpeech: typeof SpeechSynthesisUtterance !== 'undefined',
      speechState: SpeechState.UNINITIAL,
      isSpeechRepeatMode: false,
      showSpeechRepeatStart: false,
      showSpeechRepeatEnd: false,
    }
    this.htmlFile = '';
    this.htmlTitle = '';
    this.book = null;
    this.rendition = null;
    this.cfiRange = '';
    this.speechSynthesisUtterance = null;
    if (this.state.canTextToSpeech) {
      this.speechSynthesisUtterance = new SpeechSynthesisUtterance();
      this.speechSynthesisUtterance.onend = async (ev: SpeechSynthesisEvent) => {
        speechSynthesis.cancel();

        // Stop button pressed.
        if (this.state.speechState === SpeechState.UNINITIAL) {
          return;
        }

        const hasNextTexts1 = this.workTextsIndex < this.workTexts.length - 1;
        const hasNextTexts2 = !this.state.isSpeechRepeatMode && this.props.paginated && this.state.currentPage < this.state.pageCount;
        let texts = '';
        if (hasNextTexts1) {
          this.workTextsIndex += 1;
        } else if (hasNextTexts2) {
          await this.pageNext();
          this.findTextsInPageAndChunking();
        } else {
          this.setState({ speechState: SpeechState.UNINITIAL }, () => {
            console.log(`Stop work text to speech.`);
            if (this.state.isSpeechRepeatMode) {
              this.playText2Speech();
            }
          });
          return;
        }
        texts = this.workTexts[this.workTextsIndex];
        this.speechSynthesisUtterance!.text = texts;
        speechSynthesis.speak(this.speechSynthesisUtterance!);
        console.log(`Play work text to speech part / page: ${hasNextTexts1 ? this.workTextsIndex : this.state.currentPage}`);
      };
    }
    document.addEventListener("keydown", this.keyListener.bind(this), false);
    document.onfullscreenchange = () => {
      if (!document.fullscreenElement) {
        this.props.dispatch({
          type: "TMP_SET_KEY_VAL",
          key: 'fullScreen',
          val: false,
        });
      }
    };
  }

  async loadEpubCoverToMemFs() {
    let logoArray: Uint8Array;
    if (this.props.settings.cbetaOfflineDbMode !== CbetaDbMode.OfflineIndexedDb) {
      logoArray = new Uint8Array(JSON.parse(localStorage.getItem('logo.png') || '[]'));
      if (logoArray.length === 0) {
        // Download book logo.
        const res = await Globals.axiosInstance.get(`${window.location.origin}/${Globals.pwaUrl}/assets/icon/icon.png`, {
          responseType: 'arraybuffer',
        });
        logoArray = new Uint8Array(res.data);
        let logoStr = JSON.stringify(Array.from(logoArray));
        localStorage.setItem('logo.png', logoStr);
      }
    } else {
      logoArray = await IndexedDbFuncs.getFile<Uint8Array>(`/${Globals.cbetar2AssetDir}/icon.png`);
    }
    let fs = require('fs');
    fs.writeFileSync('logo.png', logoArray);
  }

  get workJuanId() {
    return `${this.props.match.params.work}/${this.props.match.params.path}`;
  }

  oldWorkJuanId = '';
  uuidStr = '';
  epubcfiFromUrl = '';
  epubcfiFromUrlUpdated = false;
  ionViewWillEnter() {
    if (this.fetchNewData) {
      this.bookSettingsChanged = false;
      this.fetchNewData = false;
      this.fetchData().then(() => {
        this.html2Epub();
      });
    } else if (this.bookSettingsChanged) {
      this.bookSettingsChanged = false;
      this.html2Epub();
    } else if (this.bookmarkEpubcfiUpdated) {
      this.bookmarkEpubcfiUpdated = false;
      this.moveToEpubcfi(this.bookmarkEpubcfi).then(() => {
        return this.updatePageInfos();
      });
    } else {
      if (this.savedPageIndex !== this.state.currentPage) {
        // Restore the saved page index.
        this.jumpToPage(this.savedPageIndex);
        return true;
      }
    }
  }

  bookSettingsChanged = true;
  fetchNewData = true;
  componentDidUpdate(prevProps: PageProps) {
    const queryParams = queryString.parse(this.props.location.search) as any;
    this.htmlFile = queryParams.file;
    this.htmlTitle = queryParams.title;
    if (this.epubcfiFromUrl !== (queryParams.bookmark || '')) {
      this.epubcfiFromUrlUpdated = true;
      this.epubcfiFromUrl = queryParams.bookmark || '';
    }
    const state = this.props.location.state as any;
    this.uuidStr = state ? state.uuid : '';

    const newBookmarkEpubcfi = this.props.bookmarks.find((b) => b.uuid === this.uuidStr)?.epubcfi || '';
    if (this.uuidStr !== '' && newBookmarkEpubcfi !== this.bookmarkEpubcfi) {
      this.bookmarkEpubcfi = newBookmarkEpubcfi;
      this.pageStartEpubcfies = [];
      this.isPageSearched = [];
      this.bookmarkEpubcfiUpdated = true;
    }

    if (this.props.tmpSettings.fullScreen !== prevProps.tmpSettings.fullScreen) {
      let waitFullscreenSwitching = new Promise<void>((ok) => { ok(); });
      if (!isPlatform('ios')) {
        if (this.props.tmpSettings.fullScreen) {
          try {
            waitFullscreenSwitching = document.documentElement.requestFullscreen();
          } catch (error) {
            console.error(error);
          }
        } else {
          waitFullscreenSwitching = document.exitFullscreen();
        }
      }

      this.savedPageIndex = this.state.currentPage;
      waitFullscreenSwitching.then(() => {
        this.html2Epub();
      });
    }
    //console.log( 'view will enter' );
    if (this.oldWorkJuanId !== this.workJuanId) {
      this.oldWorkJuanId = this.workJuanId;
      this.savedPageIndex = 1;
      this.pageStartEpubcfies = [];
      this.fetchNewData = true;
      // Reduce the redundant book update.
      this.bookSettingsChanged = true;
    }

    this.bookSettingsChanged = this.bookSettingsChanged || [
      'paginated',
      'rtlVerticalLayout',
      'scrollbarSize',
      'useFontKai',
      'fontSize',
      'uiFontSize',
      'showComments',
    ].some((v) => this.props.settings[v] !== prevProps.settings[v]);
  }

  ionViewDidEnter() {
    this.ionViewLeave = false;
  }

  savedPageIndex = 1;
  ionViewLeave = false;
  ionViewWillLeave() {
    this.ionViewLeave = true;
    this.savedPageIndex = this.state.currentPage;
    this.setState({ currentPage: 1, showSearchTextToast: false });
    this.resetTextToSpeech();
  }

  resetTextToSpeech() {
    if (this.state.canTextToSpeech) {
      speechSynthesis.cancel();
    }
    this.setState({ speechState: SpeechState.UNINITIAL });
  }

  destroyBook() {
    this.resetTextToSpeech();
    this.book?.destroy();
    this.book = null;
    this.isPageSearched = [];
  }

  get fileName() {
    return Globals.getFileName(
      this.props.match.params.work,
      this.props.match.params.path
    );
  }

  async fetchData() {
    return new Promise<boolean>(async (ok, fail) => {
      this.setState({ isLoading: true });
      try {
        const res = await fetchJuan(
          this.props.match.params.work,
          this.props.match.params.path,
          this.htmlFile,
          false,
          this.props.settings.cbetaOfflineDbMode,
        );

        await this.loadEpubCoverToMemFs();

        // isLoading shall consider the epub.js loading time, thus disable it here.
        this.setState({ /*isLoading: false, */fetchError: false, workInfo: res.workInfo, htmlStr: res.htmlStr }, () => {
          ok(true);
        });
      } catch (e) {
        this.setState({ isLoading: false, fetchError: true });
        console.error(`Not found: work ${this.props.match.params.work}, juan ${this.props.match.params.path}`);
        console.error(e);
        console.error(new Error().stack);
        fail(e);
      }
    });
  }

  epubcfiFromSelectedString = '';
  addBookmarkHandler() {
    const selectedText = this.selectedString;
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
      bookmark: {
        type: this.htmlFile ? BookmarkType.HTML : BookmarkType.JUAN,
        uuid: uuidStr,
        selectedText: selectedText,
        epubcfi: this.epubcfiFromSelectedString,
        fileName: this.props.settings.cbetaOfflineDbMode !== CbetaDbMode.Online ? null : this.htmlFile || `${this.props.match.params.work}_juan${this.props.match.params.path}.html`,
        work: Object.assign(this.state.workInfo, {
          title: this.htmlFile ? this.htmlTitle : this.state.workInfo.title,
          juan: this.props.match.params.path,
        }
        ),
      } as Bookmark,
    });
    this.setState({ showToast: true, toastMessage: '書籤新增成功！' });
    return;
  }

  bookmarkEpubcfi = '';
  bookmarkEpubcfiUpdated = false;
  get bookmark() {
    if (this.props.bookmarks.length == null) {
      return null;
    }

    return this.props.bookmarks.find(
      (e) => e.type === BookmarkType.JUAN && e.uuid === this.uuidStr);
  }

  get hasBookmark() {
    return this.epubcfiFromUrl !== '' || this.bookmark != null;
  }

  epubcfiFirstPage = 'epubcfi(/6/6[s1]!/4/4/2/6[body]/6,/1:0,/1:1)';
  get epubcfi() {
    const useUrlEpubcfi = this.epubcfiFromUrlUpdated && this.rendition?.book.spine.get(this.epubcfiFromUrl);
    const useBookmarkEpubcfi = this.bookmarkEpubcfiUpdated && this.bookmark;
    const useSavedPageStartEpubcfi = this.pageStartEpubcfies[this.savedPageIndex - 1];

    if (useSavedPageStartEpubcfi) {
      return useSavedPageStartEpubcfi;
    } else if (useUrlEpubcfi) {
      this.epubcfiFromUrlUpdated = false;
      return this.epubcfiFromUrl;
    } else if (useBookmarkEpubcfi) {
      this.bookmarkEpubcfiUpdated = false;
      return this.bookmark!.epubcfi;
    } else {
      return this.epubcfiFirstPage;
    }
  }

  pagePrev(n: number = 1) {
    const newPage = this.state.currentPage - n;
    if (this.props.paginated && this.state.currentPage > 1) {
      this.rendition?.prev(n);
      return new Promise<void>((ok) => {
        this.setState({ currentPage: newPage }, () => {
          this.findTextsInPage(newPage);
          ok();
        });
      });
    }
  }

  pageNext(n: number = 1) {
    const newPage = this.state.currentPage + n;
    if (this.props.paginated && this.state.currentPage < this.state.pageCount) {
      this.rendition?.next(n);
      return new Promise<void>((ok) => {
        this.setState({ currentPage: newPage }, () => {
          this.findTextsInPage(newPage);
          ok();
        });
      });
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
      return this.pageNext(diff);
    } else {
      return this.pagePrev(diff);
    }
  }

  keyListener(e: KeyboardEvent) {
    if (this.ionViewLeave) {
      return;
    }

    //console.log(e.type);

    // Left/down Key
    if (e.code === (this.props.rtlVerticalLayout ? 'ArrowLeft' : 'ArrowDown')) {
      this.buttonNext();
      return;
    }

    // Right/top Key
    if (e.code === (this.props.rtlVerticalLayout ? 'ArrowRight' : 'ArrowTop')) {
      this.buttonPrev();
      return;
    }

    if (e.code === 'F3' || (e.ctrlKey && e.key.toLowerCase() === 'f')) {
      e.preventDefault();
      this.setState({ showSearchTextToast: false, showSearchTextAlert: true });
      return;
    }

    if (e.altKey && e.code === 'Enter') {
      this.props.dispatch({
        type: "TMP_SET_KEY_VAL",
        key: 'fullScreen',
        val: !this.props.tmpSettings.fullScreen,
      });
    }
  };

  ePubIframe: HTMLIFrameElement | null = null;
  async html2Epub() {
    //this.destroyBook();
    this.setState({ isLoading: true });
    (this.rendition as any)?.manager?.stage?.destroy();
    this.epub = nodepub.document({
      id: '123-123456789',
      cover: './logo.png',
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
    });

    let htmlStrModifiedStyles = this.state.htmlStr!;
    if (this.props.rtlVerticalLayout) {
      htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/(margin|border)-left/g, '$1-temp');
      htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/(margin|border)-bottom/g, '$1-left');
      htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/(margin|border)-right/g, '$1-bottom');
      htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/(margin|border)-top/g, '$1-right');
      htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/(margin|border)-temp/g, '$1-top');
      // The custome tag 'mulu' causes text nodes have abnormal x/y values by getBoundingClientRect.
      // It causes findTextsInPage abnormal!
      // Rewrite it to p tag.
      htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/mulu/g, 'p');
    }
    /* else {
      htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/margin-top/g, 'margin-left');
    }*/

    //htmlStrModifiedStyles = htmlStrModifiedStyles.replace(/<span class="lb">[^<]*<\/span>/g, 'ㄇ');

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

    /* For double side printing for book bundling. */
    @page :left {
      margin-right: 1in;
    }

    @page :right {
      margin-left: 1in;
    }

    @media print {
      body {
        color: ${getComputedStyle(document.body).getPropertyValue('--print-text-color')} !important;
        background: ${getComputedStyle(document.body).getPropertyValue('--print-background')} !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        column-gap: unset !important;
        column-width: unset !important;
      }
    }

    html {
      /*
      Because different fonts have different line heights with 'line-height: normal,'
      the content size of epubjs iframe changes after the fallback font is swapped with the web font.
      Unfortunately, epubjs can't detect the size change and update the iframe.
      This problem causes the total page count is incorrect.
      Fortunately, we can set the line height based on the same font size as below.
      */
      line-height: 1.2;
      -webkit-text-size-adjust: none;
      text-size-adjust: none;
    }

    body {
      color: ${getComputedStyle(document.body).getPropertyValue('--ion-text-color')};
      background: ${getComputedStyle(document.body).getPropertyValue('--ion-background-color')};
      /* Disable browser's swipe to forward / backward page navigation. */
      overscroll-behavior-x: none;
    }

    @font-face {
        font-family: 'Times';
        src: local('Times New Roman');
        unicode-range: U+0-007F;
    }

    /* Not work on Chrome 99. */
    /* Workaround parenthesis orientation problem of TW-Kai-98_1 on iOS Safari.
    @font-face {
        font-family: 'HeitiScoped';
        src: local('Heiti TC');
        unicode-range: U+3008-301B, U+FF01-FF60;
    }
    */

    .lb {
      display: none
    }

    /* In-HTML anchor jumps don't update this.state.currentPage.
    Thus, we disable them. */
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
      font-family: ${getComputedStyle(document.body).getPropertyValue('--ion-font-family')};
      font-size: ${this.props.fontSize}px;
    }

    .bold {
      font-weight: 700;
    }
    
    #back, #cbeta-copyright {
      display: ${this.props.showComments ? "block" : "none"};
    }
    `);

    try {
      await this.epub.writeEPUB('.', 'temp');
      let fs = require('fs');
      let tempEpubBuffer = fs.readFileSync('temp.epub');
      this.book = ePub(tempEpubBuffer.buffer, {
        openAs: 'binary',
      });

      this.rendition = this.book.renderTo('cbetarEPubView', {
        method: process.env.NODE_ENV === 'production' ? 'srcFromSw' : 'srcdoc',
        sendToServiceWoker: ({ html }: VirtualHtml) => {
          const messageChannel = new MessageChannel();

          // The following creates a virtual same origin HTML file with a random pathname, which avoiding multiple requests incorrectly use the same name.
          // The virtual HTML file is sent to the service worker.
          const pathname = "/_" + Math.floor(Math.random() * 1e9);

          return new Promise<string>(ok => {
            // Wait VIRTUAL_HTML.
            messageChannel.port1.onmessage = (event) => {
              if (event.data.type === 'VIRTUAL_HTML' && event.data.pathname === pathname) {
                ok(pathname);
              }
            }

            // Send VIRTUAL_HTML.
            Globals.getServiceWorkerReg().then(serviceWorkerReg => {
              serviceWorkerReg.active?.postMessage({
                type: 'VIRTUAL_HTML',
                pathname,
                html,
              }, [messageChannel.port2]);
            });
          });
        },
        width: "100%", height: "100%",
        spread: 'none',
        flow: this.props.paginated ? 'paginated' : 'scrolled',
        scrollbarWidth: Globals.scrollbarSizeIdToValue(this.props.scrollbarSize),
        defaultDirection: this.props.rtlVerticalLayout ? 'rtl' : 'ltr',
        // Improve scrolling performance in scrolled mode by
        // avoiding too many EVENTS.MANAGERS.SCROLLED events to call Rendition.reportLocation.
        // Set a large enough timeout to get good performance and small enough to make user interactions well with updated reportLocation!
        afterScrolledTimeout: 500,
      });
      //this.rendition.on("keydown", this.keyListener.bind(this));

      this.rendition.on("selected", (cfiRange: any, contents: any) => {
        this.epubcfiFromSelectedString = cfiRange;
        const selectedStringTemp = this.setSelectedString();
        const selectedRangeTemp = this.setSelectedRange();

        if (selectedStringTemp === '') {
          this.clearSelectedStringTimer = setTimeout(() => {
            this.selectedString = selectedStringTemp;
            this.selectedRange = selectedRangeTemp;
          }, 500);
        } else {
          this.selectedString = selectedStringTemp;
          this.selectedRange = selectedRangeTemp;
        }
        /*
        this.rendition?.annotations.highlight(cfiRange, {}, (e: any) => {
          console.log("highlight clicked", e.target);
        });*/
        //contents.window.getSelection().removeAllRanges();
      });

      this.rendition.on(EVENTS.RENDITION.DISPLAYED, () => {
        //console.log(`EVENTS.RENDITION.DISPLAYED`);
        if (this.ionViewLeave) {
          // Workaround a bug on Android that after switching to dictionary search page and tapping the search input, then switching back, then this ePub view renders blank page.
          this.fetchNewData = true;
          return;
        }

        this.updatePageInfos();
      });

      this.rendition.on(EVENTS.VIEWS.RENDERED, () => {
        //console.log(`EVENTS.VIEWS.RENDERED`);
        this.updateEPubIframe();
      });

      try {
        // Make his.rendition?.book.spine ready.
        await this.rendition.display();

        // For !paginated.
        const pagestoSkipCoverToc = 2;
        // Jump to epubcfi or the content pages.

        if (this.props.paginated) {
          await this.moveToEpubcfi(this.epubcfi).then(() => {
            return this.updatePageInfos();
          }).then(() => {
            this.updateEPubIframe();
            this.findTextsInPage(this.state.currentPage);
          });
        } else {
          await (this.rendition as any)._display(pagestoSkipCoverToc);
        }
      } catch (error) {
        console.error(error);
      }

      this.book?.locations.generate(150);
    } catch (e) {
      console.log(e);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  updateEPubIframe() {
    const iframes = document.getElementsByTagName('iframe');
    if (iframes.length === 1) {
      this.ePubIframe = iframes[0];
      const ePubIframeWindow = this.ePubIframe!.contentWindow! as any;
      // Avoid multiple initializations.
      if (ePubIframeWindow.isInit) {
        console.log('Warning! Redundant call of updateEPubIframe. ePubIframe is initialized before.');
        return;
      }
      this.ePubIframe.contentDocument?.addEventListener('keydown', this.keyListener.bind(this), false);
      const ePubIframeWindow2 = ePubIframeWindow as Window;
      if (isPlatform('android')) {
        ePubIframeWindow.window.oncontextmenu = Globals.disableAndroidChromeCallout;
      } else if (isPlatform('ios')) {
        (ePubIframeWindow as Window).document.ontouchend = Globals.disableIosSafariCallout.bind(ePubIframeWindow);
      }
      if (this.props.useFontKai && ePubIframeWindow.loadTwKaiFonts == null) {
        ePubIframeWindow.loadTwKaiFonts = loadTwKaiFonts;
        ePubIframeWindow.loadTwKaiFonts();
      }
      ePubIframeWindow.addCbetaLineBreaks = addCbetaLineBreaks;
      ePubIframeWindow.addCbetaLineBreaks();
      ePubIframeWindow.addSwpiedEvents = addSwpiedEvents;
      ePubIframeWindow.addSwpiedEvents();
      ePubIframeWindow.document.addEventListener('swiped', (e: any) => {
        // Cancel double click event after a swiped event.
        clicksInInterval = 0;

        if (!this.props.paginated) {
          return;
        }

        if (this.props.rtlVerticalLayout) {
          switch (e.detail.dir) {
            case 'left':
              this.pagePrev();
              break;
            case 'right':
              this.pageNext();
              break;
          }
        } else {
          switch (e.detail.dir) {
            case 'down':
              this.pagePrev();
              break;
            case 'up':
              this.pageNext();
              break;
          }
        }
      });
      ePubIframeWindow2.document.onpointerdown = () => {
        this.doubleClicksToggleFullScreen();
      }
      this.findVisibleTexts();
      ePubIframeWindow.isInit = true;

      /*
      this.ePubIframe.contentWindow?.addEventListener('unload', () => {
        console.log('iframe unloaded!');
        this.ePubIframe?.contentDocument?.removeEventListener('keydown', this.keyListener.bind(this), false);
      });*/
    } else if (iframes.length > 1) {
      alert('Error! This component locates ePub iframe by the only iframe.');
    } else {
      console.error('ePub iframes count is 0.');
    }
  }

  updatePageInfos() {
    return new Promise<void>((ok) => {
      const displayed = (this.rendition?.currentLocation() as any).start.displayed;
      this.setState({ currentPage: displayed.page, pageCount: displayed.total }, () => {
        ok();
      });
    });
    //console.log(`displayed ${displayed.page} / ${displayed.total}`);
  }

  selectedString = '';
  clearSelectedStringTimer: any;
  setSelectedString() {
    let selectedText = '';
    const sel = this.ePubIframe?.contentDocument?.getSelection();
    if ((sel?.rangeCount || 0) > 0 && sel!.getRangeAt(0).toString().length > 0) {
      selectedText = sel!.toString();
    }
    return selectedText;
  }

  selectedRange: Range | undefined;
  setSelectedRange() {
    return this.ePubIframe?.contentDocument?.getSelection()?.getRangeAt(0);
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

  visibleCharToRange(index: number) {
    const visibleChar = this.visibleChars[index];
    const r = new Range();
    r.setStart(visibleChar.node, visibleChar.offset);
    r.setEnd(visibleChar.node, visibleChar.offset + 1);
    return r;
  }

  rectBinDirSize(rect: DOMRect) {
    if (this.props.rtlVerticalLayout) {
      return rect.y;
    } else {
      return rect.x;
    }
  }

  infiniteLoopMsg = 'App 異常，部分功能無法使用，請回報造成異常的經文。';
  findBinBoundaryVisibleCharIndex(binBoundary: number, leftSearchIndex: number, rightSearchIndex: number): number {
    const checkpointIndex = leftSearchIndex + Math.floor((rightSearchIndex - leftSearchIndex) / 2);
    if (checkpointIndex === 0) {
      return 0;
    } else if (checkpointIndex === this.visibleChars.length - 1) {
      return this.visibleChars.length - 1;
    }

    const checkpointRange0 = this.visibleCharToRange(checkpointIndex);
    const checkpointRange1 = this.visibleCharToRange(checkpointIndex + 1);
    const rect0 = checkpointRange0.getBoundingClientRect();
    const rect1 = checkpointRange1.getBoundingClientRect();
    let rect0BinDirSize = this.rectBinDirSize(rect0) - this.ePubIframeOffset;
    let rect1BinDirSize = this.rectBinDirSize(rect1) - this.ePubIframeOffset;
    // Find the classification point.
    if (rect0BinDirSize < binBoundary && binBoundary <= rect1BinDirSize) {
      return checkpointIndex;
    } else if (rect0BinDirSize < binBoundary && binBoundary > rect1BinDirSize) {
      // Avoid infinite loops.
      if (checkpointIndex + 1 === leftSearchIndex) {
        console.error(`Infinite loop detected at ${checkpointIndex}!`);
        this.setState({ showToast: true, toastMessage: this.infiniteLoopMsg });
        return -1;
      }
      return this.findBinBoundaryVisibleCharIndex(binBoundary, checkpointIndex + 1, rightSearchIndex);
    } else if (rect0BinDirSize >= binBoundary && binBoundary <= rect1BinDirSize) {
      // Avoid infinite loops.
      if (checkpointIndex === rightSearchIndex) {
        console.error(`Infinite loop detected at ${checkpointIndex}!`);
        this.setState({ showToast: true, toastMessage: this.infiniteLoopMsg });
        return -1;
      }
      return this.findBinBoundaryVisibleCharIndex(binBoundary, leftSearchIndex, checkpointIndex);
    } else {
      console.error('Unreasonable case!');
      return -1;
    }
  }

  pageWidth = 0;
  pagesWidth = 0;
  pageStartEpubcfies: string[] = [];
  findTextsInPage(n: number) {
    const timeStart = new Date();
    // Zero-based index n.
    const nZ = n - 1;
    if (!this.isPageSearched[nZ]) {
      const pageStartOffset = this.pageWidth * (n - 1);
      const pageEndOffset = this.pageWidth * n;
      let pageStartCharIndex = 0;
      if (n !== 1) {
        // Reuse the searched boundary if available.
        if (this.isPageSearched[nZ - 1]) {
          pageStartCharIndex = (this.visibleChars.length - 1) - this.visibleChars.slice().reverse().findIndex((vc) => vc.page === (n - 1)) + 1;
        } else {
          pageStartCharIndex = this.findBinBoundaryVisibleCharIndex(pageStartOffset, 0, this.visibleChars.length - 1) + 1;
        }
      }
      if (pageStartCharIndex >= this.visibleChars.length) {
        console.log('No visible text anymore.');
        return '';
      }
      this.pageStartEpubcfies[nZ] = this.rangeToEpubcfi(this.visibleCharToRange(pageStartCharIndex));

      let pageEndCharSearchRangeEnd = this.visibleChars.length - 1;
      let pageEndCharIndex = this.visibleChars.length - 1;
      if (n !== this.state.pageCount) {
        // Reuse the searched boundary if available.
        if (this.isPageSearched[nZ + 1]) {
          pageEndCharIndex = this.visibleChars.findIndex((vc) => vc.page === (n + 1)) - 1;
        } else {
          pageEndCharIndex = this.findBinBoundaryVisibleCharIndex(pageEndOffset, pageStartCharIndex, pageEndCharSearchRangeEnd);
        }
      }
      for (let i = pageStartCharIndex; i <= pageEndCharIndex; i++) {
        this.visibleChars[i].page = n;
      }
      this.isPageSearched[nZ] = true;
    }
    const texts = this.visibleChars.filter((vc) => vc.page === n).map((vc) => vc.char).join('');
    const timeEnd = new Date();
    const timeDiff = timeEnd.getTime() - timeStart.getTime();
    console.log(`findTextsInPage spends: ${timeDiff / 1e3}s`);
    return texts;
  }

  searchTextRanges: Array<Range> = [];
  visibleTextNodes: Array<Node> = [];
  visibleChars: Array<VisibleChar> = [];
  isPageSearched: Array<boolean> = [];
  allTexts = '';
  ePubIframeOffset = 0;

  findVisibleTexts() {
    const cbetaHtmlBody = this.ePubIframe!.contentDocument!.getElementById('body');
    if (!cbetaHtmlBody) {
      return;
    }

    const textNodesWalker = this.getAllTextNodes(cbetaHtmlBody);
    this.visibleTextNodes = [];
    this.visibleChars = [];
    this.isPageSearched = [];
    let node: Node | null;

    while ((node = textNodesWalker.nextNode()) != null) {
      let node2 = node!;
      if (['t', 'pc', 'gaijiAnchor'].reduce((prev, curr) => prev && curr !== node2.parentElement?.className, true)) {
        continue;
      }

      this.visibleTextNodes.push(node);
    }

    this.allTexts = this.visibleTextNodes.map((n) => n.textContent).join('');

    // Convert visibleTextNodes to visibleChars.
    let i = 0;
    for (let n = 0; n < this.visibleTextNodes.length; n++) {
      const visibleTextNode = this.visibleTextNodes[n];
      for (let c = 0; c < (visibleTextNode as any).length; c++) {
        this.visibleChars.push({ node: visibleTextNode, offset: c, page: 0, char: this.allTexts[i] });
        i++;
      }
    }
    const epubContainer = document.querySelector('.epub-container')!;
    this.pageWidth = this.props.rtlVerticalLayout ? epubContainer.clientHeight : epubContainer.clientWidth;
    this.pagesWidth = this.pageWidth * this.state.pageCount;
    this.isPageSearched = new Array(this.state.pageCount);
    for (let i = 0; i < this.isPageSearched.length; i++) {
      this.isPageSearched[i] = false;
    }
    const rect0 = this.visibleCharToRange(0).getBoundingClientRect();
    this.ePubIframeOffset = this.props.rtlVerticalLayout ? rect0.y : rect0.x;
  }

  findSearchTextRanges(searchText: string) {
    this.searchTextRanges = [];
    this.showedSearchTextIndex = 0;

    // Search all keywords in allTexts and save their start and end indexes in searchTextIndexes;
    let searchTextIndexes: Array<number> = []
    let startIndex = 0;
    let searchTextIndex = 1;
    do {
      searchTextIndex = this.allTexts.indexOf(searchText, startIndex);
      if (searchTextIndex === -1) {
        break;
      }
      startIndex = searchTextIndex + searchText.length;
      // Save start index of this keyword.
      searchTextIndexes.push(searchTextIndex);
      // Save end index of this keyword.
      searchTextIndexes.push(searchTextIndex + searchText.length);
    } while (searchTextIndex < this.allTexts.length - 1);

    if (searchTextIndexes.length === 0) {
      return;
    }

    // Convert keyword indexes to visibleTextNode and offset.
    let searchTextNodes: Array<any> = [];
    let i = 0;
    searchTextIndex = searchTextIndexes.shift()!;
    for (let n = 0; n < this.visibleTextNodes.length; n++) {
      const visibleTextNode = this.visibleTextNodes[n];
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

    // Convert visibleTextNode and offset to range.
    for (let i = 0; i < searchTextNodes.length / 2; i += 1) {
      const r = new Range();
      let start = searchTextNodes[i * 2];
      let end = searchTextNodes[i * 2 + 1];
      r.setStart(start.node, start.offset);
      r.setEnd(end.node, end.offset);
      this.searchTextRanges.push(r);
    }
  }

  findVisibleCharIndex(node: Node, offset: number) {
    for (let i = 0; i < this.visibleChars.length; i++) {
      const visibleChar = this.visibleChars[i];
      if (visibleChar.node === node && visibleChar.offset === offset) {
        return i;
      }
    }
    return -1;
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
    const range = this.searchTextRanges[index];
    this.moveToRange(range);
  }

  rangeToEpubcfi(range: Range) {
    return (this.rendition?.getContents() as any)[0].cfiFromRange(range) || '';
  }

  moveToRange(range: Range) {
    if (this.props.paginated) {
      this.moveToEpubcfi(this.rangeToEpubcfi(range));
    } else {
      range.startContainer.parentElement?.scrollIntoView();
    }
  }

  moveToEpubcfi(epubcfi: string) {
    return new Promise<void>((ok) => {
      this.rendition?.display(epubcfi).then(() => {
        this.rendition?.annotations.removeAll();
        this.rendition?.annotations.highlight(epubcfi, {}, (e: any) => {
        });
        ok();
      });
    })
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

  get currentJuan() {
    return +this.props.match.params.path;
  }

  get juanList() {
    return this.state.workInfo.juan_list.split(',').map(v => +v);
  }

  juanPrev() {
    if (this.currentJuan > Math.min(...this.juanList)) {
      const prevJuan = this.juanList[this.juanList.findIndex(v => v === this.currentJuan) - 1];
      const routeLink = `/catalog/juan/${this.props.match.params.work}/${prevJuan}`;
      this.ionViewWillLeave();
      this.props.history.push({
        pathname: routeLink,
      });
    } else {
      this.setState({ showToast: true, toastMessage: '已至首卷！' });
    }
  }

  juanNext() {
    if (this.currentJuan < Math.max(...this.juanList)) {
      const nextJuan = this.juanList[this.juanList.findIndex(v => v === this.currentJuan) + 1];
      const routeLink = `/catalog/juan/${this.props.match.params.work}/${nextJuan}`;
      this.ionViewWillLeave();
      this.props.history.push({
        pathname: routeLink,
      });
    } else {
      this.setState({ showToast: true, toastMessage: '已至尾卷！' });
    }
  }

  findCbetaHtmlLine(node: Node) {
    let parent: HTMLElement | null | undefined = node.parentElement;
    do {
      if (parent?.getAttribute('l')) {
        break;
      }
    } while ((parent = parent?.parentElement));
    return parent;
  }

  // There is a max characters per utterance limit on Android Chrome.
  // This max value is obtained by try and error.
  maxCharsPerUtterance = 1000;
  workTexts: Array<string> = [];
  workTextsIndex = 0;

  findTextsInPageAndChunking() {
    let texts: string | undefined;
    if (this.state.isSpeechRepeatMode) {
      const repeatStartVisibleCharIndex = this.findVisibleCharIndex(this.speechRepeatStart!.startContainer, this.speechRepeatStart!.startOffset);
      const repeatEndVisibleCharIndex = this.findVisibleCharIndex(this.speechRepeatEnd!.endContainer, this.speechRepeatEnd!.endOffset - 1);
      texts = '';
      for (let i = repeatStartVisibleCharIndex; i < repeatEndVisibleCharIndex + 1; i++) {
        texts += this.visibleChars[i].char;
      }
    } else if (this.props.paginated) {
      texts = this.findTextsInPage(this.state.currentPage);
    } else {
      texts = this.getRemainingWorkTextFromSelectedRange();
    }

    //const remainingWorkText = this.getRemainingWorkTextFromSelectedRange();
    const workText = texts || this.ePubIframe?.contentDocument?.getElementById('body')?.innerText?.replace(new RegExp('No. .*'), '') || '無法取得經文內容';

    this.workTexts = [];
    for (let i = 0; i < Math.ceil(workText.length / this.maxCharsPerUtterance); i++) {
      this.workTexts.push(workText.substring(i * this.maxCharsPerUtterance, (i + 1) * this.maxCharsPerUtterance));
    }

    this.workTextsIndex = 0;
  }

  speechRepeatStart: Range | undefined;
  speechRepeatEnd: Range | undefined;
  playText2Speech() {
    const voices = Globals.zhVoices();

    switch (this.state.speechState) {
      case SpeechState.UNINITIAL:
        const zhTwVoice = voices.find(v => v.voiceURI === this.props.voiceURI) || voices[0];
        if (zhTwVoice !== undefined) {
          this.speechSynthesisUtterance!.lang = zhTwVoice.lang;
          this.speechSynthesisUtterance!.voice = zhTwVoice;
        }

        this.findTextsInPageAndChunking();
        this.speechSynthesisUtterance!.text = this.workTexts[this.workTextsIndex];
        this.speechSynthesisUtterance!.rate = this.props.speechRate;
        // Improve reliability by cancel first.
        speechSynthesis.cancel();
        speechSynthesis.speak(this.speechSynthesisUtterance!);
        this.setState({ speechState: SpeechState.SPEAKING, showToast: true, toastMessage: '經文唸誦非真人發音，僅作參考！' });
        break;
      case SpeechState.SPEAKING:
        // Unfortunately, pause() doesn't work on most Chrome browser.
        // Instead, we support stop.
        /*
        speechSynthesis.pause();
        this.setState({speechState: SpeechState.PAUSE});
        */
        speechSynthesis.cancel();
        this.setState({ speechState: SpeechState.UNINITIAL, isSpeechRepeatMode: false });
        break;
      case SpeechState.PAUSE:
        speechSynthesis.resume();
        this.setState({ speechState: SpeechState.SPEAKING });
        break;
    }
  }

  doubleClicksToggleFullScreen() {
    doubleClicksEvents(() => {
      this.props.dispatch({
        type: "TMP_SET_KEY_VAL",
        key: 'fullScreen',
        val: !this.props.tmpSettings.fullScreen,
      });
    });
  }

  render() {
    let header = (
      <IonHeader hidden={this.props.tmpSettings.fullScreen}>
        <IonToolbar>
          <IonTitle className='uiFont'></IonTitle>

          <IonButton fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
            <IonIcon icon={arrowBack} slot='icon-only' />
          </IonButton>

          <IonButton hidden={!this.state.fetchError} fill="clear" slot='end' onClick={e => {
            this.fetchData().then(() => {
              this.html2Epub();
            });
          }}>
            <IonIcon icon={refreshCircle} slot='icon-only' />
          </IonButton>

          <IonButton fill='outline' shape='round' hidden={!this.props.paginated} slot='end' onClick={ev => {
            this.setState({ showJumpPageAlert: true });
          }}>
            <IonLabel className='uiFont' >{this.state.currentPage}</IonLabel>
          </IonButton>

          <IonButton hidden={this.state.fetchError || !this.state.canTextToSpeech} fill="clear" slot='end' onClick={e => {
            this.playText2Speech();
          }}>
            <IonIcon icon={this.state.speechState === SpeechState.SPEAKING ? stopCircle : musicalNote} slot='icon-only' />
          </IonButton>

          <IonButton hidden={this.state.fetchError} fill="clear" slot='end' onClick={e => {
            //this.setState({ popover: { show: false, event: null } });
            clearTimeout(this.clearSelectedStringTimer);
            this.addBookmarkHandler();
          }}>
            <IonIcon icon={bookmark} slot='icon-only' />
          </IonButton>

          <IonButton fill="clear" slot='end' onClick={e => {
            clearTimeout(this.clearSelectedStringTimer);
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
                this.setState({ showSpeechRepeatStart: true, popover: { show: false, event: null } });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={musicalNotes} slot='start' />
                <IonLabel className='ion-text-wrap uiFont'>循環播放</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                this.props.history.push(`/catalog/work/${this.props.match.params.work}`);
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={home} slot='start' />
                <IonLabel className='ion-text-wrap uiFont'>回經目錄</IonLabel>
              </IonItem>

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
                const selectedText = this.selectedString;
                Globals.copyToClipboard(selectedText);
                this.setState({ showToast: true, toastMessage: `複製文字成功！` });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={copy} slot='start' />
                <IonLabel className='ion-text-wrap uiFont'>複製文字</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                this.setState({ showSearchTextToast: false, showSearchTextAlert: true });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={search} slot='start' />
                <IonLabel className='ion-text-wrap uiFont'>搜尋文字</IonLabel>
              </IonItem>
              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                this.setState({ showSearchAlert: true });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={search} slot='start' />
                <IonLabel className='ion-text-wrap uiFont'>搜尋經書</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                const selectedText = this.selectedString;
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
                <IonLabel className='ion-text-wrap uiFont'>查詞典</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                const selectedText = this.selectedString;
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
                <IonLabel className='ion-text-wrap uiFont'>查字典</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                this.ePubIframe?.contentWindow?.print();
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={print} slot='start' />
                <IonLabel className='ion-text-wrap uiFont'>列印</IonLabel>
              </IonItem>

              <IonItem button onClick={e => {
                this.setState({ popover: { show: false, event: null } });
                window.open(`https://cbetaonline.dila.edu.tw/zh/${this.props.match.params.work}_${this.props.match.params.path.padStart(3, '0')}`, '_bank');
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={link} slot='start' />
                <IonLabel className='ion-text-wrap uiFont'>CBETA Online</IonLabel>
              </IonItem>

              <IonItem button onClick={ev => {
                this.setState({ popover: { show: false, event: null } });
                const selectedText = this.selectedString;
                if (selectedText === '') {
                  this.setState({ showNoSelectedTextAlert: true });
                  return;
                }

                const range = this.selectedRange!;
                let startLine = this.findCbetaHtmlLine(range.startContainer)?.getAttribute('l');
                let endLine = this.findCbetaHtmlLine(range.endContainer)?.getAttribute('l');
                //sel?.removeAllRanges();
                if (startLine == null || endLine == null) {
                  this.setState({ showToast: true, toastMessage: '所選文字無法引用！' });
                  return;
                }
                const startLineMatches = /0*([1-9]*)([a-z])0*([1-9]*)/.exec(startLine!)!;
                const startLineModified = `${startLineMatches[1]}${startLineMatches[2]}${startLineMatches[3]}`;
                const endLineModified = /0*([1-9]*)([a-z])0*([1-9]*)/.exec(endLine!)![3];

                let lineInfo = `${startLineModified}`;
                if (startLine !== endLine) {
                  lineInfo += `-${endLineModified}`;
                }
                const citation = `《${this.state.workInfo.title}》卷${this.props.match.params.path}：「${selectedText}」(CBETA, ${this.state.workInfo.vol}, no. ${+(/[^0-9]*(.*)/.exec(this.state.workInfo.work)![1])}, p. ${lineInfo})`;
                Globals.copyToClipboard(citation);
                this.setState({ showToast: true, toastMessage: '已複製到剪貼簿！' });
              }}>
                <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                <IonIcon icon={shareSocial} slot='start' />
                <IonLabel className='ion-text-wrap uiFont'>引用文章</IonLabel>
              </IonItem>

              <IonItem button onClick={ev => {
                let sharedUrl = window.location.href.split('?')[0];
                const selectedText = this.selectedString;
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
                <IonLabel className='ion-text-wrap uiFont'>分享此頁</IonLabel>
              </IonItem>
            </IonList>
          </IonPopover>

          <IonProgressBar reversed={this.props.rtlVerticalLayout} value={this.state.currentPage / this.state.pageCount} />
        </IonToolbar>
      </IonHeader>
    );

    const fabButtonOpacity = this.props.settings.fabButtonAlpha;
    let navButtons = (<>
      <IonFab vertical='center' horizontal='start' slot='fixed'>
        <IonFabButton style={{ opacity: fabButtonOpacity }} onClick={e => this.props.rtlVerticalLayout ? this.buttonNext() : this.buttonPrev()}
          onPointerDown={e => {
            e.currentTarget.style.setProperty('opacity', '1');
          }}
          onPointerEnter={e => {
            e.currentTarget.style.setProperty('opacity', '1');
          }}
          onPointerUp={e => {
            // Hide button on pointer up for touch devices.
            if (Globals.isTouchDevice()) {
              e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
            }
          }}
          onPointerLeave={e => {
            e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
          }}>
          <IonIcon icon={this.props.rtlVerticalLayout ? arrowBack : arrowUp} />
        </IonFabButton>
      </IonFab>
      <IonFab vertical='center' horizontal='end' slot='fixed'>
        <IonFabButton style={{ opacity: fabButtonOpacity }} onClick={e => this.props.rtlVerticalLayout ? this.buttonPrev() : this.buttonNext()}
          onPointerDown={e => {
            e.currentTarget.style.setProperty('opacity', '1');
          }}
          onPointerEnter={e => {
            e.currentTarget.style.setProperty('opacity', '1');
          }}
          onPointerUp={e => {
            if (Globals.isTouchDevice()) {
              e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
            }
          }}
          onPointerLeave={e => {
            e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
          }}>
          <IonIcon icon={this.props.rtlVerticalLayout ? arrowForward : arrowDown} />
        </IonFabButton>
      </IonFab>
    </>);

    return (
      <IonPage>
        {header}
        <IonContent>
          {this.props.paginated || this.state.showSearchTextToast ? navButtons : <></>}

          <IonFab vertical='bottom' horizontal='end' slot='fixed'>
            <IonFabButton style={{ opacity: fabButtonOpacity }}
              onPointerDown={e => {
                e.currentTarget.style.setProperty('opacity', '1');
              }}
              onPointerEnter={e => {
                e.currentTarget.style.setProperty('opacity', '1');
              }}
              onPointerUp={e => {
                if (Globals.isTouchDevice()) {
                  e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
                }
              }}
              onPointerLeave={e => {
                e.currentTarget.style.setProperty('opacity', `${fabButtonOpacity}`);
              }}>
              <IonIcon icon={chevronUpOutline} />
            </IonFabButton>
            <IonFabList side='top'>
              <IonFabButton onClick={e => {
                this.juanNext();
              }}>
                <IonIcon style={this.props.rtlVerticalLayout ? {} : { transform: 'rotate(270deg)' }} icon={playSkipBack} color='dark'></IonIcon>
              </IonFabButton>
              <IonFabButton onClick={e => {
                this.juanPrev();
              }}>
                <IonIcon style={this.props.rtlVerticalLayout ? {} : { transform: 'rotate(270deg)' }} icon={playSkipForward} color='dark'></IonIcon>
              </IonFabButton>
              <IonFabButton onClick={e => {
                this.props.dispatch({
                  type: "TMP_SET_KEY_VAL",
                  key: 'fullScreen',
                  val: !this.props.tmpSettings.fullScreen,
                });
              }}>
                <IonIcon icon={expand} color='dark'></IonIcon>
              </IonFabButton>
            </IonFabList>
          </IonFab>

          <IonLoading
            cssClass='uiFont'
            isOpen={this.state.isLoading}
            onDidDismiss={() => this.setState({ isLoading: false })}
            message={'載入中...'}
          />

          {this.state.fetchError ? Globals.fetchErrorContent : <></>}

          <div id='cbetarEPubView' style={{ width: '100%', height: '100%', userSelect: "text", WebkitUserSelect: "text" }}>
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
            isOpen={this.state.showSpeechRepeatStart}
            onDidDismiss={() => this.setState({ showSpeechRepeatStart: false })}
            message={`請選擇偱環播放文字起點，再按確定`}
            buttons={[
              {
                text: '確定',
                role: 'ok',
                handler: () => {
                  clearTimeout(this.clearSelectedStringTimer);
                  this.speechRepeatStart = this.selectedRange;
                  this.setState({ showSpeechRepeatStart: false, showSpeechRepeatEnd: true });
                }
              }
            ]}
          />

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showSpeechRepeatEnd}
            onDidDismiss={() => this.setState({ showSpeechRepeatEnd: false })}
            message={`請選擇偱環播放文字終點，再按確定`}
            buttons={[
              {
                text: '確定',
                role: 'ok',
                handler: () => {
                  clearTimeout(this.clearSelectedStringTimer);
                  this.speechRepeatEnd = this.selectedRange;
                  this.setState({ isSpeechRepeatMode: true, showSpeechRepeatEnd: false }, () => {
                    this.playText2Speech();
                  });
                }
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
    settings: state.settings,
    bookmarks: state.settings.bookmarks,
    fontSize: state.settings.fontSize,
    showComments: state.settings.showComments,
    paginated: state.settings.paginated,
    rtlVerticalLayout: state.settings.rtlVerticalLayout,
    useFontKai: state.settings.useFontKai,
    scrollbarSize: state.settings.scrollbarSize,
    voiceURI: state.settings.voiceURI,
    speechRate: state.settings.speechRate,
    tmpSettings: state.tmpSettings,
  };
};

const EPubViewPage = withIonLifeCycle(_EPubViewPage);

export default connect(
  mapStateToProps,
)(EPubViewPage);
