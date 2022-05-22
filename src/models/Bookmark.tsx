import { Work } from "./Work";

export enum BookmarkType {
    // Don't change the order! Otherwise, it breaks file compatibility!
    CATALOG,
    WORK,
    JUAN,
    HTML,
}

export interface Bookmark {
    type: BookmarkType;
    uuid: string;
    work: Work | null | undefined;
    selectedText: string;
    epubcfi: string;
    fileName: string | null;
}
