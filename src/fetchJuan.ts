import Globals from "./Globals";
import { Work } from './models/Work';
import { Bookmark } from './models/Bookmark';
import { fetchJuan as fetchJuanFromIndexedDB } from './CbetaOfflineDb';
import IndexedDbFuncs from "./IndexedDbFuncs";
import { CbetaDbMode } from "./models/Settings";

// Fetch juan or HTML file.
export default async function fetchJuan(work: string, juan: string, htmlFile: string | null, update: boolean = false, cbetaOfflineDbMode: CbetaDbMode = CbetaDbMode.Online) {
  const fileName = htmlFile || Globals.getFileName(work, juan);
  let htmlStr: string | null = null;
  try {
    htmlStr = await IndexedDbFuncs.getFile(fileName) as string;
  } catch {
    // Ignore file not found.
  }
  const settingsStr = localStorage.getItem(Globals.storeFile);

  let workInfo = ({} as Work);
  let bookmark: Bookmark | undefined;
  if (settingsStr) {
    const bookmarks: Array<Bookmark> = (JSON.parse(settingsStr) as any).settings.bookmarks;
    bookmark = bookmarks.find((b) => b.fileName === fileName || b.uuid === work);
  }

  if (htmlStr !== null && bookmark !== undefined && !update) {
    workInfo = bookmark.work!;
  } else {
    if (htmlFile) {
      const res = await Globals.axiosInstance.get(`/${htmlFile}`, {
        responseType: 'arraybuffer',
      });
      let tryDecoder = new TextDecoder();
      let tryDecodeHtmlStr = tryDecoder.decode(res.data);
      if (tryDecodeHtmlStr.includes('charset=big5')) {
        htmlStr = new TextDecoder('big5').decode(res.data);
      } else {
        htmlStr = tryDecodeHtmlStr;
      }
    } else {
      let data: any;
      switch (cbetaOfflineDbMode) {
        case CbetaDbMode.OfflineIndexedDb:
        case CbetaDbMode.OfflineFileSystemV2:
        case CbetaDbMode.OfflineFileSystemV3:
          data = await fetchJuanFromIndexedDB(work, juan, cbetaOfflineDbMode);
          break;
        case CbetaDbMode.OfflineFileSystem:
          Globals.electronBackendApi?.send("toMain", { event: 'fetchJuan', work, juan });
          data = await new Promise((ok, fail) => {
            Globals.electronBackendApi?.receiveOnce("fromMain", (data: any) => {
              switch (data.event) {
                case 'fetchJuan':
                  ok(data);
                  break;
              }
            });
          });
          break;
        case CbetaDbMode.Online:
          const res = await Globals.axiosInstance.get(`/juans?edition=CBETA&work_info=1&work=${work}&juan=${juan}`, {
            responseType: 'arraybuffer',
          });
          data = JSON.parse(new TextDecoder().decode(res.data));
          break;
      }
      htmlStr = data.results[0];
      workInfo = data.work_info;
    }

    // Convert HTML to XML, because ePub requires XHTML.
    // Bad structured HTML will cause DOMParser parse error on some browsers!
    let doc = document.implementation.createHTMLDocument('');
    doc.body.innerHTML = htmlStr!;
    htmlStr = new XMLSerializer().serializeToString(doc.body);
    // Remove body tag.
    htmlStr = htmlStr.replace('<body', '<div');
    htmlStr = htmlStr.replace('/body>', '/div>');
  }
  return { htmlStr, workInfo };
}