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

  get hasBookmark() {
    return ((this.props as any).bookmarks as [Bookmark]).length > 0;
  }

  render() {
    let bookmarks = (this.props as any).bookmarks as [Bookmark];
    let rows = Array<object>();
    bookmarks.forEach((bookmark, i) => {
      let routeLink = ``;
      let label = `${bookmark.selectedText}`;
      switch (bookmark.type) {
        case BookmarkType.CATALOG:
          routeLink = `/catalog/${bookmark.uuid}/${label}`; break;
        case BookmarkType.WORK:
          routeLink = `/catalog/work/${bookmark.uuid}/${label}`; break;
        case BookmarkType.JUAN:
          routeLink = `/catalog/webview/${bookmark.work?.work}/${bookmark.work?.juan}/${bookmark.work?.title}`;
          label = `${bookmark.work?.title}第${bookmark.work?.juan}卷 - ${label}`; break;
      }
      rows.push(
        <IonItem key={`bookmarkItem_` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
            state: {
              uuid: bookmark.uuid,
            },
          });
        }}>
          <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).listFontSize }} key={`bookmarkItemLabel_` + i}>
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
            {this.hasBookmark ? <IonList>{rows}</IonList> : <IonLabel style={{fontSize: 48, textAlign: 'center', height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>無書籤</IonLabel>}
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
