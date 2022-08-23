import Constants from "./Constants";
import Globals from "./Globals";
import IndexedDbFuncs from "./IndexedDbFuncs";
import { CbetaDbMode } from "./models/Settings";

async function wait(ms: number = 1000) {
    return new Promise<void>(ok => {
        setTimeout(ok, ms);
    });
}

const electronBackendApi: {
    send: (channel: string, data: any) => {},
    receive: (channel: string, func: Function) => {},
    receiveOnce: (channel: string, func: Function) => {},
    invoke: (channel: string, data: any) => Promise<any>,
} = (window as any).electronBackendApi;

const cbetaBookcaseDir = 'Bookcase';
const bookcaseInfosKey = 'bookcaseInfos';
const bookcaseInfosVersion = 4;
const filesFilter = [
    /.*rj-gif.*/,
    /.*sd-gif.*/,
    /.*XML.*/,
    /.*bulei_nav.xhtml/,
    /.*advance_nav.xhtml/,
    /.*catalog.txt/,
    /.*spine.txt/,
    /.*figures.*/,
];

interface CatalogDetails {
    file: string;
    work: string;
    work2: string;
    juan: number;
    juan_start: 1;
    juan_list: string;
    category: string;
    creators: string;
    title: string;
    id: string;
    vol: string;
    vol_juan_start: number;
    volId: number;
    vols: string[];
    vols_juans: number[];
    sutra: string;
}

export interface CatalogNode extends CatalogDetails {
    n: string;
    label: string;
    children: CatalogNode[];
}

interface BookcaseInfos {
    catalogs: { [key: string]: CatalogDetails };
    catalogTree: CatalogNode;
    spines: string[];
    gaijis: { [key: string]: { uni_char: string, composition: string } };
    teiStylesheetString: string;
    version: number;
};

const xmlParser = new DOMParser();
const xsltProcessor = new XSLTProcessor();
const textDecoder = new TextDecoder();
let bookcaseInfos: BookcaseInfos = {
    catalogs: {},
    catalogTree: {} as CatalogNode,
    spines: [],
    gaijis: {},
    teiStylesheetString: '',
    version: bookcaseInfosVersion,
};
let isInit = false;
let isInitializing = false;

function stringToXml(str: string) {
    return xmlParser.parseFromString(str, 'text/xml');
}

async function getFileAsStringFromIndexedDB(file: string) {
    return textDecoder.decode((await IndexedDbFuncs.getZippedFile(file)) as Uint8Array);
}

let isOfflineFileSystemV2Ready = false;
export async function setOfflineFileSystemV2Ready() {
    isOfflineFileSystemV2Ready = true;
}

