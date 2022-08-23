import { Bookmark } from "./Bookmark";

export enum CbetaDbMode {
    Online,
    OfflineFileSystem,
    OfflineIndexedDb,
    OfflineFileSystemV2,
    OfflineFileSystemV3,
}

export enum UiMode {
    Touch,
    Desktop,
}

export interface Settings {
    // version is the setting file version.
    version: number;
    cbetaBookcaseProcessingAssetsVersion: number;
    hasAppLog: boolean;
    theme: number;
    paginated: boolean;
    rtlVerticalLayout: boolean;
    scrollbarSize: number;
    fabButtonAlpha: number;
    useFontKai: boolean;
    fontSize: number;
    uiFontSize: number;
    useTextBorder: boolean;
    lineSpacing: number;
    showComments: boolean;
    printStyle: number;
    voiceURI: string;
    speechRate: number;
    bookmarks: Bookmark[];
    dictionaryHistory: string[];
    wordDictionaryHistory: string[];
    cbetaOfflineDbMode: CbetaDbMode;
    uiMode: UiMode;
}

const defaultSettings = {
    // version is the setting file version.
    version: 1,
    cbetaBookcaseProcessingAssetsVersion: 0,
    hasAppLog: true,
    theme: 0,
    paginated: true,
    rtlVerticalLayout: true,
    scrollbarSize: 0,
    fabButtonAlpha: 0.2,
    useFontKai: false,
    fontSize: 32,
    uiFontSize: 24,
    useTextBorder: true,
    lineSpacing: 1.5,
    showComments: false,
    printStyle: 0,
    voiceURI: '',
    speechRate: 0.8,
    bookmarks: [],
    dictionaryHistory: [],
    wordDictionaryHistory: [],
    cbetaOfflineDbMode: CbetaDbMode.Online,
    uiMode: UiMode.Touch,
} as Settings;

export default defaultSettings;
