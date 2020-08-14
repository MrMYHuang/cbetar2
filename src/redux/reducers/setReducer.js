import Globals from '../../Globals';

// Used to store settings. They will be saved to file.
export default function reducer(state = {
}, action) {
  var newState = { ...state }
  var key = action.key
  var val = action.val
  newState[key] = val
  switch (action.type) {
    case "SET_KEY_VAL": {
      localStorage.setItem(Globals.storeFile, JSON.stringify(newState));
      return newState
    }
  }
  return state
}
