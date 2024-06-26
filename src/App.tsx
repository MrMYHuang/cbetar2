import React from 'react';
import { Redirect, Route, RouteComponentProps, withRouter } from 'react-router-dom';
import {
  setupIonicReact,
  IonApp,
  IonIcon,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonAlert,
  isPlatform,
  IonToast,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { connect, Provider } from 'react-redux';
import queryString from 'query-string';
import { bookmark, settings, library, book } from 'ionicons/icons';
import * as semver from 'semver';

import CatalogPage from './pages/CatalogPage';
import WorkPage from './pages/WorkPage';
import EPubViewPage from './pages/EPubViewPage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import SettingsPage from './pages/SettingsPage';
import BookmarkPage from './pages/BookmarkPage';
import SearchPage from './pages/SearchPage';
import Globals from './Globals';
import DictionaryPage from './pages/DictionaryPage';
import FullTextSearchPage from './pages/FullTextSearchPage';
import ShareTextModal from './components/ShareTextModal';
import WordDictionaryPage from './pages/WordDictionaryPage';
import DownloadModal from './components/DownloadModal';
import { TmpSettings } from './models/TmpSettings';
import { CbetaDbMode, Settings, UiMode } from './models/Settings';
import CbetaOfflineDb from './CbetaOfflineDb';
import IndexedDbFuncs from './IndexedDbFuncs';
import CatalogDesktopPage from './pages/CatalogDesktopPage';

const electronBackendApi: any = (window as any).electronBackendApi;
/*
class DebugRouter extends IonReactRouter {
  constructor(props: any) {
    super(props);
    console.log('initial history is: ', JSON.stringify(this.history, null, 2))
    this.history.listen((location, action) => {
      console.log(
        `The current URL is ${location.pathname}${location.search}${location.hash}`
      )
      console.log(`The last navigation action was ${action}`, JSON.stringify(this.history, null, 2));
    });
  }
}
*/

setupIonicReact({
  mode: 'md', // Use a consistent UI style across Android and iOS.
  swipeBackEnabled: false,
});

export var serviceWorkCallbacks = {
  onLoad: function (registration: ServiceWorkerRegistration) { },
  onSuccess: function (registration: ServiceWorkerRegistration) { },
  onUpdate: function (registration: ServiceWorkerRegistration) { },
};

interface Props {
  dispatch: Function;
  tmpSettings: TmpSettings;
  settings: Settings;
}

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
}> { }

interface AppOrigProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
}> { }

interface State {
  windowInnerHeight: number | null;
  showToast: boolean;
  toastMessage: string;
  showUpdateAlert: boolean;
  showRestoreAppSettingsToast: boolean;
  downloadModal: any;
}

const store = Globals.store;
class _App extends React.Component<PageProps> {
  render() {
    return (
      <Provider store={store}>
        <AppOrig {...this.props} />
      </Provider>
    );
  }
}

class _AppOrig extends React.Component<AppOrigProps, State> {
  originalAppSettingsStr: string | null | undefined;
  routes: React.ReactNode;

