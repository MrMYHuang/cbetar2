import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import axios from 'axios';
import './WorkPage.css';
import { Work } from '../models/Work';
import Globals from '../Globals';
import { Bookmark, BookmarkType } from '../models/Bookmark';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
}> { }

const urlWork = `${Globals.cbetaApiUrl}/works?work=`;
class _BookmarkPage extends React.Component<PageProps> {
  constructor(props) {
    super(props);
    this.state = {
      work: null,
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
  }

  render() {
    let bookmarks = this.props.bookmarks as [Bookmark];
    let rows = Array<object>();
    let routeLink = ``;
    bookmarks.forEach((bookmark, i) => {
      let label = `${bookmark.selectedText}`;
      switch (bookmark.type) {
        case BookmarkType.CATALOG:
          routeLink = `/catalog/${bookmark.uuid}`; break;
        case BookmarkType.WORK:
          routeLink = `/catalog/work/${bookmark.uuid}`; break;
        case BookmarkType.JUAN:
          label = `${bookmark.work?.title}第${bookmark.work?.juan}卷 - ${label}`;
          routeLink = `/catalog/webview/${bookmark.work}/${bookmark.fileName}`; break;
      }
      rows.push(
        <IonItem key={`bookmarkItem_` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
            state: {
              uuid: bookmark.uuid,
              label: bookmark.work,
            },
          });
        }}>
          <IonLabel style={{ fontSize: this.props.listFontSize }} key={`bookmarkItemLabel_` + i}>
            {label}
          </IonLabel>
        </IonItem>
      );
    });
    return (
      <>
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonTitle>書籤</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              {rows}
            </IonList>
          </IonContent>
        </IonPage>
      </>
    );
  }
};

const mapStateToProps = (state /*, ownProps*/) => {
  return {
    bookmarks: state.settings.bookmarks,
  }
};

//const mapDispatchToProps = {};

const BookmarkPage = withIonLifeCycle(_BookmarkPage);

export default connect(
  mapStateToProps,
)(BookmarkPage);
