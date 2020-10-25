import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, withIonLifeCycle, IonButton, IonIcon, IonSearchbar, IonAlert } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import { home, arrowBack, shareSocial, book } from 'ionicons/icons';
import { DictItem } from '../models/DictItem';

interface Props {
  dispatch: Function;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  keyword: string;
}> { }

interface State {
  keyword: string;
  searches: Array<DictItem>;
  showNoSelectedTextAlert: boolean;
}

class _DictionaryPage extends React.Component<PageProps, State> {
  searchBarRef: React.RefObject<HTMLIonSearchbarElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      keyword: '',
      searches: [],
      showNoSelectedTextAlert: false,
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
    return this.props.match.url === `/${this.props.match.params.tab}`;
  }

  async lookupDict(keyword: string) {
    const res = await Globals.axiosInstance.get(
      `${Globals.dilaDictApiUrl}/?type=match&dicts=dila&term=${keyword}`,
      {
        responseType: 'json',
      });
    this.setState({ searches: res.data });
  }

  getSelectedString() {
    const sel = document.getSelection();
    if ((sel?.rangeCount || 0) > 0 && sel!.getRangeAt(0).toString().length > 0) {
      return sel!.getRangeAt(0).toString();
    } else {
      return '';
    }
  }

  getRows() {
    const data = this.state.searches as [DictItem];
    let rows = Array<object>();
    data.forEach((item: DictItem, index: number) => {
      rows.push(
        <div style={{display: 'table-row'}} key={`dictItem` + index}>
          <div className='tableCell'>
            <div className='ion-text-wrap uiFont' style={{ color: 'var(--ion-color-primary)', paddingBottom: '18pt' }} dangerouslySetInnerHTML={{ __html: item.dict_name_zh }}></div>
            <div className='ion-text-wrap uiFont textSelectable' key={`dictItemLabel` + index} dangerouslySetInnerHTML={{ __html: item.desc }}>
            </div>
          </div>
        </div>
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

            <IonButton fill="clear" slot='end' onClick={e => {
                const selectedText = this.getSelectedString();
                if (selectedText === '') {
                  this.setState({ showNoSelectedTextAlert: true });
                  return;
                }

                this.props.history.push({
                  pathname: `/dictionary/search/${selectedText}`,
                });
              }}>
                <IonIcon icon={book} slot='icon-only' />
              </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonSearchbar ref={this.searchBarRef} placeholder='請輸入字詞，再按鍵盤Enter鍵' value={this.state.keyword}
            onIonChange={ev => {
              this.setState({ keyword: ev.detail.value! })
            }}
            onIonClear={ev => {
              this.setState({ searches: [] });
            }}
            onKeyUp={ev => {
              if (ev.key === 'Enter') {
                this.props.history.push({
                  pathname: `/dictionary/search/${this.state.keyword}`,
                });
              }
            }} />
          {/*
              <IonButton slot='end' size='large' style={{ fontSize: 'var(--ui-font-size)' }} onClick={e => {
                this.lookupDict(this.state.keyword);
              }}>搜尋</IonButton>*/}
          <div style={{display: 'table'}}>
            {this.getRows()}
          </div>
          <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}><a href="https://github.com/MrMYHuang/cbetar2#dictionary" target="_new">佛學詞典說明</a></div>

          <IonAlert
            cssClass='uiFont'
            isOpen={this.state.showNoSelectedTextAlert}
            backdropDismiss={false}
            header='失敗'
            message='請確認是否已選擇一段文字，然後再執行所選的功能!'
            buttons={[
              {
                text: '確定',
                cssClass: 'primary uiFont',
                handler: (value) => {
                  this.setState({
                    showNoSelectedTextAlert: false,
                  });
                },
              }
            ]}
          />
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
