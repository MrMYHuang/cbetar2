export class Search {
    type: string;
    n: string;
    label: string;
    work: string;
    title: string;
    creators: string;

    constructor(json: any) {
        this.type = json["type"];
        this.n = json["n"];
        this.label = json["label"];
        this.work = json["work"];
        this.title = json["title"];
        this.creators = json["creators"] ?? '無';
    }
}
