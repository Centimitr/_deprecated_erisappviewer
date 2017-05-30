import {BookMeta, PageMeta} from "./meta";
import args from "../lib/args";
import {Config} from "../config.service";
import {ImageComponent} from "../image/image.component";
import {get} from "../lib/get";
import {AppStorage} from "../lib/storage";
const getSubBookNames = function (pms: PageMeta[]) {
  const m = new Map();
  pms.forEach(pm => m.set(pm.SubBook, 1));
  return Array.from(m.keys()).sort((a, b) => a.length - b.length);
};
const {webFrame} = window['require']('electron');

export class Book {
  locator: string;
  meta: BookMeta;
  _current: number;
  total: number;
  _onPage: Function[] = [];

  constructor(path: string, private config: Config, private s: AppStorage) {
    this.locator = path;
  }

  get current(): number {
    return this._current;
  }

  set current(page: number) {
    const old = this._current;
    this._current = page;
    if (old !== page) {
      this._onPage.forEach(cb => cb(page, old));
    }
  }

  subBooks: string[];
  curSubBook: string;
  private _onSubBook: Function[] = [];

  async init(): Promise<any> {
    await args.wait();
    const data = await get(`https://localhost:${args.port}/book`, {
      locator: this.locator,
      keys: this.s.get('preferences.config').get().rarPasswords
    });
    this.meta = await data.json();
    if (!this.meta.Pages || !this.meta.Pages.length) {
      return 'Sorry, no book found in this folder.';
    }
    this.subBooks = getSubBookNames(this.meta.Pages);
    this.setSubBook(this.subBooks[0]);
  }

  onSubBook(fn: Function) {
    this._onSubBook.push(fn);
  }

  setSubBook(name: string) {
    webFrame.clearCache();
    this.curSubBook = name;
    this.current = 1;
    this.total = this.pages().length;
    this._onSubBook.forEach(fn => fn());
  }

  pages() {
    return this.meta && this.meta.Pages ? this.meta.Pages.filter(pm => pm.SubBook === this.curSubBook) : [];
  }

  private checkPage(page: number) {
    return page > 0 && page <= this.total;
  }

  updateCurrent(page: number): boolean {
    const ok = this.checkPage(page);
    if (ok) {
      this.current = page;
    }
    return ok;
  }

  // used for go in continuous scroll mode
  private imgs: ImageComponent[];

  bind(imgs: ImageComponent[]) {
    this.imgs = imgs;
  }

  go(pageOrOffset: number, relative: boolean = false): boolean {
    const page = relative ? this.current + pageOrOffset : pageOrOffset;
    const ok = this.checkPage(page);
    if (ok) {
      if (this.config.isSinglePage()) {
        this.current = page;
      } else if (this.config.isContinuousScroll()) {
        const img = this.imgs[page - 1];
        img.scrollTo();
      }
    }
    return ok;
  }

  prev(page?: number): boolean {
    return this.go((page || 0) - 1, !page);
  }

  next(page?: number): boolean {
    return this.go((page || 0) + 1, !page);
  }

  getPageFilePath(imgLocator: string) {
    const url = new URL(`https://localhost:${args.port}/book/page`);
    url['searchParams'].append('locator', this.locator);
    url['searchParams'].append('page', imgLocator);
    url['searchParams'].append('keys', this.s.get('preferences.config').get().rarPasswords);
    return url.href;
  }

  onPage(callback: (n?: number, old?: number) => void) {
    this._onPage.push(callback);
  }

  onPageRemove(callback: (n?: number, old?: number) => void) {
    this._onPage = this._onPage.filter(cb => cb !== callback);
  }

  // interface
  pHasPageLoaded: Function;

  hasPageLoaded(): Promise<void> {
    return new Promise<void>(resolve => this.pHasPageLoaded = resolve);
  }

  ensureHasPageLoaded() {
    if (this.pHasPageLoaded) this.pHasPageLoaded();
  }

  // last read
  getLastReadIndex() {
    return this.meta.Pages.map(pm => pm.Locator).indexOf(this.meta.LastRead);
  }
}
