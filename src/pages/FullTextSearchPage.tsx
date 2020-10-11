import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle, IonButton, IonIcon } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import SearchAlert from '../components/SearchAlert';
import { home, search, arrowBack, shareSocial } from 'ionicons/icons';
import { FullTextSearch } from '../models/FullTextSearch';

interface Props {
  dispatch: Function;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
  keyword: string;
}> { }

interface State {
  showSearchAlert: boolean;
  searches: Array<FullTextSearch>;
}

class _SearchPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      showSearchAlert: false,
      searches: [],
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
    this.search(this.props.match.params.keyword);
  }

  async search(keyword: string) {
    try {
      const res = await Globals.axiosInstance.get(`/sphinx?q=${keyword}`, {
        responseType: 'arraybuffer',
      });
      const data = JSON.parse(new TextDecoder().decode(res.data)).results as [any];
      const searches = data.map((json) => new FullTextSearch(json));

      this.setState({ searches: searches });
      return true;
    } catch (err) {

    }
  }

  get isTopPage() {
    return this.props.match.url === '/catalog';
  }

  getRows() {
    let rows = Array<object>();
    const searches = (this.state as any).searches as [FullTextSearch];
    searches.forEach((search, i) => {
      let label = `${search.title}\n作者:${search.creators}`;
      let routeLink = `/catalog/work/${search.work}`;
      rows.push(
        <IonItem key={`searchItem_` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
          });
        }}>
          <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
          <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }} key={`searchLabel_` + i}>
            {label}
          </IonLabel>
        </IonItem>
      );
    });
    return rows;
  }

  render() {
    let rows = this.getRows();
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>全文檢索 - {this.props.match.params.keyword}</IonTitle>
            <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" slot='end' onClick={e => this.props.history.push(`/${this.props.match.params.tab}`)}>
              <IonIcon icon={home} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" slot='end' onClick={e => this.setState({ showSearchAlert: true })}>
              <IonIcon icon={search} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onClick={e => {
              this.props.dispatch({
                type: "TMP_SET_KEY_VAL",
                key: 'shareTextModal',
                val: {
                  show: true,
                  text: decodeURIComponent(window.location.href),
                },
              });
            }}>
              <IonIcon icon={shareSocial} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            {rows}
          </IonList>

          <SearchAlert
            {...{
              showSearchAlert: (this.state as any).showSearchAlert,
              finish: () => { this.setState({ showSearchAlert: false }) }, ...this.props
            }}
          />
        </IonContent>
      </IonPage>
    );
  }
};

const SearchPage = withIonLifeCycle(_SearchPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(SearchPage);
