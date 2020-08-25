import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, withIonLifeCycle, IonIcon, IonAlert, IonPopover, IonList, IonItem, IonLabel } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import queryString from 'query-string';
import './WebViewPage.css';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search, ellipsisHorizontal, ellipsisVertical } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { Work } from '../models/Work';
import SearchAlert from '../components/SearchAlert';

const bookmarkPrefix = 'bookmark_';
function scrollToBookmark(uuidStr: string) {
  console.log('Bookmark uuid: ' + bookmarkPrefix + uuidStr);
  document.getElementById(bookmarkPrefix + uuidStr)?.scrollIntoView();
}
//window.scrollToBookmark = scrollToBookmark;

interface PageProps extends RouteComponentProps<{
  tab: string;
  work: string;
  path: string;
  label: string;
}> { }

class _WebViewPage extends React.Component<PageProps> {
  htmlFile: string;
  constructor(props: any) {
    super(props);
    this.state = {
      htmlStr: null,
      showBookmarkingAlert: false,
      popover: {
        show: false,
        event: null,
      },
    }
    this.htmlFile = '';
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
      this.setState({ htmlStr: htmlStr });
      return true;
    }

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
      //try {
      const res = await Globals.axiosInstance.get(`/juans?edition=CBETA&work=${this.props.match.params.work}&juan=${juan}`, {
        responseType: 'arraybuffer',
      });
      let data = JSON.parse(new TextDecoder().decode(res.data));
      htmlStr = data.results[0];
    }

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

        (this.props as any).dispatch({
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
      (this.props as any).dispatch({
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
    return ((this.props as any).bookmarks as [Bookmark]).find(
      (e) => e.type === BookmarkType.JUAN && e.uuid === this.uuidStr);
  }

  get hasBookmark() {
    return this.bookmark != null;
  }

  rtlVerticalStyles = `
  #cbetarWebView p, #body, #cbetarWebView div {
    direction: ltr;
    writing-mode: vertical-rl;
    display: inline-block;
    white-space: normal;
    text-align: left;
    height: 100%;
    overflow: auto;
  }

  #cbetarWebView {
    white-space: nowrap;
    direction: rtl;
    display: flex;
  }`;

  render() {
    return (
      <IonPage>
        <style dangerouslySetInnerHTML={{
          __html: `
      ${(this.props as any).rtlVerticalLayout ? this.rtlVerticalStyles : ''}

      .t, p {
        font-size: ${(this.props as any).fontSize}px;
      }
      #back {
        display: ${(this.props as any).showComments ? "visible" : "none"} !important;
      }
        `}} />
        <IonHeader>
          <IonToolbar>
            <IonTitle>{this.props.match.params.label}</IonTitle>
            <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" color={this.hasBookmark ? 'warning' : 'primary'} slot='end' onClick={e => this.hasBookmark ? this.delBookmarkHandler() : this.addBookmarkHandler()}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" slot='end' onClick={e => this.setState({ popover: { show: true, event: e.nativeEvent } })}>
              <IonIcon ios={ellipsisHorizontal} md={ellipsisVertical} slot='icon-only' />
            </IonButton>
            <IonPopover
              isOpen={(this.state as any).popover.show}
              event={(this.state as any).popover.event}
              onDidDismiss={e => { this.setState({ popover: { show: false, event: null } }) }}
            >
              <IonList>
                <IonItem button onClick={e => {
                  this.props.history.push(`/${this.props.match.params.tab}`);
                  this.setState({ popover: { show: false, event: null } });
                }}>
                  <IonIcon icon={home} slot='start' />
                  <IonLabel>回首頁</IonLabel>
                </IonItem>
              </IonList>
              <IonList>
                <IonItem button onClick={e => {
                  this.setState({ showSearchAlert: true });
                  this.setState({ popover: { show: false, event: null } });
                }}>
                  <IonIcon icon={search} slot='start' />
                  <IonLabel>搜尋經文</IonLabel>
                </IonItem>
              </IonList>
            </IonPopover>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div id='cbetarWebView' style={{ userSelect: "text", WebkitUserSelect: "text" }} dangerouslySetInnerHTML={{ __html: (this.state as any).htmlStr }}></div>

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
    showComments: state.settings.showComments,
    rtlVerticalLayout: state.settings.rtlVerticalLayout,
    settings: state.settings,
  }
};

const WebViewPage = withIonLifeCycle(_WebViewPage);

export default connect(
  mapStateToProps,
)(WebViewPage);
