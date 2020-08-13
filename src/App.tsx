import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
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
import Globals from './Globals';
import { Catalog } from './models/Catalog';

let store = getSavedStore();
class DebugRouter extends IonReactRouter {
  constructor(props){
    super(props);
    console.log('initial history is: ', JSON.stringify(this.history, null,2))
    this.history.listen((location, action)=>{
      console.log(
        `The current URL is ${location.pathname}${location.search}${location.hash}`
      )
      console.log(`The last navigation action was ${action}`, JSON.stringify(this.history, null,2));
    });
  }
}

function getTopCatalogs() {
  let catalogs = Array<Catalog>();
    Object.keys(Globals.topCatalogs).forEach((key) => {
    const catalog: Catalog = {
      n: key,
      nodeType: null,
      work: null,
      label: Globals.topCatalogs[key],
      file: null,
    };
    catalogs.push(catalog);
  });
  return catalogs;
}

const App: React.FC = () => (
    <IonApp>
      <DebugRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/:tab(catalog)" render={props => <CatalogPage {...props} catalogs={getTopCatalogs()} />} exact={true} />
            <Route path="/tab2" component={WorkPage} exact={true} />
            <Route path="/tab3" component={WebViewPage} />
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="tab1" href="/tab1">
              <IonIcon icon={book} />
            </IonTabButton>
            <IonTabButton tab="tab2" href="/tab2">
              <IonIcon icon={bookmark} />
            </IonTabButton>
            <IonTabButton tab="tab3" href="/tab3">
              <IonIcon icon={settings} />
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </DebugRouter>
    </IonApp>
);

export default App;
