import { /*applyMiddleware,*/ createStore, Store } from "redux";

//import { logger } from "redux-logger"
//import thunk from "redux-thunk"
//import promise from "redux-promise-middleware"

import reducer from "./reducers";

//const middleware = applyMiddleware(promise(), thunk, logger)

var savedStore: Store;
const storeFile = 'Settings.json';

function getSavedStore() {
    var savedSettingsStr = localStorage.getItem(storeFile);
    if (savedSettingsStr != null) {
        savedStore = createStore(reducer, JSON.parse(savedSettingsStr));//, middleware)
    }
    else {
        savedStore = createStore(reducer);//, middleware)
    }

    return savedStore;
}

const store = {
    storeFile,
    getSavedStore,
};

export default store;
