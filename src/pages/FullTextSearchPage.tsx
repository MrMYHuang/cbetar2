import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle, IonButton, IonIcon, IonLoading, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import SearchAlert from '../components/SearchAlert';
import { home, search, arrowBack, shareSocial, refreshCircle } from 'ionicons/icons';
import { FullTextSearch } from '../models/FullTextSearch';
import { RouteComponentProps } from '../models/Prop';

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
  isScrollOn: boolean;
  isLoading: boolean;
  fetchError: boolean;
}

class _SearchPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);

    this.state = {
      showSearchAlert: false,
      searches: [],
      isScrollOn: false,
      isLoading: false,
      fetchError: false,
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
    this.search(this.props.params.keyword, true);
  }

  componentDidMount() {
  }

  page = 0;
  rows = 20;
  async search(keyword: string, newSearch: boolean = false) {
    this.setState({ isLoading: true });
    if (newSearch) {
      this.page = 0;
      this.setState({ searches: [] });
    }

    try {
      console.log(`Loading page ${this.page}`);

      const res = await Globals.axiosInstance.get(`/sphinx?q=${keyword}&start=${this.page * this.rows}&rows=${this.rows}`, {
        responseType: 'arraybuffer',
      });
      const data = JSON.parse(new TextDecoder().decode(res.data)).results as [any];
      const searches = data.map((json) => new FullTextSearch(json));

      this.setState({
        fetchError: false, isLoading: false, searches: [...this.state.searches, ...searches],
        isScrollOn: searches.length === this.rows,
      });

      this.page += 1;
      return true;
    } catch (e) {
      console.error(e);
      console.error(new Error().stack);
      this.setState({ fetchError: true, isLoading: false, isScrollOn: false });
      return false;
    }
  }

  getRows() {
    let rows = Array<JSX.Element>();
    const searches = (this.state as any).searches as FullTextSearch[];
    if (searches.length === 0 && !this.state.isLoading) {
      return Globals.searchNoResultMessage;
    }

    searches.forEach((search, i) => {
      let label = `${search.title}卷${search.juan}\n作者:${search.creators}`;
      let routeLink = `/catalog/juan/${search.work}/${search.juan}`;
      rows.push(
        <IonItem key={`searchItem_` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.navigate({
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
            <IonTitle className='uiFont'>全文檢索</IonTitle>
            <IonButton fill="clear" slot='start' onClick={e => this.props.navigate(-1)}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonButton hidden={!this.state.fetchError} fill="clear" slot='end' onClick={e => this.search(this.props.params.keyword)}>
              <IonIcon icon={refreshCircle} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onClick={e => this.props.navigate(`/${this.props.params.tab}`)}>
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
                <div className='uiFontX2' style={{ color: 'var(--ion-color-primary)' }}> {this.props.params.keyword}</div>

                <IonList>
                  {rows}
                  <IonInfiniteScroll threshold="100px"
                    disabled={!this.state.isScrollOn}
                    onIonInfinite={(ev: CustomEvent<void>) => {
                      this.search(this.props.params.keyword);
                      (ev.target as HTMLIonInfiniteScrollElement).complete();
                    }}>
                    <IonInfiniteScrollContent
                      loadingText="載入中...">
                    </IonInfiniteScrollContent>
                  </IonInfiniteScroll>
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
const SearchPageFun = (props: any) => <SearchPage {...props}
  params={useParams()}
  navigate={useNavigate()}
  location={useLocation()}
  />;

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(SearchPageFun);
