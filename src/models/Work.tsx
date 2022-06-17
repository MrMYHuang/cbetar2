export enum WorkListType {
    // Don't change the order! Otherwise, it breaks file compatibility!
    BY_CHAPTER,
    BY_JUAN,
}

export interface WorkChapter {
    title: string;
    juan: number;
}

export interface Work {
    title: string;
    juan: number;
    juan_list: string;
    mulu: WorkChapter[];
    work: string;
    vol: string;
}
