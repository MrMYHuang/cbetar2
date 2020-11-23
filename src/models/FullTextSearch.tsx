export class FullTextSearch {
    id: number;
    term_hits: number;
    work: string;
    juan: number;
    title: string;
    creators: string;

    constructor(json: any) {
        this.id = json.id;
        this.term_hits = json.term_hits;
        this.work = json.work;
        this.juan = json.juan;
        this.title = json.title;
        this.creators = json.creators;
    }
}
