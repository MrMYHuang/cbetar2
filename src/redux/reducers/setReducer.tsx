import Globals from '../../Globals';
import { Bookmark, BookmarkType } from '../../models/Bookmark';

// Used to store settings. They will be saved to file.
export default function reducer(state = {
}, action: any) {
  var newSettings = { ...state } as any;
  switch (action.type) {
    case "SET_KEY_VAL":
      var key = action.key;
      var val = action.val;
      newSettings[key] = val;
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    case "ADD_BOOKMARK":
      const oldBookmarks = newSettings.bookmarks as [Bookmark];
      let fileName = action.bookmark.fileName;
      if (fileName !== null && fileName !== '' &&
        !oldBookmarks.some((bookmark: Bookmark) => bookmark.fileName === fileName)
      ) {
        localStorage.setItem(fileName, action.htmlStr);
      }
      newSettings.bookmarks = [...newSettings.bookmarks, action.bookmark];
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    case "DEL_BOOKMARK":
      let bookmarksTemp = newSettings.bookmarks as [Bookmark];
      const idxToDel = bookmarksTemp.findIndex((b) => { return b.uuid === action.uuid });
      if (idxToDel !== -1) {
        let deletedBookmarks = bookmarksTemp.splice(idxToDel, 1);

        if (deletedBookmarks.length === 1) {
          // Remove the HTML file from localStorage if all its bookmarks are deleted.
          const deletedBookmark = deletedBookmarks[0];
          let fileName = deletedBookmark.fileName;
          let noJuanBookmarkUseTheFile = bookmarksTemp.find((b) => b.type === BookmarkType.JUAN && b.uuid === deletedBookmark.uuid) == null;
          let noWorkBookmarkUseTheFile = bookmarksTemp.find((b) => b.type === BookmarkType.WORK && b.work?.work === deletedBookmark.work?.work) == null;
          if (noWorkBookmarkUseTheFile) {
            switch (deletedBookmark.type) {
              case BookmarkType.WORK:
                const work = deletedBookmark.work!;
                // For back compatibility.
                if (work == null) {
                  break;
                }
                const juans = work.juan_list.split(',');
                for (let i = 0; i < juans.length; i++) {
                  const fileName = Globals.getFileName(work.work, juans[i]);
                  noJuanBookmarkUseTheFile = bookmarksTemp.find((b) => b.type === BookmarkType.JUAN && b.fileName === fileName) == null;
                  if (noJuanBookmarkUseTheFile) {
                    localStorage.removeItem(fileName);
                  }
                }
                break;
              case BookmarkType.JUAN:
                if (noJuanBookmarkUseTheFile) 
                  localStorage.removeItem(fileName);
                break;
            }
          }
        }
      }
      newSettings.bookmarks = [...bookmarksTemp];
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    default:
      if (Object.keys(newSettings).length === 0) {
        newSettings = {};
      }
      // Setting default values.
      var keys = ['topCatalogsType', 'theme', 'paginated', 'rtlVerticalLayout', 'scrollbarSize', 'useFontKai', 'fontSize', 'uiFontSize', 'darkMode', 'showComments', 'speechRate', 'bookmarks'];
      var vals = [0, 0, 1, 1, 2, 1, 32, 24, 1, 0, 0.8, []];
      for (let k = 0; k < keys.length; k++) {
        if (newSettings[keys[k]] === undefined) {
          newSettings[keys[k]] = vals[k];
        }
      }
  }
  return newSettings;
}
