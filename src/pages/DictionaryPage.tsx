import React from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, withIonLifeCycle, IonButton, IonIcon, IonSearchbar, IonAlert, IonPopover, IonList, IonItem, IonLabel, IonLoading, IonToast } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import Globals from '../Globals';
import { home, arrowBack, shareSocial, book, ellipsisHorizontal, ellipsisVertical, refreshCircle, copy } from 'ionicons/icons';
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
    this.setState({ isLoading: true });
    try {
      const res = await Globals.axiosInstance.get(
        `${Globals.dilaDictApiUrl}/?type=match&dicts=dila&term=${keyword}`,
        {
          responseType: 'json',
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
    let rows = Array<object>();
    data.forEach((item: DictItem, index: number) => {
      rows.push(
        <div style={{ display: 'table-row' }} key={`dictItem` + index}>
          <div className='tableCell'>
            <div className='ion-text-wrap textFont' style={{ color: 'var(--ion-color-primary)', paddingBottom: '18pt' }} dangerouslySetInnerHTML={{ __html: item.dict_name_zh }}></div>
            <div className='ion-text-wrap textFont' key={`dictItemLabel` + index} dangerouslySetInnerHTML={{ __html: item.desc }}>
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

            <IonButton slot='start' onClick={ev => {
              this.props.history.push({
                pathname: `/dictionary/searchWord/`,
              });
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
                  this.props.history.push(`/${this.props.match.params.tab}`);
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
          <IonSearchbar ref={this.searchBarRef} placeholder='請輸入字詞，再按鍵盤Enter鍵' value={this.state.keyword}
            onKeyUp={(ev: any) => {
              const value = ev.target.value;
              this.setState({ keyword: value })
              if (ev.key === 'Enter') {
                this.props.history.push(`/dictionary/search/${value}`);
              } else if (value === '') {
                this.setState({ searches: [] });
              }
            }} />
          {/*
              <IonButton slot='end' size='large' style={{ fontSize: 'var(--ui-font-size)' }} onClick={e => {
                this.lookupDict(this.state.keyword);
              }}>搜尋</IonButton>*/}

          {this.state.fetchError ?
            Globals.fetchErrorContent :
            <div style={{ display: 'table' }}>
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
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(DictionaryPage);
