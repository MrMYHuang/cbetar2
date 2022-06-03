import Globals from "./Globals";

const xmlParser = new DOMParser();
const xsltProcessor = new XSLTProcessor();
const textDecoder = new TextDecoder();
let navDocBulei: Document;
let navDocVol: Document;
let catalogs: any;
let spines: Array<any>;
const cbetaBookcaseDir = 'Bookcase';
let gaijis: any;
let isInit = false;

function stringToXml(str: string) {
    return xmlParser.parseFromString(str, 'text/xml');
}

async function getFileAsStringFromIndexedDB(file: string) {
    return textDecoder.decode((await Globals.getFileFromIndexedDB(file)) as Uint8Array);
}

export async function init() {
    const stylesheetString = await getFileAsStringFromIndexedDB(`${Globals.cbetar2AssetDir}/nav_fix.xsl`);
    xsltProcessor.importStylesheet(stringToXml(stylesheetString));

    let documentString = await getFileAsStringFromIndexedDB(`${cbetaBookcaseDir}/CBETA/bulei_nav.xhtml`);
    navDocBulei = xsltProcessor.transformToDocument(stringToXml(documentString));

    documentString = await getFileAsStringFromIndexedDB(`${cbetaBookcaseDir}/CBETA/advance_nav.xhtml`);
    navDocVol = xsltProcessor.transformToDocument(stringToXml(documentString));

    const catalogsString = await getFileAsStringFromIndexedDB(`${cbetaBookcaseDir}/CBETA/catalog.txt`);
    catalogs = catalogsString.split(/\r\n/);
    catalogs = (Object).fromEntries(
        catalogs.map((l: string) => {
            const f = l.split(/\s*,\s*/);
            const file = `${f[0]}${f[4]}`;
            return [file, { file, work: `${f[0]}${f[4]}`, juan: f[5], juan_start: 1, category: f[1], creators: f[7], title: f[6], id: f[0], vol: `${f[0]}${f[3]}`, sutra: f[4] }];
        })
    );

    const spinesString = await getFileAsStringFromIndexedDB(`${cbetaBookcaseDir}/CBETA/spine.txt`);
    spines = spinesString.split(/\r\n/);
    spines = spines.map((l: string) => {
        const f = l.split(/\s*,\s*/);
        return f[0];
    })

    gaijis = JSON.parse(await getFileAsStringFromIndexedDB(`${Globals.cbetar2AssetDir}/cbeta_gaiji.json`));
    isInit = true;
}

