import Globals from '../../Globals';

// Used to store settings. They will be saved to file.
export default function reducer(state = {
}, action) {
  var newState = { ...state }
  switch (action.type) {
    case "SET_KEY_VAL": {
      var key = action.key;
      var val = action.val;
      newState[key] = val;
      break;
    }
    case "ADD_BOOKMARK": {
      newState.bookmarks = [...newState.bookmarks, action.val];
      break;
    }
  }
  localStorage.setItem(Globals.storeFile, JSON.stringify(newState));
  return newState;
}
