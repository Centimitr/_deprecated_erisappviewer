import {BookMeta, PageMeta} from "./meta";
import args from "../lib/args";
import {Config} from "../config.service";
import {ImageComponent} from "../image/image.component";
import {get} from "../lib/get";
const getSubBookNames = function (pms: PageMeta[]) {
  const m = new Map();
  pms.forEach(pm => m.set(pm.SubBook, 1));
  return Array.from(m.keys()).sort((a, b) => a.length - b.length);
};

export class Book {
  locator: string;
  meta: BookMeta;
  _current: number;
  total: number;
  _onPage: Function[] = [];

  constructor(path: string, private config: Config) {
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

  async init(): Promise<any> {
    await args.wait();
    const data = await get(`http://localhost:${args.port}/book`, {locator: this.locator});
    this.meta = await data.json();
    if (!this.meta.Pages || !this.meta.Pages.length) {
      return 'no pages';
    }
    this.subBooks = getSubBookNames(this.meta.Pages);
    this.setSubBook(this.subBooks[0]);
  }

  setSubBook(name: string) {
    this.curSubBook = name;
    this.current = 1;
    this.total = this.pages().length;
  }

  pages() {
    return this.meta && this.meta.Pages ? this.meta.Pages.filter(pm => pm.SubBook === this.curSubBook) : [];
  }

  private checkPage(page: number) {
    if (page > 0 && page <= this.total) {
      return true;
    }
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
    const url = new URL(`http://localhost:${args.port}/book/page`);
    url['searchParams'].append('locator', this.locator);
    url['searchParams'].append('page', imgLocator);
    return url.href;
  }

  onPage(callback: (n?: number, old?: number) => void) {
    this._onPage.push(callback);
  }

  onPageRemove(callback: (n?: number, old?: number) => void) {
    this._onPage = this._onPage.filter(cb => cb !== callback);
  }

  getLastReadIndex() {
    return this.meta.Pages.map(pm => pm.Locator).indexOf(this.meta.LastRead);
  }
}
