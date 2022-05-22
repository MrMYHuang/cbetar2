import defaultTmpSettings, { TmpSettings } from "../../models/TmpSettings";

// Used to store temp settings in RAM. They will not be saved to file.
export default function reducer(state = {...defaultTmpSettings}, action: any) {
  let newState: TmpSettings = { ...state };
  var key = action.key;
  var val = action.val;
  (newState as any)[key] = val;
  switch (action.type) {
    case "TMP_SET_KEY_VAL": {
      return newState;
    }
    default:
      break;
  }
  return state;
};
