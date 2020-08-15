export class Work {
    title: string
    juan: number
    juan_list: string
    work: string

    constructor(json) {
        this.title = json.title;
        this.juan = json.juan;
        this.juan_list = json.juan_list;
        this.work = json.work;
    }
}
