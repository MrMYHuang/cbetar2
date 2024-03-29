import React from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, withIonLifeCycle, IonButton, IonIcon, IonSearchbar, IonAlert, IonPopover, IonList, IonItem, IonLabel, IonLoading, IonToast, IonInput } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import Globals from '../Globals';
import { home, shareSocial, book, ellipsisHorizontal, ellipsisVertical, refreshCircle, copy, arrowBack, search } from 'ionicons/icons';
import { DictWordDefItem, DictWordItem, WordType } from '../models/DictWordItem';
import { AxiosError } from 'axios';

interface Props {
  dispatch: Function;
  wordDictionaryHistory: Array<string>;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
  keyword: string;
}> { }

interface State {
  keyword: string;
  search: Array<DictWordItem> | null;
  showNoSelectedTextAlert: boolean;
  popover: any;
  isLoading: boolean;
  fetchError: boolean;
  showToast: boolean;
  toastMessage: string;
}

class _WordDictionaryPage extends React.Component<PageProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      keyword: '',
      search: null,
      showNoSelectedTextAlert: false,
      popover: {
        show: false,
        event: null,
      },
      isLoading: false,
      fetchError: false,
      showToast: false,
      toastMessage: '',
    }
  }

  ionViewWillEnter() {
    //console.log( 'view will enter' );
    //console.log(this.props.match.url);
    //console.log(this.props.history.length);
    if (this.props.match.params.keyword) {
      this.setState({ keyword: this.props.match.params.keyword }, () => {
        this.lookupDict(this.props.match.params.keyword);
      });
    }
  }

  componentDidMount() {
    //console.log(`did mount: ${this.props.match.url}`);
  }

  ionViewWillLeave() {
  }

  get isTopPage() {
    return this.props.match.url === `/${this.props.match.params.tab}`;
  }

  async lookupDict(keyword: string) {
    this.setState({ isLoading: true });
    try {
      const res = await Globals.axiosInstance.get(
        `https://www.moedict.tw/uni/${keyword.substring(0, 1)}`,
        {
          responseType: 'json',
        });
      let wordDictionaryHistory = JSON.parse(JSON.stringify(this.props.wordDictionaryHistory));
      wordDictionaryHistory.unshift(keyword);
      wordDictionaryHistory.splice(10);
      this.props.dispatch({
        type: "SET_KEY_VAL",
        key: 'wordDictionaryHistory',
        val: wordDictionaryHistory,
      });
      this.setState({ fetchError: false, isLoading: false, search: res.data.heteronyms });
    } catch (e) {
      const err = e as AxiosError;
      if (err.response?.status === 404) {
        this.setState({ fetchError: false, isLoading: false, search: [] });
      } else {
        console.error(e);
        console.error(new Error().stack);
        this.setState({ fetchError: true, isLoading: false });
      }
      return false;
    }
  }

  clickToSearch() {
    if (this.state.keyword === this.props.match.params.keyword) {
      this.lookupDict(this.state.keyword);
    } else {
      this.props.history.push(`/dictionary/searchWord/${this.state.keyword}`);
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
          <div key={uuid.v4()} className='textFont textSelectable' style={{ padding: '0 5px' }}>
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
            <IonButton fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonButton fill='outline' shape='round' slot='start' onClick={ev => {
              this.props.history.push(`/dictionary/search`);
            }}>
              <span className='uiFont'>萌典字典</span>
            </IonButton>

            <IonButton hidden={!this.state.fetchError} fill="clear" slot='end' onClick={e => this.lookupDict(this.props.match.params.keyword)}>
              <IonIcon icon={refreshCircle} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onClick={e => Globals.shareByLink(this.props.dispatch)}>
              <IonIcon icon={shareSocial} slot='icon-only' />
            </IonButton>

            <IonButton fill="clear" slot='end' onPointerDown={e => {
              // Because after showing IonPopover, document.getSelection() changes.
              // Thus, we must capture the selected text in advance.
              this.selectedTextBeforeIonPopover = this.getSelectedString();
            }}
              onClick={e => {
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
                  this.props.history.push(`/${this.props.match.params.tab}/searchWord`);
                  this.setState({ popover: { show: false, event: null } });
                }}>
                  <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                  <IonIcon icon={home} slot='start' />
                  <IonLabel className='ion-text-wrap uiFont'>回首頁</IonLabel>
                </IonItem>

                <IonItem button onClick={e => {
                  this.setState({ popover: { show: false, event: null } });
                  Globals.copyToClipboard(this.selectedTextBeforeIonPopover);
                  this.setState({ showToast: true, toastMessage: `複製文字成功` });
                }}>
                  <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                  <IonIcon icon={copy} slot='start' />
                  <IonLabel className='ion-text-wrap uiFont'>複製文字</IonLabel>
                </IonItem>

                <IonItem button onClick={e => {
                  this.setState({ popover: { show: false, event: null } });
                  if (this.selectedTextBeforeIonPopover === '') {
                    this.setState({ showNoSelectedTextAlert: true });
                    return;
                  }

                  this.props.history.push(`/dictionary/search/${this.selectedTextBeforeIonPopover}`);
                }}>
                  <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
                  <IonIcon icon={book} slot='start' />
                  <IonLabel className='ion-text-wrap uiFont'>查詞典</IonLabel>
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
                  <IonLabel className='ion-text-wrap uiFont'>查字典</IonLabel>
                </IonItem>
              </IonList>
            </IonPopover>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <IonInput className='uiFont' placeholder='輸入後，按搜尋' value={this.state.keyword}
                clearInput={(this.state.keyword?.length || 0) > 0}
                onKeyUp={(ev: any) => {
                  const value = ev.target.value;
                  this.setState({ keyword: value }, () => {
                    if (ev.key === 'Enter') {
                      this.clickToSearch();
                    }
                  });
                }}
                onIonChange={ev => {
                  const value = `${ev.target.value || ''}`;
                  this.setState({ keyword: value }, () => {
                    if (value === '') {
                      this.props.history.push({
                        pathname: `${Globals.pwaUrl}/dictionary/searchWord`,
                      });
                    }
                  });
                }}
              />
              <IonButton fill='outline' size='large' onClick={() => {
                this.clickToSearch();
              }}>
                <IonIcon slot='icon-only' icon={search} />
              </IonButton>
            </div>

            {/*
              <IonButton slot='end' size='large' className='uiFont' onClick={e => {
                this.lookupDict(this.state.keyword);
              }}>搜尋</IonButton>*/}

            {this.state.fetchError ?
              Globals.fetchErrorContent
              :
              (this.state.keyword === '' || this.state.keyword === undefined) ?
                <>
                  <div className='uiFont' style={{ color: 'var(--ion-color-primary)' }}>搜尋歷史</div>
                  <IonList>
                    {this.props.wordDictionaryHistory.map((keyword, i) =>
                      <IonItem key={`wordDictHistoryItem_${i}`} button={true} onClick={async event => {
                        if (keyword === this.props.match.params.keyword) {
                          this.setState({ keyword });
                          this.lookupDict(keyword);
                        }
                        else {
                          this.props.history.push(`/dictionary/searchWord/${keyword}`);
                        }
                      }}>
                        <IonLabel className='ion-text-wrap uiFont' key={`wordDictHistoryLabel_` + i}>
                          {keyword}
                        </IonLabel>
                      </IonItem>
                    )}
                  </IonList>
                  <div style={{ textAlign: 'center' }}>
                    <IonButton fill='outline' shape='round' size='large' className='uiFont' onClick={e => {
                      this.setState({ keyword: '' });
                      this.props.dispatch({
                        type: "SET_KEY_VAL",
                        key: 'wordDictionaryHistory',
                        val: [],
                      });
                    }}>清除歷史</IonButton>
                  </div>
                </>
                : (this.state.search?.length || 0) === 0 && !this.state.isLoading ?
                  Globals.searchNoResultMessage
                  :
                  dictView}

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

            <IonLoading
              cssClass='uiFont'
              isOpen={this.state.isLoading}
              onDidDismiss={() => this.setState({ isLoading: false })}
              message={'載入中...'}
            />

            <IonToast
              cssClass='uiFont'
              isOpen={this.state.showToast}
              onDidDismiss={() => this.setState({ showToast: false })}
              message={this.state.toastMessage}
              duration={2000}
            />
          </div>
        </IonContent>
      </IonPage>
    );
  }
};

const WordDictionaryPage = withIonLifeCycle(_WordDictionaryPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    wordDictionaryHistory: state.settings.wordDictionaryHistory,
  };
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(WordDictionaryPage);
