import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle, IonButton, IonIcon } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import { Search } from '../models/Search';
import SearchAlert from '../components/SearchAlert';
import { home, search, arrowBack } from 'ionicons/icons';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
  keyword: string;
}> { }

class _SearchPage extends React.Component<PageProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      searches: [],
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
    this.search(this.props.match.params.keyword);
  }

  async search(keyword: string) {
    try {
      const res = await Globals.axiosInstance.get(`/toc?q=${keyword}`, {
        responseType: 'arraybuffer',
      });
      const data = JSON.parse(new TextDecoder().decode(res.data)).results as [any];
      const searches = data.map((json) => new Search(json));

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
    const searches = (this.state as any).searches as [Search];
    searches.forEach((search, i) => {
      const isCatalog = search.type === 'catalog';
      let label = isCatalog ? search.label : `${search.title}\n作者:${search.creators}`;
      let routeLink = `/${this.props.match.params.tab}` + (isCatalog ? `/catalog/${search.n}` : `/work/${search.work}`) + `/${search.title}`;
      rows.push(
        <IonItem key={`searchItem_` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
          });
        }}>
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
            <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>搜尋 - {this.props.match.params.keyword}</IonTitle>
            <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
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

          <SearchAlert
            {...{
              showSearchAlert: (this.state as any).showSearchAlert,
              searchCancel: () => { this.setState({ showSearchAlert: false }) },
              searchOk: (keyword: string) => {
                this.props.history.push(`/catalog/search/${keyword}`);
                this.setState({ showSearchAlert: false });
              }, ...this.props
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
