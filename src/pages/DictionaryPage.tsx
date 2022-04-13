import React from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, withIonLifeCycle, IonButton, IonIcon, IonSearchbar, IonAlert, IonPopover, IonList, IonItem, IonLabel, IonLoading, IonToast } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import { home, shareSocial, book, ellipsisHorizontal, ellipsisVertical, refreshCircle, copy, arrowBack } from 'ionicons/icons';
import { DictItem } from '../models/DictItem';

interface Props {
  dispatch: Function;
  dictionaryHistory: Array<string>;
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
  popover: any;
  isLoading: boolean;
  fetchError: boolean;
  showToast: boolean;
  toastMessage: string;
}

class _DictionaryPage extends React.Component<PageProps, State> {
  searchBarRef: React.RefObject<HTMLIonSearchbarElement>;
  constructor(props: any) {
    super(props);
    this.state = {
      keyword: '',
      searches: [],
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
    this.searchBarRef = React.createRef<HTMLIonSearchbarElement>();
  }

  ionViewWillEnter() {
    //console.log(`${this.props.match.url} will enter`);
    this.setState({ keyword: this.props.match.params.keyword });
    if (this.props.match.params.keyword) {
      this.lookupDict(this.props.match.params.keyword);
    } else {
      this.setState({ searches: [] });
    }
  }

  /*
  componentDidMount() {
    //console.log(`did mount: ${this.props.match.url}`);
  }
  
  componentWillUnmount() {
    console.log(`${this.props.match.url} unmount`);
  }

  ionViewWillLeave() {
  }
  */

  get isTopPage() {
    return this.props.match.params.keyword === undefined;
  }

  async lookupDict(keyword: string) {
    this.setState({ isLoading: true });
    try {
      const res = await Globals.axiosInstance.get(
        `${Globals.dilaDictApiUrl}/?type=match&dicts=dila&term=${keyword}`,
        {
          responseType: 'json',
        });
      this.props.dictionaryHistory.unshift(keyword);
      this.props.dictionaryHistory.splice(10);
      this.props.dispatch({
        type: "SET_KEY_VAL",
        key: 'dictionaryHistory',
        val: this.props.dictionaryHistory,
      });
      this.setState({ fetchError: false, isLoading: false, searches: res.data });
    } catch (e) {
      console.error(e);
      console.error(new Error().stack);
      this.setState({ fetchError: true, isLoading: false });
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

  getRows() {
    const data = this.state.searches as [DictItem];
    let rows = Array<JSX.Element>();
    data.forEach((item: DictItem, index: number) => {
      rows.push(
        <div style={{ display: 'table-row' }} key={`dictItem` + index}>
          <div className='tableCell'>
            <div className='textFont' style={{ color: 'var(--ion-color-primary)', paddingBottom: '18pt' }} dangerouslySetInnerHTML={{ __html: item.dict_name_zh }}></div>
            <div className='textFont' style={{ padding: '0 5px', textAlign: 'justify', overflowWrap: 'normal' }} key={`dictItemLabel` + index} dangerouslySetInnerHTML={{ __html: item.desc }}>
            </div>
          </div>
        </div>
      );
    });
    return rows;
  }

  selectedTextBeforeIonPopover = '';
  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButton hidden={this.isTopPage} fill="clear" slot='start' onClick={e => this.props.history.goBack()}>
              <IonIcon icon={arrowBack} slot='icon-only' />
            </IonButton>

            <IonButton fill='outline' shape='round' slot='start' onClick={ev => {
              this.props.history.push(`/dictionary/searchWord`);
            }}>
              <span className='uiFont' style={{ color: 'var(--color)' }}>佛學詞典</span>
            </IonButton>

            <IonButton hidden={!this.state.fetchError} fill="clear" slot='end' onClick={e => this.lookupDict(this.props.match.params.keyword)}>
              <IonIcon icon={refreshCircle} slot='icon-only' />
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
                this.selectedTextBeforeIonPopover = '';
                this.setState({ popover: { show: false, event: null } });
              }}
            >
              <IonList>
                <IonItem button onClick={e => {
                  this.props.history.push(`/${this.props.match.params.tab}/search`);
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

                  this.props.history.push({
                    pathname: `/dictionary/search/${this.selectedTextBeforeIonPopover}`,
                  });
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
          <IonSearchbar ref={this.searchBarRef} placeholder='輸入後按 Enter' value={this.state.keyword}
            onIonClear={ev => {
              this.setState({ searches: [], keyword: '' });
            }}
            onKeyUp={(ev: any) => {
              const value = ev.target.value;
              if (value === '') {
                this.setState({ searches: [], keyword: value });
              } else if (ev.key === 'Enter') {
                if (value === this.props.match.params.keyword) {
                  this.setState({ keyword: value });
                  this.lookupDict(value);
                } else {
                  this.props.history.push(`/dictionary/search/${value}`);
                }
              }
            }} />
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
                  {this.props.dictionaryHistory.map((keyword, i) =>
                    <IonItem key={`dictHistoryItem_${i}`} button={true} onClick={async event => {
                      if (keyword === this.props.match.params.keyword) {
                        this.setState({ keyword });
                        this.lookupDict(keyword);
                      }
                      else {
                        this.props.history.push(`/dictionary/search/${keyword}`);
                      }
                    }}>
                      <IonLabel className='ion-text-wrap uiFont' key={`dictHistoryLabel_` + i}>
                        {keyword}
                      </IonLabel>
                    </IonItem>
                  )}
                </IonList>
                <div style={{ textAlign: 'center' }}>
                  <IonButton fill='outline' shape='round' size='large' onClick={e => {
                    this.setState({ keyword: '' });
                    this.props.dispatch({
                      type: "SET_KEY_VAL",
                      key: 'dictionaryHistory',
                      val: [],
                    });
                  }}>清除歷史</IonButton>
                </div>
              </>
              : this.state.searches.length === 0 && !this.state.isLoading ?
                Globals.searchNoResultMessage
                :
                <div style={{ display: 'table', tableLayout: 'fixed', width: '100%' }}>
                  {this.getRows()}
                </div>
          }

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
        </IonContent>
      </IonPage>
    );
  }
};

const DictionaryPage = withIonLifeCycle(_DictionaryPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    dictionaryHistory: state.settings.dictionaryHistory,
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(DictionaryPage);
