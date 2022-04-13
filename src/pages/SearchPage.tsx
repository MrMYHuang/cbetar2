import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle, IonButton, IonIcon, IonLoading } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import { Search } from '../models/Search';
import SearchAlert from '../components/SearchAlert';
import { home, search, arrowBack, shareSocial, refreshCircle } from 'ionicons/icons';

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
  fetchError: boolean;
  showSearchAlert: boolean;
  searches: Array<Search>;
  isLoading: boolean;
}

class _SearchPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      fetchError: false,
      showSearchAlert: false,
      searches: [],
      isLoading: false,
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
    this.search(this.props.match.params.keyword);
  }

  componentDidMount() {
  }

  async search(keyword: string) {
    this.setState({ isLoading: true });
    try {
      const res = await Globals.axiosInstance.get(`/toc?q=${keyword}`, {
        responseType: 'arraybuffer',
      });
      const data = JSON.parse(new TextDecoder().decode(res.data)).results as [any];
      const searches = data.map((json) => new Search(json));

      this.setState({ fetchError: false, isLoading: false, searches: searches });
      return true;
    } catch (e) {
      console.error(e);
      console.error(new Error().stack);
      this.setState({ fetchError: true, isLoading: false });
      return false;
    }
  }

  getRows() {
    let rows = Array<JSX.Element>();
    const searches = this.state.searches;
    if (searches.length === 0 && !this.state.isLoading) {
      return Globals.searchNoResultMessage;
    }

    searches.forEach((search, i) => {
      const isCatalog = search.type === 'catalog';
      let label = isCatalog ? search.label : `${search.title}\n作者:${search.creators}`;
      let routeLink = `/${this.props.match.params.tab}` + (isCatalog ? `/catalog/${search.n}` : `/work/${search.work}`);
      rows.push(
        <IonItem key={`searchItem_` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
          });
        }}>
          <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
          <IonLabel className='ion-text-wrap uiFont' key={`searchLabel_` + i}>
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
            <IonTitle className='uiFont'>搜尋</IonTitle>
            <IonButton fill="clear" slot='start' onClick={e => this.props.history.back()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonButton hidden={!this.state.fetchError} fill="clear" slot='end' onClick={e => this.search(this.props.match.params.keyword)}>
              <IonIcon icon={refreshCircle} slot='icon-only' />
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
          {
            this.state.fetchError ?
              Globals.fetchErrorContent :
              <>
                <div className='uiFontX2' style={{ color: 'var(--ion-color-primary)' }}> {this.props.match.params.keyword}</div>

                <IonList>
                  {rows}
                </IonList>
              </>
          }

          <IonLoading
            cssClass='uiFont'
            isOpen={this.state.isLoading}
            onDidDismiss={() => this.setState({ isLoading: false })}
            message={'載入中...'}
          />

          <SearchAlert
            {...{
              showSearchAlert: this.state.showSearchAlert,
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
