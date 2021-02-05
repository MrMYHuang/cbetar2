import { Work } from "./Work";

export enum BookmarkType {
    // Don't change the order! Otherwise, it breaks file compatibility!
    CATALOG,
    WORK,
    JUAN,
    HTML,
}

export class Bookmark {
    type: BookmarkType = BookmarkType.CATALOG;
    uuid: string = '';
    work: Work | null | undefined = null;
    selectedText: string = '';
    epubcfi: string = '';
    fileName: string | null = '';

    constructor(json: Bookmark) {
        this.type = json.type;
        this.uuid = json.uuid;
        this.work = json.work;
        this.selectedText = json.selectedText;
        this.epubcfi = json.epubcfi;
        this.fileName = json.fileName;
    }
}
