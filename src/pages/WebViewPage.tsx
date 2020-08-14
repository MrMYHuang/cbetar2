import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import axios from 'axios';
import './WebViewPage.css';
import Globals from '../Globals';

interface PageProps extends RouteComponentProps<{
  tab: string;
  work: string;
  path: string;
}> { }

const bookmarkPrefix = 'bookmark_';
function addBookmark(uuid: string) {
  var sel, range;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      range.startContainer.parentElement.id = bookmarkPrefix + uuid;
      var msg = JSON.stringify({ status: 'ok', selectedText: sel.toString(), html: document.body.outerHTML });
      //SaveHtml.postMessage(msg);
      return;
    }
  }

  //SaveHtml.postMessage(JSON.stringify({status: 'error'}));    
  return;
}

function delBookmark(uuid: string) {
  var oldBookmark = document.getElementById(bookmarkPrefix + uuid);
  if (oldBookmark) {
    oldBookmark.id = '';
  }
}

function scrollToBookmark(uuid: string) {
  //console.log('Bookmark uuid: ' + bookmarkPrefix + uuid);
  document.getElementById(bookmarkPrefix + uuid)!.scrollIntoView();
}

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
    //try {
    const res = await axios.get(`${url}&work=${this.props.match.params.work}&juan=${juan}`, {
      responseType: 'arraybuffer',
    });
    let data = JSON.parse(new Buffer(res.data).toString());

    this.setState({htmlStr: data.results[0]});
    return true;

    /*data..forEach((element) {
      catalogs.add(Catalog.fromJson(element));
    });
  } catch (e) {
    fetchFail = true;
  }*/
  }

  uuidStr = '';
  render() {
    return (
      <IonPage>
        <style dangerouslySetInnerHTML={{__html: `
      .t, p { font-size: ${this.props.settings.fontSize}px }
    `}} />
        <IonHeader>
          <IonToolbar>
            <IonTitle>{this.props.workTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonButton onClick={e => {
            this.uuidStr = uuid.v4();
            addBookmark(this.uuidStr);
          }}>Add</IonButton>
          <IonButton onClick={e => scrollToBookmark(this.uuidStr)}>Go to</IonButton>
          <div id='cbetarWebView' style={{ userSelect: "text" }} dangerouslySetInnerHTML={{ __html: this.state.htmlStr }}></div>
        </IonContent>
      </IonPage>
    );
  }
};

const mapStateToProps = (state /*, ownProps*/) => {
  return {
    settings: state.settings
  }
};

const WebViewPage = withIonLifeCycle(_WebViewPage);

export default connect(
  mapStateToProps,
)(WebViewPage);