export async function init(mode: CbetaDbMode) {
    // Avoid multiple inits.
    if (isInitializing) {
        return new Promise<void>(ok => {
            const timer = setInterval(() => {
                if (isInit) {
                    clearInterval(timer);
                    ok();
                }
            }, 100);
        });
    }
    isInitializing = true;

    // Try to load bookcaseInfos cache.
    try {
        if (await IndexedDbFuncs.checkKey(bookcaseInfosKey)) {
            const bookcaseInfosTemp = await IndexedDbFuncs.getFile<BookcaseInfos>(bookcaseInfosKey);
            if (bookcaseInfosTemp.version === bookcaseInfosVersion) {
                bookcaseInfos = bookcaseInfosTemp;
            }
        }
    } catch (error) {
        // Ignore.
    }

    if (bookcaseInfos.spines.length === 0) {
        if (mode === CbetaDbMode.OfflineIndexedDb) {
            const catalogsString = await getFileAsStringFromIndexedDB(`/${cbetaBookcaseDir}/CBETA/catalog.txt`);
            const spinesString = await getFileAsStringFromIndexedDB(`/${cbetaBookcaseDir}/CBETA/spine.txt`);
            const documentString = await getFileAsStringFromIndexedDB(`/${cbetaBookcaseDir}/CBETA/bulei_nav.xhtml`);
            const gaijisString = await getFileAsStringFromIndexedDB(`/${Globals.cbetar2AssetDir}/cbeta_gaiji.json`);
            const stylesheetString = await getFileAsStringFromIndexedDB(`/${Globals.cbetar2AssetDir}/nav_fix.xsl`);
            const teiStylesheetString = await getFileAsStringFromIndexedDB(`/${Globals.cbetar2AssetDir}/tei.xsl`);
            await initFromFiles(catalogsString, spinesString, gaijisString, stylesheetString, documentString, teiStylesheetString);
        } else if (mode === CbetaDbMode.OfflineFileSystemV2) {
            await new Promise<void>(ok => {
                const timer = setInterval(() => {
                    if (isOfflineFileSystemV2Ready) {
                        clearInterval(timer);
                        ok();
                    }
                }, 100);
            });

            const catalogsString = (await readBookcaseFromFileSystemV2(`CBETA/catalog.txt`));
            await wait();
            const spinesString = (await readBookcaseFromFileSystemV2(`CBETA/spine.txt`));
            await wait();
            const documentString = (await readBookcaseFromFileSystemV2(`CBETA/bulei_nav.xhtml`));
            await wait();
            const gaijisString = await getFileAsStringFromIndexedDB(`/${Globals.cbetar2AssetDir}/cbeta_gaiji.json`);
            const stylesheetString = await getFileAsStringFromIndexedDB(`/${Globals.cbetar2AssetDir}/nav_fix.xsl`);
            const teiStylesheetString = await getFileAsStringFromIndexedDB(`/${Globals.cbetar2AssetDir}/tei.xsl`);
            await initFromFiles(catalogsString, spinesString, gaijisString, stylesheetString, documentString, teiStylesheetString);
        } else if (mode === CbetaDbMode.OfflineFileSystemV3) {
            await new Promise<void>(ok => {
                const timer = setInterval(() => {
                    if (isOfflineFileSystemV2Ready) {
                        clearInterval(timer);
                        ok();
                    }
                }, 100);
            });

            const catalogsString = (await readBookcaseFromFileSystemV3(`CBETA/catalog.txt`));
            const spinesString = (await readBookcaseFromFileSystemV3(`CBETA/spine.txt`));
            const documentString = (await readBookcaseFromFileSystemV3(`CBETA/bulei_nav.xhtml`));
            const gaijisString = await getFileAsStringFromIndexedDB(`/${Globals.cbetar2AssetDir}/cbeta_gaiji.json`);
            const stylesheetString = await getFileAsStringFromIndexedDB(`/${Globals.cbetar2AssetDir}/nav_fix.xsl`);
            const teiStylesheetString = await getFileAsStringFromIndexedDB(`/${Globals.cbetar2AssetDir}/tei.xsl`);
            await initFromFiles(catalogsString, spinesString, gaijisString, stylesheetString, documentString, teiStylesheetString);
        }
    }

    isInit = true;
}

export async function initFromFiles(catalogsString: string, spinesString: string, gaijisString: string, stylesheetString: string, documentString: string, teiStylesheetString: string) {
    const catalogsStrings = catalogsString.split(/\r\n/);
    let lastWork = '';
    let juan = 0;
    let vols: string[] = [];
    let vols_juans: number[] = [];
    bookcaseInfos.catalogs = (Object).fromEntries(
        catalogsStrings.map((l: string) => {
            const f = l.split(/\s*,\s*/);
            const file = `${f[0]}${f[4]}`;
            const vol = `${f[0]}${f[3]}`;
            const vol_jauns = +f[5];
            if (lastWork !== file) {
                lastWork = file;
                juan = 0;
                vols = [vol];
                vols_juans = [vol_jauns];
            } else {
                vols.push(vol);
                vols_juans.push(vol_jauns);
            }
            juan += vol_jauns;
            return [file, { file, work: file, juan: juan, juan_start: 1, category: f[1], creators: f[7], title: f[6], id: f[0], vol, vols, vols_juans, sutra: f[4] } as CatalogDetails];
        })
    );

    const spinesStrs = spinesString.split(/\r\n/);
    bookcaseInfos.spines = spinesStrs.map((l: string) => {
        const f = l.split(/\s*,\s*/);
        return f[0];
    })

    bookcaseInfos.gaijis = JSON.parse(gaijisString);

    bookcaseInfos.catalogTree = await fetchAllCatalogsInternal(stylesheetString, documentString);

    bookcaseInfos.teiStylesheetString = teiStylesheetString;

    IndexedDbFuncs.saveFile(bookcaseInfosKey, bookcaseInfos);
}

export async function fetchCatalogs(path: string, mode: CbetaDbMode) {
    isInit || await init(mode);
    let paths = path.split('.');
    let subpaths = paths.slice(1);
    try {
        let node = bookcaseInfos.catalogTree;
        for (let i = 0; i < subpaths.length; i++) {
            node = node.children[+subpaths[i] - 1];
        }
        return { n: node.n, label: node.label, results: node.children };
    } catch (error: any) {
        error.message = `path = ${path}\n${error.message}`;
        throw (error);
    }
}

