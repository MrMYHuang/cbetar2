import * as libxslt from 'libxslt';
import {Document as XmlDoc, Element as XmlEle} from 'libxmljs';
const libxmljs = libxslt.libxmljs;
const fs = require('fs');
const cbetaBookcaseDir = 'Bookcase'

var navDoc: XmlDoc;
var catalogs: any;
function init() {
    const stylesheetString = fs.readFileSync('bulei_nav_fix.xsl').toString();
    const documentString = fs.readFileSync(`${cbetaBookcaseDir}/CBETA/bulei_nav.xhtml`).toString();
    var stylesheet = libxslt.parse(stylesheetString);
    var fixedDocumentString = stylesheet.apply(documentString);
    navDoc = libxmljs.parseXml(fixedDocumentString);

    const catalogsString = fs.readFileSync(`${cbetaBookcaseDir}/CBETA/catalog.txt`).toString();
    catalogs = catalogsString.split(/\r\n/);
    catalogs = (<any> Object).fromEntries(
        catalogs.map((l: string) => {
            const f = l.split(/\s*,\s*/);
            const file = `${f[0]}${f[4]}`;
            return [file, { file, work: `${f[0]}${f[4]}`, juan: f[5], juan_start: 1, category: f[1], creators: f[7], title: f[6] }];
        })
    );
}
init();

export function fetchCatalogs(path: string) {
    let subpaths = path.split('.');
    subpaths.shift();
    const catalogXPath = subpaths.map(s => +s).map(n => `[${n}]/ol/li`).join('');
    const results = navDoc.find(`//nav/li${catalogXPath}`).map((node, i) => {
        const n = `${path}.${(i + 1).toString().padStart(3, '0')}`;
        const ele = node.child(0) as XmlEle;
        const label = ele.text();
        if (ele.name() === 'cblink') {
            const href = node.get('cblink')!.attr('href')!.value();
            const matches = /.*\/(.).*([\d]{4})_.*.xml$/.exec(href)!;
            const work = matches[1]+matches[2];
            const catalog = catalogs[work];
            return Object.assign({ n, label }, catalog);
        }
        return { n, label };
    });
    return { results };
}

export function fetchWork(path: string) {
    let work = catalogs[path];
    work.juan_list = Array.from({ length: work.juan }, (v, i) => i + 1).join(',');
    work.work = path;
    return {results: [work]};
}
