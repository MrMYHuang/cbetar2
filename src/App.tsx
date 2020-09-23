import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  setupConfig,
  IonApp,
  IonIcon,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonAlert
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Provider } from 'react-redux';
import getSavedStore from './redux/store';
import { bookmark, book, settings } from 'ionicons/icons';
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
  swipeBackEnabled: false,
});

export var serviceWorkCallbacks = {
  onSuccess: function () {},
  onUpdate: function () {},
};

interface Props { }

interface State {
  showUpdateAlert: boolean;
}

class App extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    // ----- Initializing UI settings -----
    // Apply the dark mode setting.
    document.body.classList.toggle('dark', state.settings.darkMode);
    Globals.updateCssVars(state.settings);

    this.state = {
      showUpdateAlert: false,
    };

    serviceWorkCallbacks.onUpdate = () => {
      this.setState({showUpdateAlert: true});
    };

    // Preload speechSynthesis.
    speechSynthesis.getVoices();
    speechSynthesis.cancel();

    this.wakeLockScreen();
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

  render() {
    return (
      <Provider store={store}>
        <IonApp>
          <IonReactRouter>
            <IonTabs>
              <IonRouterOutlet animated={false}>
                <Route path="/:tab(catalog)/webview/:work/:path/:label" render={(props: any) => <EPubViewPage {...props} />}  exact={true} />
                <Route path="/:tab(catalog)/work/:path/:label" component={(props: any) => <WorkPage {...props} />} exact={true} />
                <Route path="/:tab(catalog)/search/:keyword" render={props => <SearchPage {...props} />} exact={true} />
                <Route path="/:tab(catalog)/catalog/:path/:label" component={(props: any) => <CatalogPage {...props} />} exact={true} />
                <Route path="/:tab(catalog)" component={(props: any) => <CatalogPage {...props} />} exact={true} />
                <Route path="/:tab(bookmarks)" component={BookmarkPage} exact={true} />
                <Route path={`/:tab(bookmarks)/search/:keyword`} render={props => <SearchPage {...props} />} exact={true} />
                <Route path="/settings" component={SettingsPage} />
                <Route path="/" render={() => <Redirect to="/bookmarks" />} exact={true} />
              </IonRouterOutlet>
              <IonTabBar slot="bottom">
                <IonTabButton tab="bookmarks" href="/bookmarks">
                  <IonIcon icon={bookmark} />
                </IonTabButton>
                <IonTabButton tab="catalog" href="/catalog">
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
            header={'發現app更新，請重啟app!重啟後可至設定頁檢查版本號。'}
            buttons={[
              {
                text: '確定',
                cssClass: 'primary uiFont',
                handler: (value) => {
                  this.setState({
                    showUpdateAlert: false,
                  });
                },
              }
            ]}
          />
        </IonApp>
      </Provider>
    );
  }
}

export default App;
