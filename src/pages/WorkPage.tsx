import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle, IonButton, IonBackButton, IonIcon } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import axios from 'axios';
import './WorkPage.css';
import { Work } from '../models/Work';
import Globals from '../Globals';
import { bookmark, arrowBack, home, search } from 'ionicons/icons';
import { Bookmark, BookmarkType } from '../models/Bookmark';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

const urlWork = `${Globals.cbetaApiUrl}/works?work=`;
class _WorkPage extends React.Component<PageProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      work: null,
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
    this.fetchWork(this.props.match.params.path);
  }

  async fetchWork(path: string) {
    //try {
    const res = await axios.get(urlWork + path, {
      responseType: 'arraybuffer',
    });
    const data = JSON.parse(new Buffer(res.data).toString());
    const works = data.results as [Work];

    this.setState({ work: works[0] });
    return true;

    /*data..forEach((element) {
      works.add(Work.fromJson(element));
    });
  } catch (e) {
    fetchFail = true;
  }*/
  }

  addBookmarkHandler() {
    (this.props as any).dispatch({
      type: "ADD_BOOKMARK",
      bookmark: new Bookmark({
        type: BookmarkType.WORK,
        uuid: this.props.match.params.path,
        selectedText: this.props.match.params.label,
        fileName: '',
        work: null,
      }),
    });
  }

  delBookmarkHandler() {
    (this.props as any).dispatch({
      type: "DEL_BOOKMARK",
      uuid: this.props.match.params.path,
    });
  }

  get hasBookmark() {
    return ((this.props as any).bookmarks as [Bookmark]).find(
      (e) => e.type === BookmarkType.WORK && e.uuid === this.props.match.params.path) != null;
  }

  getRows() {
    let work = (this.state as any).work as Work
    let rows = Array<object>();
    let juans = work.juan_list.split(',');
    for (let i = 0; i < juans.length; i++) {
      //if (work.nodeType == 'html')
      let routeLink = `/catalog/webview/${work.work}/${juans[i]}/${work.title}`;
      rows.push(
        <IonItem key={`juanItem` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
          });
        }}>
          <IonLabel className='ion-text-wrap' style={{ fontSize: (this.props as any).listFontSize }} key={`juanLabel` + i}>
            卷{juans[i]}
          </IonLabel>
        </IonItem>
      );
    }
    return rows;
  }

  //work = this.works[0] as Work;
  render() {
    let work = (this.state as any).work as Work
    if (work == null) {
      return <IonPage></IonPage>
    }

    let rows = this.getRows();
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{(this.state as any).work.title}</IonTitle>
            <IonButton fill="clear" slot='start'>
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
          <IonList>
            {rows}
          </IonList>
        </IonContent>
      </IonPage>
    );
  }
};

const WorkPage = withIonLifeCycle(_WorkPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    bookmarks: state.settings.bookmarks,
    listFontSize: state.settings.listFontSize,
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(WorkPage);
