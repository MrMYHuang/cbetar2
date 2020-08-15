import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import axios from 'axios';
import { Work } from '../models/Work';
import Globals from '../Globals';
import { key } from 'ionicons/icons';
import { Search } from '../models/Search';

interface PageProps extends RouteComponentProps<{
  tab: string;
  keyword: string;
}> { }

const searchUrl = `${Globals.cbetaApiUrl}/toc?q=`;
class _SearchPage extends React.Component<PageProps> {
  constructor(props) {
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
      const res = await axios.get(searchUrl + keyword, {
        responseType: 'arraybuffer',
      });
      const data = JSON.parse(new Buffer(res.data).toString());
      const searches = data.results as [Search];

      this.setState({ searches: searches });
      return true;
    } catch (err) {

    }
  }

  getRows() {
    let rows = Array<object>();
    const searches = this.state.searches as [Search];
    searches.forEach((search, i) => {
      const isCatalog = search.type == 'catalog';
      let label = isCatalog ? search.label : `${search.title}\n作者:${search.creators}`;
      let routeLink = `/${this.props.match.params.tab}` + (isCatalog ? `/${search.n}` : `/work/${search.work}`);
      rows.push(
        <IonItem key={`searchItem_` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push({
            pathname: routeLink,
            state: { label: search.label },
          });
        }}>
          <IonLabel style={{ fontSize: this.props.listFontSize }} key={`searchLabel_` + i}>
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
            <IonTitle>搜尋 - {this.props.match.params.keyword}</IonTitle>
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

const SearchPage = withIonLifeCycle(_SearchPage);

const mapStateToProps = (state /*, ownProps*/) => {
  return {
    listFontSize: state.settings.listFontSize,
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(SearchPage);
