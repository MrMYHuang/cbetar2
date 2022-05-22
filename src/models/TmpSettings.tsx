import { WorkListType } from "./Work";

export interface TmpSettings {
    shareTextModal: any;
    workListType: WorkListType | undefined;
    mainVersion: string | null;
    cbetaOfflineDbMode: boolean;
    fullScreen: boolean;
}

const defaultTmpSettings = {
    shareTextModal: null,
    workListType: undefined,
    mainVersion: null,
    cbetaOfflineDbMode: false,
    fullScreen: false,
} as TmpSettings;

export default defaultTmpSettings;