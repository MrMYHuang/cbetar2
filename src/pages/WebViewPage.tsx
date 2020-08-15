import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, withIonLifeCycle, IonBackButton, IonIcon } from '@ionic/react';
import { RouteComponentProps, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import axios from 'axios';
import './WebViewPage.css';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { Work } from '../models/Work';

interface PageProps extends RouteComponentProps<{
  tab: string;
  work: string;
  path: string;
}> { }

const bookmarkPrefix = 'bookmark_';
window.onload = function () {
  //SaveHtml.postMessage(JSON.stringify({status: 'loaded'}));
}

const url = `${Globals.cbetaApiUrl}/juans?edition=CBETA`;
class _WebViewPage extends React.Component<PageProps> {
  constructor(props) {
    super(props);
    this.state = {
      htmlStr: null,
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
    this.fetchData(this.props.match.params.path);
  }

  async fetchData(juan: string) {
    let htmlStr = '';
    if (this.props.location.state?.uuid != null) {
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
      sel = window.getSelection();
      if (sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.startContainer.parentElement.id = bookmarkPrefix + uuidStr;
        var msg = JSON.stringify({ status: 'ok', selectedText: sel.toString(), html: document.body.outerHTML });

        this.props.dispatch({
          type: "ADD_BOOKMARK",
          htmlStr: document.body.outerHTML,
          bookmark: new Bookmark({
            type: BookmarkType.JUAN,
            uuid: uuidStr,
            selectedText: sel.toString(),
            fileName: `${this.props.match.params.work}_juan${this.props.match.params.path}.html`,
            work: new Work({
              juan: this.props.match.params.path,
              title: this.props.location.state.label,
            }),
          }),
        });
        this.props.location.state.uuid = uuidStr;
        return;
      }
    }

    //SaveHtml.postMessage(JSON.stringify({status: 'error'}));    
    return;
  }

  delBookmarkHandler() {
    let uuidStr = this.props.location.state.uuid;
    var oldBookmark = document.getElementById(bookmarkPrefix + uuidStr);
    if (oldBookmark) {
      oldBookmark.id = '';
      this.props.dispatch({
        type: "DEL_BOOKMARK",
        uuid: uuidStr,
        fileName: this.bookmark?.fileName,
      });
    }
  }

  scrollToBookmark(uuidStr: string) {
    //console.log('Bookmark uuid: ' + bookmarkPrefix + uuid);
    document.getElementById(bookmarkPrefix + uuidStr)!.scrollIntoView();
  }

  get bookmark() {
    return (this.props.bookmarks as [Bookmark]).find(
      (e) => e.type == BookmarkType.JUAN && e.uuid == this.props.location.state?.uuid);
  }

  get hasBookmark() {
    return this.bookmark != null;
  }

  uuidStr = '';
  render() {
    return (
      <IonPage>
        <style dangerouslySetInnerHTML={{
          __html: `
      .t, p { font-size: ${this.props.fontSize}px }
    `}} />
        <IonHeader>
          <IonToolbar>
            <IonTitle>{this.props.workTitle}</IonTitle>            <IonButton fill="clear" slot='start'>
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
          <div id='cbetarWebView' style={{ userSelect: "text" }} dangerouslySetInnerHTML={{ __html: this.state.htmlStr }}></div>
        </IonContent>
        <script dangerouslySetInnerHTML={{
          __html: `scrollToBookmark(${this.props.location.state ? this.props.location.state.uuid : ''})`
        }}>
        </script>
      </IonPage>
    );
  }
};

const mapStateToProps = (state /*, ownProps*/) => {
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
