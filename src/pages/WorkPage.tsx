import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, withIonLifeCycle } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import axios from 'axios';
import './WorkPage.css';
import { Work } from '../models/Work';
import Globals from '../Globals';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
}> { }

const urlWork = `${Globals.cbetaApiUrl}/works?work=`;
class _WorkPage extends React.Component<PageProps> {
  constructor(props) {
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

  getRows() {
    let work = this.state.work as Work
    let rows = Array<object>();
    let juans = work.juan_list.split(',');
    for (let i = 0; i < juans.length; i++) {
      //if (work.nodeType == 'html')
      let routeLink = `/catalog/webview/${work.work}/${juans[i]}`;
      rows.push(
        <IonItem key={`juanItem` + i} button={true} onClick={async event => {
          event.preventDefault();
          this.props.history.push(routeLink);
        }}>
          <IonLabel style={{ fontSize: this.props.listFontSize }} key={`juanLabel` + i}>
            卷{juans[i]}
          </IonLabel>
        </IonItem>
      );
    }
    return rows;
  }

  //work = this.works[0] as Work;
  render() {
    let work = this.state.work as Work
    if (work == null) {
      return <IonPage></IonPage>
    }

    let rows = this.getRows();
    return (
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
    );
  }
};

const WorkPage = withIonLifeCycle(_WorkPage);

const mapStateToProps = (state /*, ownProps*/) => {
  return {
    listFontSize: state.settings.listFontSize,
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(WorkPage);
