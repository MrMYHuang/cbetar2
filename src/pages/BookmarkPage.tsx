import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import './WorkPage.css';
import { Bookmark, BookmarkType } from '../models/Bookmark';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
}> { }

class _BookmarkPage extends React.Component<PageProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      work: null,
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
  }

  render() {
    let bookmarks = (this.props as any).bookmarks as [Bookmark];
    let rows = Array<object>();
    bookmarks.forEach((bookmark, i) => {
      let routeLink = ``;
      let label = `${bookmark.selectedText}`;
      switch (bookmark.type) {
        case BookmarkType.CATALOG:
          routeLink = `/catalog/${bookmark.uuid}`; break;
        case BookmarkType.WORK:
          routeLink = `/catalog/work/${bookmark.uuid}`; break;
        case BookmarkType.JUAN:
          label = `${bookmark.work?.title}第${bookmark.work?.juan}卷 - ${label}`;
          routeLink = `/catalog/webview/${bookmark.work?.work}/${bookmark.fileName}`; break;
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
          <IonLabel style={{ fontSize: (this.props as any).listFontSize }} key={`bookmarkItemLabel_` + i}>
            {label}
          </IonLabel>
        </IonItem>
      );
    });
    return (
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
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: state.settings.bookmarks,
    listFontSize: state.settings.listFontSize,
  }
};

//const mapDispatchToProps = {};

const BookmarkPage = withIonLifeCycle(_BookmarkPage);

export default connect(
  mapStateToProps,
)(BookmarkPage);
