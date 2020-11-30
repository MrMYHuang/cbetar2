import React from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, withIonLifeCycle, IonButton, IonIcon, IonSearchbar, IonAlert, IonPopover, IonList, IonItem, IonLabel } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import Globals from '../Globals';
import { home, arrowBack, shareSocial, book, ellipsisHorizontal, ellipsisVertical } from 'ionicons/icons';
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
  search: [DictWordItem] | null;
  fetchError: boolean;
  showNoSelectedTextAlert: boolean;
  popover: any;
}

class _WordDictionaryPage extends React.Component<PageProps, State> {
  searchBarRef: React.RefObject<HTMLIonSearchbarElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      keyword: '',
      search: null,
      fetchError: false,
      showNoSelectedTextAlert: false,
      popover: {
        show: false,
        event: null,
      },
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
    try {
      const res = await Globals.axiosInstance.get(
        `https://www.moedict.tw/uni/${keyword.substring(0, 1)}`,
        {
          responseType: 'json',
        });
      this.setState({ search: res.data.heteronyms });
    } catch (e) {
      console.error(e);
      console.error(new Error().stack);
      this.setState({ fetchError: true });
      return false;
    }
  }

  getSelectedString() {
    const sel = document.getSelection();
    if ((sel?.rangeCount || 0) > 0 && sel!.getRangeAt(0).toString().length > 0) {
      return sel!.getRangeAt(0).toString();
    } else {
      return '';
    }
  }

  defToView(defs: Array<DictWordDefItem> | undefined, title: string) {
    return defs !== undefined && defs.length > 0 ? <>
      <div key={uuid.v4()} style={{ color: 'var(--ion-color-primary)' }}>{title}</div>
      <ol key={uuid.v4()}>{
        defs?.map((d) =>
          <li key={uuid.v4()}>
            <div key={uuid.v4()}>{d.def}</div>
            {d.quote?.map((q) => <div key={uuid.v4()}>{q}</div>)}
            {d.example?.map((e) => <div key={uuid.v4()}>{e}</div>)}
            {d.link?.map((l) => <div key={uuid.v4()}>{l}</div>)}
          </li>
        )}
      </ol>
    </> : <></>;
  }

  selectedTextBeforeIonPopover = '';
  render() {
    let dictView: any = [];
    if (this.props.match.params.keyword) {
      this.state.search?.forEach((data) => {
        const nouns = data?.definitions.filter((d) => d.type === WordType.NOUN);
        const verbs = data?.definitions.filter((d) => d.type === WordType.VERB);
        const others = data?.definitions.filter((d) => d.type === undefined);

        const nounsView = this.defToView(nouns, '名詞');
        const verbsView = this.defToView(verbs, '動詞');
        const othersView = this.defToView(others, '');

        dictView.push(
          <div key={uuid.v4()} className='textFont textSelectable'>
            <div key={uuid.v4()} className='textFontX3'>{this.props.match.params.keyword.substring(0, 1)}</div>
            {data?.bopomofo ? <div>注音：{data?.bopomofo}</div> : null}
            {data?.pinyin ? <div>拼音：{data?.pinyin}</div> : null}
            {nounsView}
            {verbsView}
            {othersView}
          </div>);
      });
    }

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonButton slot='start' onClick={ev => {
              this.props.history.push({
                pathname: `/dictionary/`,
              });
            }}>
              <span className='uiFont' style={{ color: 'var(--color)' }}>萌典字典</span>
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
              // Because after showing IonPopover, document.getSelection() changes.
              // Thus, we must capture the selected text in advance.
              this.selectedTextBeforeIonPopover = this.getSelectedString();
              this.setState({ popover: { show: true, event: e.nativeEvent } });
            }}>
              <IonIcon ios={ellipsisHorizontal} md={ellipsisVertical} slot='icon-only' />
            </IonButton>

            <IonPopover
              isOpen={this.state.popover.show}
              event={this.state.popover.event}
              onDidDismiss={e => {
                this.setState({ popover: { show: false, event: null } });
                this.selectedTextBeforeIonPopover = '';
              }}
            >
              <IonList>
                <IonItem button onClick={e => {
                  this.props.history.push(`/${this.props.match.params.tab}`);
                  this.setState({ popover: { show: false, event: null } });
                }}>
                  <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                  <IonIcon icon={home} slot='start' />
                  <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>回首頁</IonLabel>
                </IonItem>

                <IonItem button onClick={e => {
                  this.setState({ popover: { show: false, event: null } });
                  if (this.selectedTextBeforeIonPopover === '') {
                    this.setState({ showNoSelectedTextAlert: true });
                    return;
                  }

                  this.props.history.push({
                    pathname: `/dictionary/search/${this.selectedTextBeforeIonPopover}`,
                  });
                }}>
                  <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                  <IonIcon icon={book} slot='start' />
                  <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>查詞典</IonLabel>
                </IonItem>

                <IonItem button onClick={e => {
                  this.setState({ popover: { show: false, event: null } });
                  if (this.selectedTextBeforeIonPopover === '') {
                    this.setState({ showNoSelectedTextAlert: true });
                    return;
                  }

                  this.props.history.push({
                    pathname: `/dictionary/searchWord/${this.selectedTextBeforeIonPopover}`,
                  });
                }}>
                  <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                  <IonIcon icon={book} slot='start' />
                  <IonLabel className='ion-text-wrap' style={{ fontSize: 'var(--ui-font-size)' }}>查字典</IonLabel>
                </IonItem>
              </IonList>
            </IonPopover>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonSearchbar ref={this.searchBarRef} placeholder='請輸入字，再按鍵盤Enter鍵' value={this.state.keyword}
            onIonChange={ev => {
              this.setState({ keyword: ev.detail.value! })
            }}
            onIonClear={ev => {
              this.setState({ search: null });
            }}
            onKeyUp={ev => {
              if (ev.key === 'Enter') {
                this.props.history.push({
                  pathname: `/dictionary/searchWord/${this.state.keyword}`,
                });
              }
            }} />
          {/*
              <IonButton slot='end' size='large' style={{ fontSize: 'var(--ui-font-size)' }} onClick={e => {
                this.lookupDict(this.state.keyword);
              }}>搜尋</IonButton>*/}

          {this.state.fetchError ? Globals.fetchErrorContent : dictView}

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
