import { WorkListType } from "./Work";

export interface TmpSettings {
    shareTextModal: any;
    workListType: WorkListType | undefined;
    mainVersion: string | null;
    fullScreen: boolean;
}

const defaultTmpSettings = {
    shareTextModal: null,
    workListType: undefined,
    mainVersion: null,
    fullScreen: false,
} as TmpSettings;

export default defaultTmpSettings;