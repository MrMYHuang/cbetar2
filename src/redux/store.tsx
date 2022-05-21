import { configureStore, EnhancedStore } from '@reduxjs/toolkit';

//import { logger } from "redux-logger"
//import thunk from "redux-thunk"
//import promise from "redux-promise-middleware"

import reducer from "./reducers";

//const middleware = applyMiddleware(promise(), thunk, logger)

var savedStore: EnhancedStore;
const storeFile = 'Settings.json';

function getSavedStore() {
    var savedSettingsStr = localStorage.getItem(storeFile);
    if (savedSettingsStr != null) {
        savedStore = configureStore({
            reducer,
            enhancers: JSON.parse(savedSettingsStr)
        });//, middleware)
    }
    else {
        savedStore = configureStore({ reducer });//, middleware)
    }

    return savedStore;
}

const store = {
    storeFile,
    getSavedStore,
};

export default store;