let thisWork = '';
let thisWorkVolId = 0;
let vol_juan_start = 1;
function fetchSubcatalogs(node: Node | ChildNode, n: string): CatalogNode {
    const ele = node.childNodes[0] as Element;
    const label = ele.textContent;
    if (ele.nodeName === 'cblink') {
        const href = ele.getAttribute('href')!;
        const matches = /.*\/([A-Z]*).*n(.*)_.*.xml$/.exec(href)!;
        const work = matches[1] + matches[2];
        thisWorkVolId++;
        if (thisWork !== work) {
            thisWork = work;
            thisWorkVolId = 0;
            vol_juan_start = 1;
        }
        const catalog = bookcaseInfos.catalogs[work];
        let work2 = work;
        if (catalog.vols.length > 1) {
            work2 += String.fromCharCode('a'.charCodeAt(0) + thisWorkVolId);
            if (thisWorkVolId > 0) {
                vol_juan_start += catalog.vols_juans[thisWorkVolId - 1];
            }
        }
        return Object.assign({ n, label, work2, vol_juan_start, volId: thisWorkVolId }, catalog) as CatalogNode;
    }
    let children: CatalogNode[] = [];
    for (let c = 1; c < node.childNodes.length; c++) {
        const ele = node.childNodes[c] as Element;
        // Node containing subcatalogs.
        if (ele.nodeName === 'ol') {
            let i = 1;
            ele.childNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return;
                }

                const subN = `${n}.${(i).toString().padStart(3, '0')}`;
                if (node.hasChildNodes()) {
                    children.push(fetchSubcatalogs(node, subN));
                }
                i++;
            })
        }
    }
    return { n, label, children } as CatalogNode;
}

async function fetchAllCatalogsInternal(stylesheetString: string, documentString: string): Promise<CatalogNode> {

    //const catalogTypeIsBulei = subpaths.shift() === 'CBETA';
    try {
        const n = 'CBETA';
        let navDocBulei: Document;
        xsltProcessor.importStylesheet(stringToXml(stylesheetString));
        navDocBulei = xsltProcessor.transformToDocument(stringToXml(documentString));
        const doc = navDocBulei;
        const nodesSnapshot = doc.evaluate(`//nav`, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
        const nodeNav = nodesSnapshot.snapshotItem(0)!;
        const children = Array.from({ length: nodeNav.childNodes.length }, (v, i) => {
            const subN = `${n}.${(i + 1).toString().padStart(3, '0')}`;
            return fetchSubcatalogs(nodeNav.childNodes[i], subN)
        });
        return { n, label: 'CBETA 部類目錄', children } as CatalogNode;
    } catch (error: any) {
        error.message = `${error.message}`;
        throw (error);
    }
}

export async function fetchAllCatalogs(mode: CbetaDbMode): Promise<CatalogNode> {
    isInit || await init(mode);

    return bookcaseInfos.catalogTree;
}

export async function fetchWork(path: string, mode: CbetaDbMode) {
    isInit || await init(mode);

    const pathFieldMatches = /([A-Z]*)(.*)/.exec(path)!;
    const bookId = pathFieldMatches[1];
    const sutra = pathFieldMatches[2];
    let work = bookcaseInfos.catalogs[path];
    // E.g. XML/I/I01/I01n0012_001.xml.
    const re = new RegExp(`${bookId}[^n]*n${sutra}`);
    // eslint-disable-next-line no-useless-escape
    const juans = bookcaseInfos.spines.filter(s => re.test(s)).map(s => +(new RegExp(`${bookId}[^n]*n${sutra}_(.*)\.xml`).exec(s)![1]));
    work.juan_list = juans.join(',');
    work.work = path;
    return { results: [work] };
}

export async function fetchJuan(work: string, juan: string, mode: CbetaDbMode) {
    isInit || await init(mode);

    const work_info = (await fetchWork(work, mode)).results[0];
    let juanTemp = 0;
    let vol = '';
    for (let i = 0; i < work_info.vols.length; i++) {
        juanTemp += work_info.vols_juans[i];
        if (+juan <= juanTemp) {
            vol = work_info.vols[i];
            break;
        }
    }
    let documentString = '';
    let figurePath = '';
    const xmlPath = `CBETA/XML/${work_info.id}/${vol}/${vol}n${work_info.sutra}_${juan.toString().padStart(3, '0')}.xml`;
    if (mode === CbetaDbMode.OfflineIndexedDb) {
        documentString = await getFileAsStringFromIndexedDB(`/${cbetaBookcaseDir}/${xmlPath}`);
        figurePath = `https://${Constants.indexedDBHost}/${cbetaBookcaseDir}/CBETA/figures`;
    } else if (mode === CbetaDbMode.OfflineFileSystemV2) {
        documentString = await readBookcaseFromFileSystemV2(xmlPath);
        figurePath = `${Globals.localFileProtocolName}://${cbetaBookcaseDir}/CBETA/figures`;
    } else if (mode === CbetaDbMode.OfflineFileSystemV3) {
        documentString = await readBookcaseFromFileSystemV3(xmlPath);
        figurePath = `${Globals.localFileProtocolName}://${cbetaBookcaseDir}/CBETA/figures`;
    }

    xsltProcessor.importStylesheet(stringToXml(bookcaseInfos.teiStylesheetString));

    let xhtmlDoc = xsltProcessor.transformToDocument(stringToXml(documentString));
    let originalRootNode = xhtmlDoc.getRootNode().firstChild!;
    const rootNode = await elementTPostprocessing(xhtmlDoc, originalRootNode);
    xhtmlDoc.getRootNode().removeChild(originalRootNode);
    xhtmlDoc.getRootNode().appendChild(rootNode!);
    const result = xhtmlDoc.documentElement.outerHTML;

    return {
        work_info,
        results: [result.replace(/\.\.\/figures/g, figurePath)],
    };
}

let lb = '';
async function elementTPostprocessing(doc: Document, node: Node, parent: Node | null = null) {
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
            for (let i = c2.childNodes.length - 1; i >= 0; i--) {
                await elementTPostprocessing(doc, c2.childNodes[i], c2);
            }

            if (c2.textContent === '') {
                parent?.removeChild(node);
            }
            return c2;
        } else if (c2.tagName === 'g') {
            const gaijiId = c2.getAttribute('ref')?.substring(1) || '';
            if (/^CB/.test(gaijiId)) {
                const newC2 = doc.createElement('span');
                newC2.setAttribute('class', 't');
                newC2.textContent = bookcaseInfos.gaijis[gaijiId].uni_char || bookcaseInfos.gaijis[gaijiId].composition;
                parent?.replaceChild(newC2, c2);
            }
            return c2;
        } else {
            for (let i = c2.childNodes.length - 1; i >= 0; i--) {
                await elementTPostprocessing(doc, c2.childNodes[i], c2);
            }
            return c2;
        }
    } else {
        return c;
    }
}

