import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, withIonLifeCycle, IonButton, IonIcon, IonSearchbar } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import { home, arrowBack } from 'ionicons/icons';
import { DictItem } from '../models/DictItem';

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  keyword: string;
}> { }

interface State {
  keyword: string;
  searches: Array<DictItem>;
}

class _DictionaryPage extends React.Component<PageProps, State> {
  searchBarRef: React.RefObject<HTMLIonSearchbarElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      keyword: '',
      searches: [],
    }
    this.searchBarRef = React.createRef<HTMLIonSearchbarElement>();
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
    if (this.props.match.params.keyword) {
      this.setState({ keyword: this.props.match.params.keyword });
      this.lookupDict(this.props.match.params.keyword);
    }
  }

  ionViewWillLeave() {
  }

  get isTopPage() {
    return this.props.match.url === '/catalog';
  }

  async lookupDict(keyword: string) {
    const res = await Globals.axiosInstance.get(
      `${Globals.dilaDictApiUrl}/?type=match&dicts=dila&term=${keyword}`,
      {
        responseType: 'json',
      });
    this.setState({ searches: res.data });
  }

  getRows() {
    const data = this.state.searches as [DictItem];
    let rows = Array<object>();
    data.forEach((item: DictItem, index: number) => {
      rows.push(
        <IonItem key={`dictItem` + index}>
          <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
          <div>
            <div className='ion-text-wrap uiFont' style={{ color: 'var(--ion-color-primary)' }} dangerouslySetInnerHTML={{ __html: item.dict_name_zh }}></div>
            <div className='ion-text-wrap uiFont' key={`dictItemLabel` + index} dangerouslySetInnerHTML={{ __html: item.desc }}>
            </div>
          </div>
        </IonItem>
      );
    });
    return rows;
  }

  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>佛學詞典</IonTitle>
            <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>
            <IonButton fill="clear" slot='end' onClick={e => this.props.history.push(`/${this.props.match.params.tab}`)}>
              <IonIcon icon={home} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonItem>
              <IonSearchbar ref={this.searchBarRef} placeholder='請輸入字詞，再按鍵盤Enter鍵' value={this.state.keyword}
                onIonChange={ev => {
                  this.setState({ keyword: ev.detail.value! })
                }}
                onIonClear={ev => {
                  this.setState({ searches: [] });
                }}
                onKeyUp={ev => {
                  if (ev.key === 'Enter') {
                    this.lookupDict(this.state.keyword);
                  }
                }} />
                {/*
              <IonButton slot='end' size='large' style={{ fontSize: 'var(--ui-font-size)' }} onClick={e => {
                this.lookupDict(this.state.keyword);
              }}>搜尋</IonButton>*/}
            </IonItem>
            {this.getRows()}
          </IonList>
          <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}><a href="https://github.com/MrMYHuang/cbetar2#dictionary" target="_new">佛學詞典說明</a></div>
        </IonContent>
      </IonPage>
    );
  }
};

const DictionaryPage = withIonLifeCycle(_DictionaryPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(DictionaryPage);
