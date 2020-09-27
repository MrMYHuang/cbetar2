export class DictItem {
    term: string;
    desc: string;
    dict_name_zh: string;
    dict_name_en: string;
    dict_name_en_short: string;
    weight: number;

    constructor(json: any) {
        this.term = json.term;
        this.desc = json.desc;
        this.dict_name_zh = json.dict_name_zh;
        this.dict_name_en = json.dict_name_en;
        this.dict_name_en_short = json.dict_name_en_short;
        this.weight = json.weight;
    }
}
