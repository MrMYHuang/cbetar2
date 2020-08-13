import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { RouteComponentProps, Route } from 'react-router-dom';
import './WebViewPage.css';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

const bookmarkPrefix = 'bookmark_';
function addBookmark(uuid: string) {
  var sel, range;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      range.startContainer.parentElement.id = bookmarkPrefix + uuid;
      var msg = JSON.stringify({status: 'ok', selectedText: sel.toString(), html: document.body.outerHTML}); 
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

window.onload = function() {
  //SaveHtml.postMessage(JSON.stringify({status: 'loaded'}));
}

class WebViewPage extends React.Component<PageProps> {
  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{this.props.workTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{userSelect: "text"}} dangerouslySetInnerHTML={{__html: this.props.htmlStr}}></div>
        </IonContent>
      </IonPage>
    );
  }
};

export default WebViewPage;
