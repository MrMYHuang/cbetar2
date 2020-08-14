import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonRouterOutlet, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps, Route } from 'react-router-dom';
import axios from 'axios';
import './WorkPage.css';
import { Work } from '../models/Work';
import Globals from '../Globals';
import WebViewPage from './WebViewPage';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
}> { }

const url = `${Globals.cbetaApiUrl}/juans?edition=CBETA`;
const urlWork = `${Globals.cbetaApiUrl}/works?work=`;
class _WorkPage extends React.Component<PageProps> {
  constructor(props) {
    super(props);
    this.state = {
      work: null,
    }
  }

  ionViewWillEnter() {
    console.log( 'view will enter' );
    this.fetchWork(this.props.match.params.path);
  }

  async fetchWork(path: string) {
      //try {
      const res = await axios.get(urlWork + path, {
        responseType: 'arraybuffer',
      });
      const data = JSON.parse(new Buffer(res.data).toString());
      const works = data.results as [Work];
    
      this.setState({work: works[0]});
      return true;

    /*data..forEach((element) {
      works.add(Work.fromJson(element));
    });
  } catch (e) {
    fetchFail = true;
  }*/
  }

  htmlStr = '';
  async fetchData(path: string) {
    //try {
    const res = await axios.get(`${url}&work=${this.props.match.params.path}&juan=${path}`, {
      responseType: 'arraybuffer',
    });
    let data = JSON.parse(new Buffer(res.data).toString());
    this.htmlStr = data.results[0];

    return true;

    /*data..forEach((element) {
      catalogs.add(Catalog.fromJson(element));
    });
  } catch (e) {
    fetchFail = true;
  }*/
  }

  //work = this.works[0] as Work;
  render() {
    if (this.state.work == null) {
      return <IonPage></IonPage>
    }
    let rows = Array<object>();
    let juans = this.state.work.juan_list.split(',');
    for (let i = 0; i < juans.length; i++) {
      //if (work.nodeType == 'html')
      let routeLink = `${this.props.match.url}/webview/${juans[i]}`;
      rows.push(
        <IonItem key={`juanItem` + i} button={true} onClick={async event => {
          event.preventDefault();
          await this.fetchData(juans[i]);
          this.props.history.push(routeLink);
        }}>
          <a><IonLabel key={`juanLabel` + i}>
            卷{juans[i]}
          </IonLabel></a>
        </IonItem>
      );
    }
    return (
      <>
        <IonRouterOutlet>
          <Route path={`${this.props.match.url}/webview/:path`} render={props => <WebViewPage {...props} workTitle={this.work.title} htmlStr={this.htmlStr} />} exact={true} />
        </IonRouterOutlet>
        <IonPage>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{this.state.work.title}</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              {rows}
            </IonList>
          </IonContent>
        </IonPage>
      </>
    );
  }
};

const WorkPage = withIonLifeCycle(_WorkPage);
export default WorkPage;
