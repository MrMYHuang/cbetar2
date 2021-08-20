import { Bookmark } from "./Bookmark";

export class Settings {
    // version is the setting file version.
    version: number = 1;
    hasAppLog: boolean = true;
    theme: number = 0;
    paginated: boolean = true;
    rtlVerticalLayout: boolean = true;
    scrollbarSize = 0;
    useFontKai = true;
    fontSize = 32;
    uiFontSize: number = 24;
    showComments = false;
    printStyle = 0;
    voiceURI = '';
    speechRate = 0.8;
    bookmarks: Bookmark[] = [];
    dictionaryHistory: string[] = [];
    wordDictionaryHistory: string[] = [];
}
