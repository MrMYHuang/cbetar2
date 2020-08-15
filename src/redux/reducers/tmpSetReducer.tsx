// Used to store temp settings in RAM. They will not be saved to file.
export default function reducer(state = {
}, action: any) {
  var newState = { ...state } as any;
  var key = action.key;
  var val = action.val;
  newState[key] = val;
  switch (action.type) {
    case "TMP_SET_KEY_VAL": {
      return newState;
    }
    default:
      break;
  }
  return state;
}
