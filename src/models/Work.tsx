export enum WorkListType {
    // Don't change the order! Otherwise, it breaks file compatibility!
    BY_CHAPTER,
    BY_JUAN,
}

export class WorkChapter {
    title: string;
    juan: number;

    constructor(json: any) {
        this.title = json.title;
        this.juan = json.juan;
    }
}

export class Work {
    title: string;
    juan: number;
    juan_list: string;
    mulu: WorkChapter[];
    work: string;

    constructor(json: any) {
        this.title = json.title;
        this.juan = json.juan;
        this.juan_list = json.juan_list;
        this.mulu = json.mulu;
        this.work = json.work;
    }
}
