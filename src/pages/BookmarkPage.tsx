import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonReorderGroup, IonReorder, IonItem, IonLabel, withIonLifeCycle, IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonButton, IonToast } from '@ionic/react';
import { ItemReorderEventDetail } from '@ionic/core';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import './WorkPage.css';
import { Bookmark, BookmarkType } from '../models/Bookmark';
import { download, swapVertical } from 'ionicons/icons';
import queryString from 'query-string';
import Globals from '../Globals';

interface Props {
  dispatch: Function;
  bookmarks: [Bookmark];
  fontSize: number;
}

interface State {
  reorder: boolean;
  showToast: boolean;
  toastMessage: string;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
}> { }

const helpDoc = <>
  <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}>可離線瀏覽圖示 <IonIcon icon={download} /></div>
  {Globals.isStoreApps() ?
    <></>
    :
    <>
      <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}><a href="https://github.com/MrMYHuang/cbetar2#web-app" target="_new">程式安裝說明</a></div>
      <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}><a href="https://github.com/MrMYHuang/cbetar2#shortcuts" target="_new">程式捷徑</a></div>
    </>
  }
</>;

class _BookmarkPage extends React.Component<PageProps, State> {
  bookmarkListRef: React.RefObject<HTMLIonListElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      reorder: false,
      showToast: false,
      toastMessage: '',
    }
    this.bookmarkListRef = React.createRef<HTMLIonListElement>();
  }

  ionViewWillEnter() {
    let queryParams = queryString.parse(this.props.location.search) as any;
    if (queryParams.item && queryParams.item < this.props.bookmarks.length) {
      const bookmark = this.props.bookmarks[queryParams.item];
      this.props.history.push(`/catalog/juan/${bookmark.work?.work}/${bookmark.work?.juan}`);
    } else if (!this.hasBookmark) {
      this.setState({ showToast: true, toastMessage: '無書籤！請從目錄頁新增書籤。' });
      this.props.history.push(`/catalog/famous`);
    }
    //console.log( 'view will enter' );
  }

  get hasBookmark() {
    return this.props.bookmarks.length > 0;
  }

  get isFamousPage() {
    return this.props.match.url === `/catalog/famous`;
  }

  delBookmarkHandler(uuidStr: string) {
    this.props.dispatch({
      type: "DEL_BOOKMARK",
      uuid: uuidStr,
    });

    if (!this.hasBookmark) {
      this.props.history.push(`/catalog/famous`);
    }
  }

  reorderBookmarks(event: CustomEvent<ItemReorderEventDetail>) {
    const bookmarks = event.detail.complete(this.props.bookmarks);
    this.props.dispatch({
      type: "UPDATE_BOOKMARKS",
      bookmarks: bookmarks,
    });
  }

  getBookmarkRows() {
    let bookmarks = this.props.bookmarks;
    let rows = Array<object>();
    bookmarks.forEach((bookmark, i) => {
      let routeLink = ``;
      let label = `${bookmark.selectedText}`;
      let isHtmlNode = false;
      switch (bookmark.type) {
        case BookmarkType.CATALOG:
          routeLink = `/catalog/catalog/${bookmark.uuid}`; break;
        case BookmarkType.WORK:
          routeLink = `/catalog/work/${bookmark.uuid}`; break;
        case BookmarkType.JUAN:
          routeLink = `/catalog/juan/${bookmark.work?.work}/${bookmark.work?.juan}`;
          label = `${bookmark.work?.title}第${bookmark.work?.juan}卷 - ${label}`; break;
        case BookmarkType.HTML:
          isHtmlNode = true;
          routeLink = `/catalog/juan/${bookmark.work?.work}/1`;
          label = `${bookmark.work?.title} - ${label}`; break;
      }
      rows.push(
        <IonItemSliding key={`bookmarkItemSliding_` + i}>
          <IonItem key={`bookmarkItem_` + i} button={true} onClick={async event => {
            if (this.state.reorder) {
              this.setState({ showToast: true, toastMessage: '請先關閉排列功能，才可點擊書籤！' });
              return;
            }

            event.preventDefault();
            this.props.history.push({
              pathname: routeLink,
              state: {
                uuid: bookmark.uuid,
              },
              search: queryString.stringify(isHtmlNode ? { file: bookmark.fileName, title: bookmark.work?.title } : {}),
            });
          }}>
            <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
            <IonLabel className='ion-text-wrap uiFont' key={`bookmarkItemLabel_` + i}>
              {label}
            </IonLabel>
            {bookmark.type === BookmarkType.CATALOG ? '' : <IonIcon icon={download} slot='end' />}
            <IonReorder slot='end' />
          </IonItem>

          <IonItemOptions side="end">
            <IonItemOption style={{ fontSize: 'var(--ui-font-size)' }} color='danger' onClick={(e) => {
              this.delBookmarkHandler(bookmark.uuid);
              this.bookmarkListRef.current?.closeSlidingItems();
            }}>刪除</IonItemOption>
          </IonItemOptions>
        </IonItemSliding>
      );
    });
    return rows;
  }

  render() {
    const rows = this.getBookmarkRows();

    return (
      <IonPage key={`bookmarksPage${this.isFamousPage}`}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>書籤</IonTitle>

            <IonButton fill={this.state.reorder ? 'solid' : 'clear'} slot='end'
              onClick={ev => this.setState({ reorder: !this.state.reorder })}>
              <IonIcon icon={swapVertical} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {this.hasBookmark ?
            <>
              <IonList key='bookmarkList0' ref={this.bookmarkListRef}>
                <IonReorderGroup disabled={!this.state.reorder} onIonItemReorder={(event: CustomEvent<ItemReorderEventDetail>) => { this.reorderBookmarks(event); }}>
                  {rows}
                </IonReorderGroup>
              </IonList>
              {helpDoc}
            </> :
            <>
              <IonList key='bookmarkList1'>
                {rows}
              </IonList>
              {helpDoc}
            </>
          }

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
    bookmarks: state.settings.bookmarks,
  }
};

//const mapDispatchToProps = {};

const BookmarkPage = withIonLifeCycle(_BookmarkPage);

export default connect(
  mapStateToProps,
)(BookmarkPage);
