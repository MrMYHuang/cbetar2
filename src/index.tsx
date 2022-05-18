import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App, {serviceWorkCallbacks} from './App';
import Globals from './Globals';
import * as serviceWorker from './serviceWorkerRegistration';

// Enable at the very start for logging most messages.
Globals.enableAppLog();

createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register({
    onSuccess: (registration: ServiceWorkerRegistration) => { console.log('Precache app loaded!'); serviceWorkCallbacks.onSuccess(registration); },
    onUpdate: (registration: ServiceWorkerRegistration) => { console.log('Found app updated!'); serviceWorkCallbacks.onUpdate(registration); },
});
