import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, withIonLifeCycle, IonBackButton, IonIcon } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import axios from 'axios';
import './WebViewPage.css';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { Work } from '../models/Work';

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
}> { }

const url = `${Globals.cbetaApiUrl}/juans?edition=CBETA`;
class _WebViewPage extends React.Component<PageProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      htmlStr: null,
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
    this.fetchData(this.props.match.params.path);
  }

  ionViewDidEnter() {
    scrollToBookmark(this.props.location.state ? (this.props.location.state as any).uuid : '');
  }

  async fetchData(juan: string) {
    let htmlStr = '';
    const state = this.props.location.state as any;
    if ((state ? state.uuid : state) !== null && (state ? state.uuid : state) !== undefined) {
      htmlStr = localStorage.getItem(this.bookmark?.fileName!)!;
    } else {
      //try {
      const res = await axios.get(`${url}&work=${this.props.match.params.work}&juan=${juan}`, {
        responseType: 'arraybuffer',
      });
      let data = JSON.parse(new Buffer(res.data).toString());
      htmlStr = data.results[0];
    }

    this.setState({ htmlStr: htmlStr });
    return true;

    /*data..forEach((element) {
      catalogs.add(Catalog.fromJson(element));
    });
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

        const state = this.props.location.state as any;
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
              title: (state ? state.label : this.props.match.params.work),
              work: this.props.match.params.work,
            }),
          }),
        });
        state && (state.uuid = uuidStr);
        return;
      }
    }

    //SaveHtml.postMessage(JSON.stringify({status: 'error'}));    
    return;
  }

  delBookmarkHandler() {
    const state = this.props.location.state as any;
    if (!state) {
      return;
    }

    let uuidStr = state.uuid;
    var oldBookmark = document.getElementById(bookmarkPrefix + uuidStr);
    if (oldBookmark) {
      oldBookmark.id = '';
      (this.props as any).dispatch({
        type: "DEL_BOOKMARK",
        uuid: uuidStr,
        fileName: this.bookmark?.fileName,
      });
    }
  }

  get bookmark() {
    const state = this.props.location.state as any;
    return ((this.props as any).bookmarks as [Bookmark]).find(
      (e) => e.type === BookmarkType.JUAN && e.uuid === (state ? state.uuid : null));
  }

  get hasBookmark() {
    return this.bookmark != null;
  }

  render() {
    return (
      <IonPage>
        <style dangerouslySetInnerHTML={{
          __html: `
      .t, p { font-size: ${(this.props as any).fontSize}px }
    `}} />
        <IonHeader>
          <IonToolbar>
            <IonTitle>{(this.props as any).workTitle}</IonTitle>            <IonButton fill="clear" slot='start'>
              <IonBackButton icon={arrowBack} />
            </IonButton>
            <IonButton fill="clear" color={this.hasBookmark ? 'warning' : 'primary'} slot='end' onClick={e => this.hasBookmark ? this.delBookmarkHandler() : this.addBookmarkHandler()}>
              <IonIcon icon={bookmark} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" slot='end' onClick={e => this.props.history.push(`/${this.props.match.params.tab}`)}>
              <IonIcon icon={home} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" slot='end' onClick={e => this.setState({ showSearchAlert: true })}>
              <IonIcon icon={search} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div id='cbetarWebView' style={{ userSelect: "text", WebkitUserSelect: "text" }} dangerouslySetInnerHTML={{ __html: (this.state as any).htmlStr }}></div>
        </IonContent>
      </IonPage>
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: state.settings.bookmarks,
    fontSize: state.settings.fontSize,
    settings: state.settings
  }
};

const WebViewPage = withIonLifeCycle(_WebViewPage);

export default connect(
  mapStateToProps,
)(WebViewPage);
