import { Bookmark } from "./Bookmark";

export enum CbetaDbMode {
    Online,
    OfflineFileSystem,
    OfflineIndexedDb,
}

export interface Settings {
    // version is the setting file version.
    version: number;
    hasAppLog: boolean;
    theme: number;
    paginated: boolean;
    rtlVerticalLayout: boolean;
    scrollbarSize: number;
    fabButtonAlpha: number;
    useFontKai: boolean;
    fontSize: number;
    uiFontSize: number;
    showComments: boolean;
    printStyle: number;
    voiceURI: string;
    speechRate: number;
    bookmarks: Bookmark[];
    dictionaryHistory: string[];
    wordDictionaryHistory: string[];
    cbetaOfflineDbMode: CbetaDbMode;
}

const defaultSettings = {
    // version is the setting file version.
    version: 1,
    hasAppLog: true,
    theme: 0,
    paginated: true,
    rtlVerticalLayout: true,
    scrollbarSize: 0,
    fabButtonAlpha: 0.2,
    useFontKai: false,
    fontSize: 32,
    uiFontSize: 24,
    showComments: false,
    printStyle: 0,
    voiceURI: '',
    speechRate: 0.8,
    bookmarks: [],
    dictionaryHistory: [],
    wordDictionaryHistory: [],
    cbetaOfflineDbMode: CbetaDbMode.OfflineIndexedDb,
} as Settings;

export default defaultSettings;