export async function fetchCatalogs(path: string) {
    isInit || await init();

    let subpaths = path.split('.');
    const catalogTypeIsBulei = subpaths.shift() === 'CBETA';
    const subcatalogsXPath = subpaths.map(s => +s).map(n => `[${n}]/ol/li`).join('');
    const catalogXPath = subpaths.map(s => +s).map(n => `li[${n}]/ol`).join('/');
    try {
        const doc = (catalogTypeIsBulei ? navDocBulei : navDocVol);
        const nodesSnapshot = doc.evaluate(`//nav/li${subcatalogsXPath}`, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
        const results = Array.from({ length: nodesSnapshot.snapshotLength }, (v, i) => {
            const node = nodesSnapshot.snapshotItem(i);
            const n = `${path}.${(i + 1).toString().padStart(3, '0')}`;
            const ele = node?.childNodes[0] as Element;
            const label = ele.textContent;
            if (ele.nodeName === 'cblink') {
                const href = ele.getAttribute('href')!;
                const matches = /.*\/([A-Z]*).*n(.*)_.*.xml$/.exec(href)!;
                const work = matches[1] + matches[2];
                const catalog = catalogs[work];
                return Object.assign({ n, label }, catalog);
            }
            return { n, label };
        });
        const catalogLabel = doc.evaluate(`//nav/${catalogXPath}/../span`, doc, null, XPathResult.STRING_TYPE).stringValue || '';
        return { label: catalogLabel, results };
    } catch (error: any) {
        error.message = `path = ${path}\n${error.message}`;
        throw (error);
    }
}

export async function fetchWork(path: string) {
    isInit || await init();

    const pathFieldMatches = /([A-Z]*)(.*)/.exec(path)!;
    const bookId = pathFieldMatches[1];
    const sutra = pathFieldMatches[2];
    let work = catalogs[path];
    // E.g. XML/I/I01/I01n0012_001.xml.
    const re = new RegExp(`${bookId}[^n]*n${sutra}`);
    // eslint-disable-next-line no-useless-escape
    const juans = spines.filter(s => re.test(s)).map(s => +(new RegExp(`${bookId}[^n]*n${sutra}_(.*)\.xml`).exec(s)![1]));
    work.juan_list = juans.join(',');
    work.work = path;
    return { results: [work] };
}

export async function fetchJuan(work: string, juan: string) {
    isInit || await init();

    const work_info = (await fetchWork(work)).results[0];
    const stylesheetString = await getFileAsStringFromIndexedDB(`${Globals.cbetar2AssetDir}/tei.xsl`);
    const documentString = await getFileAsStringFromIndexedDB(`${cbetaBookcaseDir}/CBETA/XML/${work_info.id}/${work_info.vol}/${work_info.vol}n${work_info.sutra}_${juan.toString().padStart(3, '0')}.xml`);

    xsltProcessor.importStylesheet(stringToXml(stylesheetString));

    let xhtmlDoc = xsltProcessor.transformToDocument(stringToXml(documentString));
    let originalRootNode = xhtmlDoc.getRootNode().firstChild!;
    const rootNode = elementTPostprocessing(xhtmlDoc, originalRootNode);
    xhtmlDoc.getRootNode().removeChild(originalRootNode);
    xhtmlDoc.getRootNode().appendChild(rootNode);    
    const result = xhtmlDoc.documentElement.outerHTML;

    return {
        work_info,
        results: [result.replace(/\.\.\/figures/g, `cbetar://${cbetaBookcaseDir}/CBETA/figures`)],
    };
}

let lb = '';
function elementTPostprocessing(doc: Document, node: Node, parent: Node | null = null): Node {
    const c = node;
    if (c.nodeType === Node.ELEMENT_NODE) {
        let c2 = c as Element;
        if (c2.tagName === 'span') {
            if (c2.getAttribute('class') === 'lb') {
                lb = c2.getAttribute('l') || '';
                const id = c2.getAttribute('id') || '';
                c2.innerHTML = id;
            } else if (c2.getAttribute('class') === 't') {
                c2.setAttribute('l', lb);
            }

            // elementTPostprocessing could delete child nodes
            // and indexing could become wrong after child nodes list changed.
            // Thus, using backward traversal.
            for (let i = c2.childNodes.length - 1; i >= 0; i-- ) {
                elementTPostprocessing(doc, c2.childNodes[i], c2);
            }

            if (c2.textContent === '') {
                parent?.removeChild(node);
            } 
            return c2;
        } else if (c2.tagName === 'g') {
            const gaijiId = c2.getAttribute('ref')?.substring(1) || '';
            if (/^CB/.test(gaijiId)) {
                parent?.removeChild(c2);
                c2 = doc.createElement('span');
                c2.textContent = gaijis[gaijiId].uni_char || gaijis[gaijiId].composition;
                parent?.appendChild(c2);
            }
            return c2;
        } else {
            for (let i = c2.childNodes.length - 1; i >= 0; i-- ) {
                elementTPostprocessing(doc, c2.childNodes[i], c2);
            }
            return c2;
        }
    } else {
        return c;
    }
}

const CbetaOfflineIndexedDb = {
    init,
    fetchCatalogs,
    fetchWork,
    fetchJuan
};

export default CbetaOfflineIndexedDb;