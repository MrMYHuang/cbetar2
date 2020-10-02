export class FullTextSearch {
    id: number;
    term_hits: number;
    work: string;
    title: string;
    creators: string;

    constructor(json: any) {
        this.id = json.id;
        this.term_hits = json.term_hits;
        this.work = json.work;
        this.title = json.title;
        this.creators = json.creators;
    }
}
