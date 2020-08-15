import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Provider } from 'react-redux';
import getSavedStore from './redux/store';
import { bookmark, book, settings } from 'ionicons/icons';
import CatalogPage from './pages/CatalogPage';
import WorkPage from './pages/WorkPage';
import WebViewPage from './pages/WebViewPage';

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

let store = getSavedStore();
/*
class DebugRouter extends IonReactRouter {
  constructor(props) {
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

const App: React.FC = () => (
  <Provider store={store}>
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet animated={false}>
            <Route path="/:tab(catalog)" component={props => <CatalogPage {...props} />} exact={true} />
            <Route path="/:tab(catalog)/:path" component={props => <CatalogPage {...props} />} exact={true} />
            <Route path="/:tab(catalog)/work/:path" component={props => <WorkPage {...props} />} exact={true} />
            <Route path={`/:tab(catalog)/webview/:work/:path`} render={props => <WebViewPage {...props} />} exact={true} />
            <Route path={`/:tab(catalog)/search/:keyword`} render={props => <SearchPage {...props} />} exact={true} />
            <Route path="/:tab(bookmarks)" component={BookmarkPage} exact={true} />
            <Route path={`/:tab(bookmarks)/search/:keyword`} render={props => <SearchPage {...props} />} exact={true} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/" render={() => <Redirect to="/catalog" />} exact={true} />
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="catalog" href="/catalog">
              <IonIcon icon={book} />
            </IonTabButton>
            <IonTabButton tab="bookmarks" href="/bookmarks">
              <IonIcon icon={bookmark} />
            </IonTabButton>
            <IonTabButton tab="settings" href="/settings">
              <IonIcon icon={settings} />
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  </Provider>
);

export default App;
