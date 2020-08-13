import { applyMiddleware, createStore, Store } from "redux";

//import { logger } from "redux-logger"
//import thunk from "redux-thunk"
//import promise from "redux-promise-middleware"

import reducer from "./reducers";

//const middleware = applyMiddleware(promise(), thunk, logger)

var savedStore: Store;

var storeFile = 'Settings'

export default function getSavedStore() {
    var savedSettings = localStorage.getItem(storeFile);
    if (savedSettings != null) {
        savedStore = createStore(reducer, { settings: savedSettings });//, middleware)
    }
    else {
        savedStore = createStore(reducer);//, middleware)
    }

    // Setting default values.
    var keys = ['fontSize', 'listFontSize', 'darkMode', 'showComments'];
    var vals = [48, 48, 0, 0];
    var settings = savedStore.getState();
    for (let k = 0; k < keys.length; k++) {
        // Set default value if null.
        if (settings[keys[k]] == null) {
            savedStore.dispatch({
                type: "SET_KEY_VAL",
                key: keys[k],
                val: vals[k]
            });
        }
    }

    return savedStore;
}
