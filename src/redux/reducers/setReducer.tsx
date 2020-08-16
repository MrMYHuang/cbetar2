import Globals from '../../Globals';
import { Bookmark } from '../../models/Bookmark';

// Used to store settings. They will be saved to file.
export default function reducer(state = {
}, action: any) {
  var newSettings = { ...state } as any;
  switch (action.type) {
    case "SET_KEY_VAL":
      var key = action.key;
      var val = action.val;
      newSettings[key] = val;
      localStorage.setItem(Globals.storeFile, JSON.stringify({settings: newSettings}));
      break;
    case "ADD_BOOKMARK":
      if (action.bookmark.fileName !== null && action.bookmark.fileName !== '') {
        localStorage.setItem(action.bookmark.fileName, action.htmlStr);
      }
      newSettings.bookmarks = [...newSettings.bookmarks, action.bookmark];
      localStorage.setItem(Globals.storeFile, JSON.stringify({settings: newSettings}));
      break;
    case "DEL_BOOKMARK":
      var bookmarksTemp = newSettings.bookmarks as [Bookmark];
      const idxToDel = bookmarksTemp.findIndex((b) => { return b.uuid === action.uuid });
      if (idxToDel !== -1) {
        bookmarksTemp.splice(idxToDel, 1);
      }
      if (bookmarksTemp.find((b) => b.fileName === action.fileName) == null) {
        localStorage.removeItem(action.fileName);
      } else {
        localStorage.setItem(action.fileName, action.htmlStr);
      }
      newSettings.bookmarks = [...bookmarksTemp];
      localStorage.setItem(Globals.storeFile, JSON.stringify({settings: newSettings}));
      break;
    default:
      if (Object.keys(newSettings).length === 0) {
        // Setting default values.
        var keys = ['fontSize', 'listFontSize', 'darkMode', 'showComments', 'bookmarks'];
        var vals = [32, 24, 1, 0, []];
        newSettings = {};
        for (let k = 0; k < keys.length; k++) {
          newSettings[keys[k]] = vals[k];
        }
      }
  }
  return newSettings;
}