async function readResourceFromFileSystemV2(path: string) {
    electronBackendApi?.send('toMain', { event: 'readResource', path: path });
    return new Promise<any>((ok, fail) => {
        electronBackendApi?.receiveOnce('fromMain', (data: any) => {
            switch (data.event) {
                case 'readResource':
                    if (data.error) {
                        fail(data.error);
                    } else {
                        ok(data.data);
                    }
                    break;
            }
        });
    });
}

async function readBookcaseFromFileSystemV2(path: string) {
    electronBackendApi?.send('toMain', { event: 'readBookcase', path: path });
    return new Promise<any>((ok, fail) => {
        electronBackendApi?.receiveOnce('fromMain', (data: any) => {
            switch (data.event) {
                case 'readBookcase':
                    if (data.error) {
                        fail(data.error);
                    } else {
                        ok(data.data);
                    }
                    break;
            }
        });
    });
}

async function readResourceFromFileSystemV3(path: string) {
    return electronBackendApi?.invoke('toMainV3', { event: 'readResource', path: path }).then((data: any) => {
        if (data.error) {
            return Promise.reject(data.error);
        } else {
            return Promise.resolve(data.data);
        }
    });
}

async function readBookcaseFromFileSystemV3(path: string) {
    return electronBackendApi?.invoke('toMainV3', { event: 'readBookcase', path: path }).then((data: any) => {
        if (data.error) {
            return Promise.reject(data.error);
        } else {
            return Promise.resolve(data.data);
        }
    });
}

const CbetaOfflineDb = {
    bookcaseInfosKey,
    electronBackendApi,
    filesFilter,
    init,
    fetchCatalogs,
    fetchAllCatalogs,
    fetchWork,
    fetchJuan,
    setOfflineFileSystemV2Ready,
    readResourceFromFileSystemV2,
    readResourceFromFileSystemV3,
};

export default CbetaOfflineDb;