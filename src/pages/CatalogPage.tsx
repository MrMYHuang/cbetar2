import React from 'react';
import { IonRouterOutlet, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonBackButton, IonIcon, useIonViewWillEnter, useIonViewDidEnter } from '@ionic/react';
import { RouteComponentProps, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import axios from 'axios';
import './CatalogPage.css';
import { Catalog } from '../models/Catalog';
import Globals from '../Globals';
import WorkPage from './WorkPage';
import { Work } from '../models/Work';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

const url = `${Globals.cbetaApiUrl}/catalog_entry?q=`;
const urlWork = `${Globals.cbetaApiUrl}/works?work=`;
class CatalogPage extends React.Component<PageProps> {
  _isMounted = false;
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps){
    console.log(`route changed: ${nextProps.match.url}`)
 }

  componentDidMount() {
    this._isMounted = true;
  }
  componentWillUnmount() {
    this._isMounted = false;
  }

  catalogs = Array<Catalog>();
  async fetchData(path: string) {
    this.catalogs = new Array<Catalog>();

      //try {
      const res = await axios.get(url + path, {
        responseType: 'arraybuffer',
      });
      const data = JSON.parse(new Buffer(res.data).toString());
      this.catalogs = data.results as [Catalog];
    
      return true;

    /*data..forEach((element) {
      catalogs.add(Catalog.fromJson(element));
    });
  } catch (e) {
    fetchFail = true;
  }*/
  }

  works = Array<Work>();
  async fetchWork(path: string) {
    this.works = new Array<Work>();

      //try {
      const res = await axios.get(urlWork + path, {
        responseType: 'arraybuffer',
      });
      const data = JSON.parse(new Buffer(res.data).toString());
      this.works = data.results as [Work];
    
      return true;

    /*data..forEach((element) {
      works.add(Work.fromJson(element));
    });
  } catch (e) {
    fetchFail = true;
  }*/
  }

  render() {
    let rows = Array<object>();
    this.props.catalogs.forEach((catalog, index) => {
      //if (catalog.nodeType == 'html')
      let routeLink = '';
      if (catalog.work == null) {
        routeLink = `${this.props.match.url}/${catalog.n}`;
        rows.push(
          <IonItem key={`${catalog.n}item` + index} button={true} onClick={async event => {
            event.preventDefault();
            await this.fetchData(catalog.n);
           this.props.history.push(routeLink);
            }}>
            <a><IonLabel key={`${catalog.n}label` + index}>            
            {catalog.label}
            </IonLabel></a>
          </IonItem>
        );
      } else {
        routeLink = `${this.props.match.url}/work/${catalog.work}`;
        rows.push(
          <IonItem key={`${catalog.n}item` + index} button={true} onClick={async event => {
            event.preventDefault();
            await this.fetchWork(catalog.work);
           this.props.history.push(routeLink);
            }}>
            <a><IonLabel key={`${catalog.n}label` + index}>            
            {catalog.label}
            </IonLabel></a>
          </IonItem>
        );
      }
    });
    return (
      <>
        <IonRouterOutlet>
          <Route path={`${this.props.match.url}/:path`} render={props => <CatalogPage {...props} catalogs={this.catalogs} />} exact={true} />
          <Route path={`${this.props.match.url}/work/:path`} render={props => <WorkPage {...props} works={this.works} />} exact={true} />
        </IonRouterOutlet>
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonTitle>目錄</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
          <IonButton >
              <IonBackButton defaultHref='/' text="Back" icon="add" />
              </IonButton>
            <IonList>
              {rows}
            </IonList>
          </IonContent>
        </IonPage>
      </>
    );
  }
};

const mapStateToProps = (state /*, ownProps*/) => {
  return {
    counter: state.counter
  }
};

const mapDispatchToProps = {};

/*
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CatalogPage);
*/
export default CatalogPage;
