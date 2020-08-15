import Globals from '../../Globals';
import { Bookmark } from '../../models/Bookmark';

// Used to store settings. They will be saved to file.
export default function reducer(state = {
}, action) {
  var newState = { ...state };
  switch (action.type) {
    case "SET_KEY_VAL":
      var key = action.key;
      var val = action.val;
      newState[key] = val;
      break;
    case "ADD_BOOKMARK":
      newState.bookmarks = [...newState.bookmarks, action.val];
      break;
    case "DEL_BOOKMARK":
      var bookmarksTemp = newState.bookmarks as [Bookmark];
      const idxToDel = bookmarksTemp.findIndex((b) => { return b.uuid == action.uuid });
      if (idxToDel != -1) {
        bookmarksTemp.splice(idxToDel, 1);
      }
      newState.bookmarks = [...bookmarksTemp];
      break;
  }
  localStorage.setItem(Globals.storeFile, JSON.stringify(newState));
  return newState;
}
