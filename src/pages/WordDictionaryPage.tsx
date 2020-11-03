import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, withIonLifeCycle, IonButton, IonIcon, IonSearchbar, IonAlert } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import { home, arrowBack, shareSocial, book } from 'ionicons/icons';
import { DictWordDefItem, DictWordItem, WordType } from '../models/DictWordItem';

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
  search: DictWordItem | null;
  showNoSelectedTextAlert: boolean;
}

class _WordDictionaryPage extends React.Component<PageProps, State> {
  searchBarRef: React.RefObject<HTMLIonSearchbarElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      keyword: '',
      search: null,
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
      `https://www.moedict.tw/uni/${keyword.substring(0, 1)}`,
      {
        responseType: 'json',
      });
    this.setState({ search: res.data.heteronyms[0] });
  }

  getSelectedString() {
    const sel = document.getSelection();
    if ((sel?.rangeCount || 0) > 0 && sel!.getRangeAt(0).toString().length > 0) {
      return sel!.getRangeAt(0).toString();
    } else {
      return '';
    }
  }

  defToView(defs: Array<DictWordDefItem> | undefined) {
    return defs?.map((d) =>
      <li>
        <div>{d.def}</div>
        {d.quote?.map((q) => <div>{q}</div>)}
        {d.example?.map((e) => <div>{e}</div>)}
        {d.link?.map((l) => <div>{l}</div>)}
      </li>
    );
  }

  render() {
    const data = this.state.search;
    const nouns = data?.definitions.filter((d) => d.type === WordType.NOUN);
    const verbs = data?.definitions.filter((d) => d.type === WordType.VERB);

    const nounsView = this.defToView(nouns);
    const verbsView = this.defToView(verbs);

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontSize: 'var(--ui-font-size)' }}>萌典字典</IonTitle>
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
                pathname: `/WordDictionary/search/${selectedText}`,
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
              this.setState({ search: null });
            }}
            onKeyUp={ev => {
              if (ev.key === 'Enter') {
                this.props.history.push({
                  pathname: `/WordDictionary/search/${this.state.keyword}`,
                });
              }
            }} />
          {/*
              <IonButton slot='end' size='large' style={{ fontSize: 'var(--ui-font-size)' }} onClick={e => {
                this.lookupDict(this.state.keyword);
              }}>搜尋</IonButton>*/}
          <div className='uiFont' style={{ display: 'table' }}>
            <div className='uiFontLarge'>{this.props.match.params.keyword.substring(0, 1)}</div>
            
            {data?.bopomofo}
            <div style={{color: 'var(--ion-color-primary)'}}>名詞</div>
            <ol>
              {nounsView}
            </ol>
            <div style={{color: 'var(--ion-color-primary)'}}>動詞</div>
            <ol>
              {verbsView}
            </ol>
          </div>
          {/*
          <div style={{ fontSize: 'var(--ui-font-size)', textAlign: 'center' }}><a href="https://github.com/MrMYHuang/cbetar2#WordDictionary" target="_new">佛學詞典說明</a></div>
          */}

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

const WordDictionaryPage = withIonLifeCycle(_WordDictionaryPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(WordDictionaryPage);
