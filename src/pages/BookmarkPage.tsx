import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle, IonItemSliding, IonItemOptions, IonItemOption } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import './WorkPage.css';
import { Bookmark, BookmarkType } from '../models/Bookmark';

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  fontSize: number;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
}> { }

class _BookmarkPage extends React.Component<PageProps> {
  bookmarkListRef: React.RefObject<HTMLIonListElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      work: null,
    }
    this.bookmarkListRef = React.createRef<HTMLIonListElement>();
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
  }

  get hasBookmark() {
    return ((this.props as any).bookmarks as [Bookmark]).length > 0;
  }

  delBookmarkHandler(uuidStr: string) {
    this.props.dispatch({
      type: "DEL_BOOKMARK",
      uuid: uuidStr,
    });
  }

  render() {
    let bookmarks = this.props.bookmarks;
    let rows = Array<object>();
    bookmarks.forEach((bookmark, i) => {
      let routeLink = ``;
      let label = `${bookmark.selectedText}`;
      switch (bookmark.type) {
        case BookmarkType.CATALOG:
          routeLink = `/catalog/catalog/${bookmark.uuid}/${label}`; break;
        case BookmarkType.WORK:
          routeLink = `/catalog/work/${bookmark.uuid}/${label}`; break;
        case BookmarkType.JUAN:
          routeLink = `/catalog/webview/${bookmark.work?.work}/${bookmark.work?.juan}/${bookmark.work?.title}`;
          label = `${bookmark.work?.title}第${bookmark.work?.juan}卷 - ${label}`; break;
      }
      rows.push(
        <IonItemSliding key={`bookmarkItemSliding_` + i}>
          <IonItem key={`bookmarkItem_` + i} button={true} onClick={async event => {
            event.preventDefault();
            this.props.history.push({
              pathname: routeLink,
              state: {
                uuid: bookmark.uuid,
              },
            });
          }}>
            <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }} key={`bookmarkItemLabel_` + i}>
              {label}
            </IonLabel>
          </IonItem>

          <IonItemOptions side="end">
            <IonItemOption color='danger' onClick={(e) => {
              this.delBookmarkHandler(bookmark.uuid);
              this.bookmarkListRef.current?.closeSlidingItems();
            }}>刪除</IonItemOption>
          </IonItemOptions>
        </IonItemSliding>
      );
    });
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>書籤</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {this.hasBookmark ?
            <IonList ref={this.bookmarkListRef}>{rows}</IonList> :
            <IonLabel style={{ fontSize: 48, textAlign: 'center', height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div>
                <div>無書籤</div>
                <div style={{ fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>請切換至目錄頁新增</div>
              </div>
            </IonLabel>
          }
        </IonContent>
      </IonPage>
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: state.settings.bookmarks,
  }
};

//const mapDispatchToProps = {};

const BookmarkPage = withIonLifeCycle(_BookmarkPage);

export default connect(
  mapStateToProps,
)(BookmarkPage);