  constructor(props: any) {
    super(props);

    if (!this.props.settings.hasAppLog) {
      Globals.disableAppLog();
    }

    // Unfortunately, using dynamically generated routes by JS interpolation (double curly braces) causes strange  component remounting problems. Thus, using the following generated static routes to work around the problems.
    if (this.props.settings.uiMode === UiMode.Touch) {
      this.routes =
        <IonRouterOutlet id='ionRouterOutlet' animated={false}>
          {/* The following route is for backward compatibility. */}
          <Route path={`/:tab(catalog)/webview/:path/:juan/:label`} render={(props: any) => <EPubViewPage {...props} />} exact={true} />
          {/* The following route is for backward compatibility. */}
          <Route path={`/:tab(catalog)/work/:path/:label`} render={(props: any) => <WorkPage {...props} />} exact={true} />
          {/* The following route is for backward compatibility. */}
          <Route path={`/:tab(catalog)/catalog/:path/:label`} render={(props: any) => <CatalogPage {...props} />} exact={true} />
          <Route path={`/:tab(catalog)`} render={(props: any) => <CatalogPage {...props} />} exact={true} />
          <Route path={`/:tab(catalog)/:type(catalog|volumes|famous)/:path?`} render={(props: any) => <CatalogPage {...props} />} exact={true} />
          <Route path={`/:tab(catalog)/:type(work)/:path`} render={(props: any) => <WorkPage {...props} />} exact={true} />
          <Route path={`/:tab(catalog)/:type(juan)/:path/:juan`} render={(props: any) => <EPubViewPage {...props} />} exact={true} />
          <Route path={`/:tab(bookmarks)`} render={(props: any) => <BookmarkPage {...props} />} exact={true} />
          <Route path={`/:tab(dictionary)/search/:keyword?`} render={(props: any) => <DictionaryPage {...props} />} exact={true} />
          <Route path={`/:tab(dictionary)/searchWord/:keyword?`} render={(props: any) => <WordDictionaryPage {...props} />} exact={true} />
          <Route path={`/:tab(catalog)/search/:keyword?`} render={props => <SearchPage {...props} />} exact={true} />
          <Route path={`/:tab(catalog)/fulltextsearch/:keyword?`} render={props => <FullTextSearchPage {...props} />} exact={true} />
          <Route path={`/settings`} render={(props: any) => <SettingsPage {...props} />} />
          <Route path={`/`} render={() => { return this.routeByQueryString(); }} exact={true} />
        </IonRouterOutlet>;
    } else {
      this.routes =
        <IonRouterOutlet id='ionRouterOutlet' animated={false}>
          {/* The following route is for backward compatibility. */}
          <Route path={`/:tab(catalog)/webview/:path/:juan/:label`} render={(props: any) => <EPubViewPage {...props} />} exact={true} />
          {/* The following route is for backward compatibility. */}
          <Route path={`/:tab(catalog)/work/:path/:label`} render={(props: any) => <WorkPage {...props} />} exact={true} />
          {/* The following route is for backward compatibility. */}
          <Route path={`/:tab(catalog)/catalog/:path/:label`} render={(props: any) => <CatalogPage {...props} />} exact={true} />
          <Route path={`/:tab(catalog)/:type(catalog|work|juan|volumes|famous)?/:path?/:juan?`} render={(props: any) => <CatalogDesktopPage {...props} />} exact={true} />
          <Route path={`/:tab(bookmarks)`} render={(props: any) => <BookmarkPage {...props} />} exact={true} />
          <Route path={`/:tab(dictionary)/search/:keyword?`} render={(props: any) => <DictionaryPage {...props} />} exact={true} />
          <Route path={`/:tab(dictionary)/searchWord/:keyword?`} render={(props: any) => <WordDictionaryPage {...props} />} exact={true} />
          <Route path={`/:tab(catalog)/search/:keyword?`} render={props => <SearchPage {...props} />} exact={true} />
          <Route path={`/:tab(catalog)/fulltextsearch/:keyword?`} render={props => <FullTextSearchPage {...props} />} exact={true} />
          <Route path={`/settings`} render={(props: any) => <SettingsPage {...props} />} />
          <Route path={`/`} render={() => { return this.routeByQueryString(); }} exact={true} />
        </IonRouterOutlet>;
    }

    let updateCbetaBookcaseProcessingAssets = Promise.resolve();
    if (this.props.settings.cbetaBookcaseProcessingAssetsVersion < Globals.cbetaBookcaseProcessingAssetsVersion) {
      updateCbetaBookcaseProcessingAssets = Globals.downloadCbetaBookcaseAssets().then(async () => {
        this.props.dispatch({
          type: "SET_KEY_VAL",
          key: 'cbetaBookcaseProcessingAssetsVersion',
          val: Globals.cbetaBookcaseProcessingAssetsVersion,
        });

        // Remove for updating bookcaseInfos.
        try {
          await IndexedDbFuncs.removeFile(CbetaOfflineDb.bookcaseInfosKey);
        } catch (error) {
          console.error(error);
        }
      });
    }
    updateCbetaBookcaseProcessingAssets.then(() => {
      if (this.props.settings.cbetaOfflineDbMode !== CbetaDbMode.Online) {
        CbetaOfflineDb.init(CbetaDbMode.OfflineIndexedDb);
      }
    }).catch((error) => {
      console.error(error);
    });

    electronBackendApi?.receive("fromMain", async (data: any) => {
      switch (data.event) {
        case 'version':
          // Backend is ready.
          this.props.dispatch({
            type: "TMP_SET_KEY_VAL",
            key: 'mainVersion',
            val: data.version,
          });
          CbetaOfflineDb.setOfflineFileSystemV2Ready();
          break;
        case 'cbetaOfflineDbMode':
          let dbMode = CbetaDbMode.Online;
          if (data.isOn) {
            try {
              try {
                await IndexedDbFuncs.checkKey(`/${Globals.cbetar2AssetDir}/tei.xsl`);
              } catch (error) {
                await Globals.downloadCbetaBookcaseAssets();
              }
            } catch (error) {
              await CbetaOfflineDb.electronBackendApi.invoke('toMainV3', { event: 'disableBookcase' });
              this.setState({ showToast: true, toastMessage: `離線 CBETA Bookcase 異常，請重新設定載入！` });
              this.props.dispatch({
                type: "SET_KEY_VAL",
                key: 'cbetaOfflineDbMode',
                val: CbetaDbMode.Online,
              });
              break;
            }

            if (semver.gte(data.backendVersion, '21.0.0')) {
              dbMode = CbetaDbMode.OfflineFileSystemV3;
              CbetaOfflineDb.init(dbMode);
            } else if (semver.gte(data.backendVersion, '20.0.0')) {
              dbMode = CbetaDbMode.OfflineFileSystemV2;
              CbetaOfflineDb.init(dbMode);
            } else {
              dbMode = CbetaDbMode.OfflineFileSystem;
            }

          }
          this.props.dispatch({
            type: "SET_KEY_VAL",
            key: 'cbetaOfflineDbMode',
            val: dbMode,
          });
          break;
        case 'DownloadingBackend':
          this.setState({ downloadModal: { show: true, progress: data.progress / 100 } });
          break;
        case 'DownloadingBackendDone':
          this.setState({ downloadModal: { show: false, progress: this.state.downloadModal.progress } });
          break;
      }
    });
    electronBackendApi?.send("toMain", { event: 'ready' });

    // Disable browser callout.
    if (isPlatform('android')) {
      window.oncontextmenu = Globals.disableAndroidChromeCallout;
    } else if (isPlatform('ios')) {
      document.ontouchend = Globals.disableIosSafariCallout.bind(window);
    }
    // Update IonApp height after screen rotation.
    if (Globals.isTouchDevice()) {
      window.onorientationchange = (event) => {
        this.setState({ windowInnerHeight: null }, () => {
          setTimeout(() => {
            this.setState({ windowInnerHeight: window.innerHeight }, () => {
            });
          }, 500);
        });
      }
    }

    // ----- Initializing UI settings -----
    // Apply the theme setting.
    while (document.body.classList.length > 0) {
      document.body.classList.remove(document.body.classList.item(0)!);
    }
    document.body.classList.toggle(`theme${this.props.settings.theme}`, true);
    document.body.classList.toggle(`print${this.props.settings.printStyle}`, true);

    // Modify UI settings from query string.
    const queryParams = queryString.parse(this.props.location.search) as any;
    if (queryParams.settings) {
      this.originalAppSettingsStr = localStorage.getItem(Globals.storeFile);
      (queryParams.settings as string).split(',').forEach(setting => {
        const keyVal = setting.split('=');
        this.props.dispatch({
          type: "SET_KEY_VAL",
          key: keyVal[0],
          val: +keyVal[1],
        });
      });
    }
    Globals.updateCssVars(this.props.settings);

    let showToastInit = false;
    let toastMessageInit = '';
    IndexedDbFuncs.open().then(() => {
      if (Globals.twKaiFontNeedUpgrade() && this.props.settings.useFontKai) {
        this.props.dispatch({
          type: "SET_KEY_VAL",
          key: 'useFontKai',
          val: false
        });
        localStorage.setItem('twKaiFontVersion', "0");
        let settingsTemp = this.props.settings;
        settingsTemp.useFontKai = false;
        Globals.updateCssVars(settingsTemp);

        showToastInit = true;
        toastMessageInit = '楷書字型已更新，請至設定頁開啟楷書！';
      } else if (this.props.settings.useFontKai) {
        Globals.loadTwKaiFonts();
      }
    });

    this.state = {
      // Work around a window.innerHeight update problem on Android 9.
      // For example, when this app switches off full screen mode,
      // there is a race condition between update of window.innerHeight and render of this component.
      // If render is faster, we get a wrong innerHeight.
      // Thus, we save the correct innerHeight to this variable for switching off full screen mode.
      windowInnerHeight: null,
      showUpdateAlert: false,
      showRestoreAppSettingsToast: (queryParams.settings != null && this.originalAppSettingsStr != null) || false,
      showToast: showToastInit,
      toastMessage: toastMessageInit,
      downloadModal: { progress: 0, show: false }
    };

    // Work around the correct innerHeight problem on Android by using delayed update.
    setTimeout(() => {
      if (this.state.windowInnerHeight !== window.innerHeight) {
        this.setState({ windowInnerHeight: window.innerHeight });
      }
    }, 500);

    serviceWorkCallbacks.onLoad = (registration: ServiceWorkerRegistration) => {
      if (registration.installing || registration.waiting) {
        this.setState({ showUpdateAlert: true });
      }
    };

    serviceWorkCallbacks.onUpdate = (registration: ServiceWorkerRegistration) => {
      this.setState({ showUpdateAlert: true });
    };

    serviceWorkCallbacks.onSuccess = (registration: ServiceWorkerRegistration) => {
    };

    // Preload speechSynthesis.
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.getVoices();
      speechSynthesis.cancel();
    }

