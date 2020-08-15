import { /*applyMiddleware,*/ createStore, Store } from "redux";

//import { logger } from "redux-logger"
//import thunk from "redux-thunk"
//import promise from "redux-promise-middleware"

import reducer from "./reducers";
import Globals from "../Globals";

//const middleware = applyMiddleware(promise(), thunk, logger)

var savedStore: Store;

export default function getSavedStore() {
    var savedSettingsStr = localStorage.getItem(Globals.storeFile);
    if (savedSettingsStr != null) {
        savedStore = createStore(reducer, JSON.parse(savedSettingsStr));//, middleware)
    }
    else {
        savedStore = createStore(reducer);//, middleware)
    }

    return savedStore;
}
