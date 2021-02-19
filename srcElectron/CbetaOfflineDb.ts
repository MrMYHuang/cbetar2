import * as libxslt from 'libxslt-myh';
import { Document as XmlDoc, Element as XmlEle } from 'libxmljs';
const libxmljs = libxslt.libxmljs;
import * as fs from 'fs';
import * as Globals from './Globals';

let navDocBulei: XmlDoc;
let navDocVol: XmlDoc;
let catalogs: any;
let spines: Array<any>;
let cbetaBookcaseDir: string;
let isDevMode: boolean = false;
let gaijis: any;
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
            return [file, { file, work: `${f[0]}${f[4]}`, juan: f[5], juan_start: 1, category: f[1], creators: f[7], title: f[6], id: f[0], vol: `${f[0]}${f[3]}`, sutra: f[4] }];
        })
    );

    const spinesString = fs.readFileSync(`${cbetaBookcaseDir}/CBETA/spine.txt`).toString();
    spines = spinesString.split(/\r\n/);
    spines = spines.map((l: string) => {
        const f = l.split(/\s*,\s*/);
        return f[0];
    })

    gaijis = JSON.parse(fs.readFileSync('cbeta_gaiji/cbeta_gaiji.json').toString());
}

export function fetchCatalogs(path: string) {
    let subpaths = path.split('.');
    const catalogTypeIsBulei = subpaths.shift() === 'CBETA';
    const subcatalogsXPath = subpaths.map(s => +s).map(n => `[${n}]/ol/li`).join('');
    const catalogXPath = subpaths.map(s => +s).map(n => `li[${n}]/ol`).join('/');
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
    } catch (error) {
        error.message = `path = ${path}\n${error.message}`;
        throw (error);
    }
}

export function fetchWork(path: string) {
    const pathFieldMatches = /([A-Z]*)(.*)/.exec(path)!;
    const bookId = pathFieldMatches[1];
    const sutra = pathFieldMatches[2];
    let work = catalogs[path];
    // E.g. XML/I/I01/I01n0012_001.xml.
    const re = new RegExp(`${bookId}[^n]*n${sutra}`);
    const juans = spines.filter(s => re.test(s)).map(s => +(new RegExp(`${bookId}[^n]*n${sutra}_(.*)\.xml`).exec(s)![1]));
    work.juan_list = juans.join(',');
    work.work = path;
    return { results: [work] };
}

export function fetchJuan(work: string, juan: string) {
    const work_info = fetchWork(work).results[0];
    const stylesheetString = fs.readFileSync(`${isDevMode ? '.' : process.resourcesPath}/buildElectron/tei.xsl`).toString();
    const documentString = fs.readFileSync(`${cbetaBookcaseDir}/CBETA/XML/${work_info.id}/${work_info.vol}/${work_info.vol}n${work_info.sutra}_${juan.toString().padStart(3, '0')}.xml`).toString();

    const stylesheet = libxslt.parse(stylesheetString);
    const xsltResult = stylesheet.apply(documentString);

    let xhtmlDoc = libxmljs.parseXml(xsltResult);
    const newRoot = elementTPostprocessing(xhtmlDoc.root()!);
    const result = newRoot.toString({
        type: 'html',
        declaration: true,
        selfCloseEmpty: true,
        whitespace: true,
    });

    return {
        work_info,
        results: [result.replace(/\.\.\/figures/g, `${Globals.localFileProtocolName}://${cbetaBookcaseDir}/CBETA/figures`)],
    };
}

let lb = '';
function elementTPostprocessing(node: XmlEle): XmlEle {
    const c = node;
    if (c.type() === 'element') {
        let c2 = c as XmlEle;
        if (c2.name() === 'span') {
            if (c2.attr('class')?.value() === 'lb') {
                lb = c2.attr('l')!.value();
            } else if (c2.attr('class')?.value() === 't') {
                c2.attr({ 'l': lb });
            }
            c2.childNodes().forEach(cn => {
                return elementTPostprocessing(cn as XmlEle);
            })
            return c2;
        } else if (c2.name() === 'g') {
            const gaijiId = c2.attr('ref')?.value().substring(1)!;
            if (/^CB/.test(gaijiId)) {
                c2.name('span');
                c2.text(gaijis[gaijiId].uni_char);
            }
            return c2;
        } else {
            c2.childNodes().forEach(cn => {
                return elementTPostprocessing(cn as XmlEle);
            })
            return c2;
        }
    } else {
        return c;
    }
}