    // Enable screen wake lock.
    if ((navigator as any).wakeLock) {
      this.wakeLockScreen();
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === 'visible') {
          this.wakeLockScreen();
        } else {
          this.wakeLockScreenRelease()
        }
      });
    }
  }

  restoreAppSettings() {
    localStorage.setItem(Globals.storeFile, this.originalAppSettingsStr!);
    this.props.dispatch({ type: 'LOAD_SETTINGS' })
  }

  // Prevent device from sleeping.
  wakeLock: any;
  async wakeLockScreen() {
    try {
      const wakeLock = (navigator as any).wakeLock;
      if (wakeLock != null) {
        this.wakeLock = await wakeLock.request('screen');
        console.log('Screen wake lock is requested.');
      } else {
        console.error('navigator.wakeLock is undefined.');
      }
    } catch (err: any) {
      // the wake lock request fails - usually system related, such low as battery
      console.log(`${err.name}, ${err.message}`);
      console.log(new Error().stack);
    }
  }

  async wakeLockScreenRelease() {
    if (this.wakeLock != null) {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('Screen wake lock is released.');
    }
  }

  routeByQueryString() {
    // This app uses client side routing. 
    // Without the first loading of this app,
    // any client side route becomes a server side route!
    // These invalid server side routings cause 404 errors.
    // To workaround these errors, we can use GitHub 404.html redirection
    // to pass the client side routes to this app by using query string.
    // After this app loads, it can use the query string to correctly redirect to
    // a client side route!
    console.log(`path: ${window.location.pathname}, search ${window.location.search}`);
    const routeMatches = /route=([^&]*)/.exec(window.location.search);
    const queryMatches = /query=([^&]*)/.exec(window.location.search);
    if (routeMatches !== null) {
      let query = ''
      if (queryMatches !== null) {
        query = decodeURIComponent(queryMatches[1]);
      }
      return <Redirect to={`${Globals.pwaUrl}` + routeMatches[1] + query} />;
    } else if (window.location.pathname === `${Globals.pwaUrl}/` || window.location.pathname === `${Globals.pwaUrl}` || window.location.pathname === ``) {
      return <Redirect to={`/bookmarks`} />;
    }
  }

  render() {
    return (
      <IonApp style={
        // Without this, window height shrinks after Android soft keyboard poping up.
        (Globals.isTouchDevice() && this.state.windowInnerHeight && !this.props.tmpSettings.fullScreen) ? { height: `${this.state.windowInnerHeight}px` } : {}
      }>
        <IonReactRouter basename={Globals.pwaUrl}>
          <IonTabs>
            {this.routes}
            <IonTabBar hidden={this.props.tmpSettings.fullScreen} slot="bottom">
              <IonTabButton tab="bookmarks" href={`/bookmarks`}>
                <IonIcon icon={bookmark} />
              </IonTabButton>
              <IonTabButton tab="catalog" href={`/catalog`}>
                <IonIcon icon={library} />
              </IonTabButton>
              <IonTabButton tab="dictionay" href={`/dictionary/search`}>
                <IonIcon icon={book} />
              </IonTabButton>
              <IonTabButton tab="settings" href={`/settings`}>
                <IonIcon icon={settings} />
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
        <IonAlert
          cssClass='uiFont'
          isOpen={this.state.showUpdateAlert}
          backdropDismiss={false}
          onDidPresent={async (ev) => {
            // Run SKIP_WAITING at onDidPresent event to avoid a race condition of
            // an old page fetching old JS chunks with a new service worker!
            // Which causes this alert fails to show.
            try {
              (await Globals.getServiceWorkerReg()).installing?.postMessage({ type: 'SKIP_WAITING' });
              (await Globals.getServiceWorkerReg()).waiting?.postMessage({ type: 'SKIP_WAITING' });
            } catch (error) {
              console.error(error);
            }

            Globals.getServiceWorkerRegUpdated().installing?.postMessage({ type: 'SKIP_WAITING' });
            Globals.getServiceWorkerRegUpdated().waiting?.postMessage({ type: 'SKIP_WAITING' });
          }}
          header={'App 已更新，請重啟!'}
          buttons={[
            {
              text: '關閉',
              cssClass: 'primary uiFont',
              handler: (value) => {
                this.setState({
                  showUpdateAlert: false,
                });
              },
            },
          ]}
        />

        <ShareTextModal
          {...{
            text: this.props.tmpSettings.shareTextModal?.text,
            showModal: this.props.tmpSettings.shareTextModal?.show || false,
            finish: () => {
              this.props.dispatch({
                type: "TMP_SET_KEY_VAL",
                key: 'shareTextModal',
                val: { show: false },
              });
            }, ...this.props
          }}
        />

        <DownloadModal
          {...{
            progress: this.state.downloadModal.progress,
            showModal: this.state.downloadModal.show,
            ...this.props
          }}
        />

        <IonToast
          cssClass='uiFont'
          isOpen={this.state.showRestoreAppSettingsToast}
          onDidDismiss={() => this.setState({ showRestoreAppSettingsToast: false })}
          message={`已套用app連結中的設定，是否還原設定？`}
          buttons={[
            {
              text: '取消',
              role: 'cancel',
              handler: () => this.setState({ showRestoreAppSettingsToast: false })
            },
            {
              text: '還原',
              handler: () => this.restoreAppSettings(),
            },
          ]}
        />

        <IonToast
          cssClass='uiFont'
          isOpen={this.state.showToast}
          onDidDismiss={() => this.setState({ showToast: false })}
          message={this.state.toastMessage}
          duration={2000}
        />
      </IonApp>
    );
  }
}

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    tmpSettings: state.tmpSettings,
    settings: state.settings,
  }
};

const AppOrig = connect(
  mapStateToProps,
)(_AppOrig);


const App = withRouter(_App);

export default App;
