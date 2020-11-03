export enum WordType {
    NOUN = '名',
    VERB = '動'
}

export class DictWordDefItem {
    def: string;
    quote: Array<string> | null;
    example: Array<string> | null;
    link: Array<string> | null;
    type: WordType;

    constructor(json: DictWordDefItem) {
        this.def = json.def;
        this.quote = json.quote;
        this.example = json.example;
        this.link = json.link;
        this.type = json.type;
    }
}

export class DictWordItem {
    bopomofo: string;
    bopomofo2: string;
    pinyin: string;
    definitions: Array<DictWordDefItem>;

    constructor(json: any) {
        this.bopomofo = json.bopomofo;
        this.bopomofo2 = json.bopomofo2;
        this.pinyin = json.pinyin;
        this.definitions = json.definitions;
    }
}
