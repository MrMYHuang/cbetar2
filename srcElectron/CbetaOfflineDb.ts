import * as libxslt from 'libxslt-myh';
import { Document as XmlDoc, Element as XmlEle } from 'libxmljs';
const libxmljs = libxslt.libxmljs;
const fs = require('fs');
import * as Globals from './Globals';

var navDocBulei: XmlDoc;
var navDocVol: XmlDoc;
var catalogs: any;
let cbetaBookcaseDir: string;
let isDevMode: boolean = false;
export function init(cbetaBookcaseDirIn: string, isDevModeIn: boolean) {
    isDevMode = isDevModeIn;
    cbetaBookcaseDir = cbetaBookcaseDirIn;
    const stylesheetString = fs.readFileSync(`${isDevMode ? '.' : process.resourcesPath}/buildElectron/nav_fix.xsl`).toString();
    const stylesheet = libxslt.parse(stylesheetString);

    let documentString = fs.readFileSync(`${cbetaBookcaseDir}/CBETA/bulei_nav.xhtml`).toString();
    let fixedDocumentString = stylesheet.apply(documentString);
    navDocBulei = libxmljs.parseXml(fixedDocumentString);

    documentString = fs.readFileSync(`${cbetaBookcaseDir}/CBETA/advance_nav.xhtml`).toString();
    fixedDocumentString = stylesheet.apply(documentString);
    navDocVol = libxmljs.parseXml(fixedDocumentString);

    const catalogsString = fs.readFileSync(`${cbetaBookcaseDir}/CBETA/catalog.txt`).toString();
    catalogs = catalogsString.split(/\r\n/);
    catalogs = (<any>Object).fromEntries(
        catalogs.map((l: string) => {
            const f = l.split(/\s*,\s*/);
            const file = `${f[0]}${f[4]}`;
            return [file, { file, work: `${f[0]}${f[4]}`, juan: f[5], juan_start: 1, category: f[1], creators: f[7], title: f[6], id: f[0], vol: f[3], sutra: f[4] }];
        })
    );
}

export function fetchCatalogs(path: string) {
    let subpaths = path.split('.');
    const catalogTypeIsBulei = subpaths.shift() === 'CBETA';
    const subcatalogsXPath = subpaths.map(s => +s).map(n => `[${n}]/ol/li`).join('');
    const catalogXPath = subpaths.map(s => +s).map(n => `li[${n}]/ol`).join('');
    try {
        const results = (catalogTypeIsBulei ? navDocBulei : navDocVol).find(`//nav/li${subcatalogsXPath}`).map((node, i) => {
            const n = `${path}.${(i + 1).toString().padStart(3, '0')}`;
            const ele = node.child(0) as XmlEle;
            const label = ele.text();
            if (ele.name() === 'cblink') {
                const href = node.get('cblink')!.attr('href')!.value();
                const matches = /.*\/([A-Z]*).*n(.*)_.*.xml$/.exec(href)!;
                const work = matches[1] + matches[2];
                const catalog = catalogs[work];
                return Object.assign({ n, label }, catalog);
            }
            return { n, label };
        });
        const catalogLabel = (catalogTypeIsBulei ? navDocBulei : navDocVol).get(`//nav/${catalogXPath}/../span`)?.text() || '';
        return { label: catalogLabel, results };
    } catch(error) {
        error.message = `path = ${path}\n${error.message}`;
        throw(error);
    }
}

export function fetchWork(path: string) {
    let work = catalogs[path];
    work.juan_list = Array.from({ length: work.juan }, (v, i) => i + 1).join(',');
    work.work = path;
    return { results: [work] };
}

export function fetchJuan(work: string, juan: string) {
    const work_info = fetchWork(work).results[0];
    const stylesheetString = fs.readFileSync(`${isDevMode ? '.' : process.resourcesPath}/buildElectron/tei.xsl`).toString();
    const documentString = fs.readFileSync(`${cbetaBookcaseDir}/CBETA/XML/${work_info.id}/${work_info.id}${work_info.vol}/${work_info.id}${work_info.vol}n${work_info.sutra}_${juan.toString().padStart(3, '0')}.xml`).toString();

    const stylesheet = libxslt.parse(stylesheetString);
    const result = stylesheet.apply(documentString);


    return {
        work_info,
        results: [result.replace(/\.\.\/figures/g, `${Globals.localFileProtocolName}://${cbetaBookcaseDir}/CBETA/figures`)],
    };
}