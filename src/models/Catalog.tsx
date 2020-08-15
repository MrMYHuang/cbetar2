export class Catalog {
    n: string;
    nodeType: string | null | undefined;
    label: string;
    work: string | null | undefined;
    file: string | null | undefined;

    constructor(json) {
        this.n = json.n
        this.nodeType = json.node_type
        this.label = json.label
        this.work = json.work
        this.file = json.file
    }
}
