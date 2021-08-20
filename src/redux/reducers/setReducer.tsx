import Globals from '../../Globals';
import { Bookmark, BookmarkType } from '../../models/Bookmark';
import { Settings } from '../../models/Settings';

// Used to store settings. They will be saved to file.
export default function reducer(state = new Settings(), action: any) {
  let newSettings: Settings = { ...state };
  switch (action.type) {
    case "LOAD_SETTINGS":
      newSettings = JSON.parse(localStorage.getItem(Globals.storeFile)!).settings;
      break;
    case "SET_KEY_VAL":
      var key = action.key;
      var val = action.val;
      switch (key) {
        case 'theme': {
          document.body.classList.forEach((val) => {
            if (/theme/.test(val)) {
              document.body.classList.remove(val);
            }
          });
          document.body.classList.toggle(`theme${val}`, true);
          break;
        }
        case 'printStyle': {
          document.body.classList.forEach((val) => {
            if (/print/.test(val)) {
              document.body.classList.remove(val);
            }
          });
          document.body.classList.toggle(`print${val}`, true);
          break;
        }
      }

      (newSettings as any)[key] = val;
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    case "ADD_BOOKMARK":
      const oldBookmarks = newSettings.bookmarks as [Bookmark];
      let fileName = action.bookmark.fileName;
      if (fileName !== null && fileName !== '' &&
        !oldBookmarks.some((bookmark: Bookmark) => bookmark.fileName === fileName)
      ) {
        Globals.saveFileToIndexedDB(fileName, action.htmlStr);
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
          // Remove the HTML file from indexedDB if all its bookmarks are deleted.
          const deletedBookmark = deletedBookmarks[0];
          let noWorkBookmarkUseTheFile = bookmarksTemp.find((b) => b.type === BookmarkType.WORK && b.work?.work === deletedBookmark.work?.work) == null;
          if (noWorkBookmarkUseTheFile) {
            switch (deletedBookmark.type) {
              case BookmarkType.WORK: {
                const work = deletedBookmark.work!;
                // For back compatibility.
                if (work == null) {
                  break;
                }
                const juans = work.juan_list.split(',');
                for (let i = 0; i < juans.length; i++) {
                  const fileName = Globals.getFileName(work.work, juans[i]);
                  const noJuanBookmarkUseTheFile = bookmarksTemp.find((b) => b.type === BookmarkType.JUAN && b.fileName === fileName) == null;
                  if (noJuanBookmarkUseTheFile) {
                    try {
                      Globals.removeFileFromIndexedDB(fileName);
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }
                break;
              }
              case BookmarkType.JUAN: {
                const fileName = deletedBookmark.fileName;
                const noJuanBookmarkUseTheFile = bookmarksTemp.find((b) => b.type === BookmarkType.JUAN && b.fileName === fileName) == null;
                if (noJuanBookmarkUseTheFile) {
                  try {
                    Globals.removeFileFromIndexedDB(fileName!);
                  } catch (err) {
                    console.error(err);
                  }
                }
                break;
              }
            }
          }
        }
      }
      newSettings.bookmarks = [...bookmarksTemp];
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    case "UPDATE_BOOKMARKS": {
      newSettings.bookmarks = action.bookmarks;
      localStorage.setItem(Globals.storeFile, JSON.stringify({ settings: newSettings }));
      break;
    }
    // @ts-ignore
    case "DEFAULT_SETTINGS":
      newSettings = new Settings();
    // Don't use break here!
    // eslint-disable-next-line
    default:
      if (Object.keys(newSettings).length === 0) {
        newSettings = new Settings();
      }
  }
  return newSettings;
}
