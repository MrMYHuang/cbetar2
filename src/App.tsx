import React from 'react';
import { Redirect, Route, RouteComponentProps, withRouter } from 'react-router-dom';
import {
  setupConfig,
  IonApp,
  IonIcon,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonAlert,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { connect, Provider } from 'react-redux';
import getSavedStore from './redux/store';
import { bookmark, settings, library, book } from 'ionicons/icons';
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

let store = getSavedStore();
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

const state = store.getState();

setupConfig({
  mode: 'md',
  swipeBackEnabled: false,
});

export var serviceWorkCallbacks = {
  onSuccess: function (registration: ServiceWorkerRegistration) { },
  onUpdate: function (registration: ServiceWorkerRegistration) { },
};

interface Props {
  shareTextModal: any;
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
  showUpdateAlert: boolean;
}

class _App extends React.Component<PageProps, State> {
  render() {
    return (
      <Provider store={store}>
        <AppOrig {...this.props} />
      </Provider>
    );
  }
}

class _AppOrig extends React.Component<AppOrigProps, State> {
  registrationNew: ServiceWorkerRegistration | null;

  constructor(props: any) {
    super(props);
    this.registrationNew = null;
    // ----- Initializing UI settings -----
    // Apply the theme setting.
    document.body.classList.forEach((val) => document.body.classList.remove(val));
    document.body.classList.toggle(`theme${state.settings.theme}`, true);
    Globals.updateCssVars(state.settings);

    this.state = {
      showUpdateAlert: false,
    };

    serviceWorkCallbacks.onUpdate = (registration: ServiceWorkerRegistration) => {
      this.registrationNew = registration;
      this.setState({ showUpdateAlert: true });
    };

    serviceWorkCallbacks.onSuccess = (registration: ServiceWorkerRegistration) => {
    };

    // Preload speechSynthesis.
    speechSynthesis.getVoices();
    speechSynthesis.cancel();

    this.wakeLockScreen();
    this.loadTwKaiFont();
  }

  async loadTwKaiFont() {
    const dbOpenReq = indexedDB.open(Globals.cbetardb);
    dbOpenReq.onupgradeneeded = function (event: IDBVersionChangeEvent) {
      var db = (event.target as any).result;
      db.createObjectStore('store');
    };

    let fontData: any;
    await new Promise((ok, fail) => {
      dbOpenReq.onsuccess = async (ev: Event) => {
        const db = dbOpenReq.result;

        const trans = db.transaction(["store"], 'readwrite');
        let req = trans.objectStore('store').get(Globals.twKaiFontKey);
        req.onsuccess = async (_ev: any) => {
          fontData = req.result;
          if (!fontData) {
            const res = await Globals.axiosInstance.get(`${window.location.origin}/${Globals.twKaiFontPath}`, {
              responseType: 'arraybuffer',
            });
            const transWrite = db.transaction(["store"], 'readwrite');
            fontData = res.data;
            const reqWrite = transWrite.objectStore('store').put(fontData, Globals.twKaiFontKey);
            reqWrite.onsuccess = (_ev: any) => {
              return ok();
            };
          }
          return ok();
        };
      };
    });
    const fontFace = new (window as any).FontFace('Kai', fontData);
    await fontFace.load();
    (document as any).fonts.add(fontFace);
    console.log('[Main] TW-Kai font loading success!');
  }

  // Prevent from device sleeping.
  wakeLock: any;
  async wakeLockScreen() {
    try {
      const wakeLock = (navigator as any).wakeLock;
      if (wakeLock !== undefined) {
        this.wakeLock = await wakeLock.request('screen');
        console.log('Auto screen lock is disabled.');
      }
    } catch (err) {
      // the wake lock request fails - usually system related, such low as battery
      console.log(`${err.name}, ${err.message}`);
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
    const routeMatches = /\?route=(.*)/.exec(window.location.search);
    if (routeMatches !== null) {
      return <Redirect to={routeMatches[1]} />;
    } else if (window.location.pathname === '/') {
      return <Redirect to="/bookmarks" />;
    }
  }

  render() {
    return (
      <IonApp>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet animated={false}>
              {/* The following route is for backward compatibility. */}
              <Route path="/:tab(catalog)/webview/:work/:path/:label" render={(props: any) => <EPubViewPage {...props} />} exact={true} />
              <Route path="/:tab(catalog)/juan/:work/:path/" render={(props: any) => <EPubViewPage {...props} />} exact={true} />
              {/* The following route is for backward compatibility. */}
              <Route path="/:tab(catalog)/work/:path/:label" component={(props: any) => <WorkPage {...props} />} exact={true} />
              <Route path="/:tab(catalog)/work/:path" component={(props: any) => <WorkPage {...props} />} exact={true} />
              <Route path="/:tab(catalog)/search/:keyword" render={props => <SearchPage {...props} />} exact={true} />
              <Route path="/:tab(catalog)/fulltextsearch/:keyword" render={props => <FullTextSearchPage {...props} />} exact={true} />
              {/* The following route is for backward compatibility. */}
              <Route path="/:tab(catalog)/catalog/:path/:label" component={(props: any) => <CatalogPage {...props} />} exact={true} />
              <Route path="/:tab(catalog)/catalog/:path" component={(props: any) => <CatalogPage key={props.match.url} {...props} />} exact={true} />
              <Route path="/:tab(catalog)" component={(props: any) => <CatalogPage {...props} />} exact={true} />
              <Route path="/:tab(bookmarks)" component={BookmarkPage} exact={true} />
              <Route path={`/:tab(bookmarks)/search/:keyword`} render={props => <SearchPage {...props} />} exact={true} />
              <Route path={`/:tab(dictionary)`} render={props => <DictionaryPage {...props} />} exact={true} />
              <Route path={`/:tab(dictionary)/search/:keyword`} render={props => <DictionaryPage {...props} />} exact={true} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/" render={() => { return this.routeByQueryString(); }} exact={true} />
            </IonRouterOutlet>
            <IonTabBar slot="bottom">
              <IonTabButton tab="bookmarks" href="/bookmarks">
                <IonIcon icon={bookmark} />
              </IonTabButton>
              <IonTabButton tab="catalog" href="/catalog">
                <IonIcon icon={library} />
              </IonTabButton>
              <IonTabButton tab="dictionay" href="/dictionary">
                <IonIcon icon={book} />
              </IonTabButton>
              <IonTabButton tab="settings" href="/settings">
                <IonIcon icon={settings} />
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
        <IonAlert
          cssClass='uiFont'
          isOpen={this.state.showUpdateAlert}
          backdropDismiss={false}
          onDidPresent={(ev) => {
            // Run SKIP_WAITING at onDidPresent event to avoid a race condition of
            // an old page fetching old JS chunks with a new service worker!
            this.registrationNew?.installing?.postMessage({ type: 'SKIP_WAITING' });
            this.registrationNew?.waiting?.postMessage({ type: 'SKIP_WAITING' });
          }}
          header={'發現app更新，避免運作異常，請重啟app或關閉相關分頁!然後可至設定頁檢查版本號。'}
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
            {
              text: '顯示版本歷史',
              cssClass: 'secondary uiFont',
              handler: (value) => {
                window.open('https://github.com/MrMYHuang/cbetar2#%E7%89%88%E6%9C%AC%E6%AD%B7%E5%8F%B2');
              },
            }
          ]}
        />

        <ShareTextModal
          {...{
            text: this.props.shareTextModal?.text,
            showModal: this.props.shareTextModal?.show || false,
            finish: () => {
              store.dispatch({
                type: "TMP_SET_KEY_VAL",
                key: 'shareTextModal',
                val: { show: false },
              });
            }, ...this.props
          }}
        />
      </IonApp>
    );
  }
}

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    shareTextModal: state.tmpSettings.shareTextModal,
  }
};

const AppOrig = connect(
  mapStateToProps,
)(_AppOrig);


const App = withRouter(_App);

export default App;
