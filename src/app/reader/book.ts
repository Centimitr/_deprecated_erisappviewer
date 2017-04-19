import {BookMeta} from "./meta";
import args from "../lib/args";
import {Config} from "./config";

export class Book {
  locator: string;
  meta: BookMeta;
  _current: number;
  total: number;
  _onPage: Function[] = [];
  _viewers: HTMLElement[];

  constructor(path: string, private config: Config) {
    this.locator = path;
  }

  bind(elms: HTMLElement[]) {
    this._viewers = elms;
  }

  get current(): number {
    return this._current;
  }

  set current(page: number) {
    const old = this._current;
    this._current = page;
    this._onPage.forEach(cb => cb(page, old));
  }

  async init(): Promise<any> {
    await args.wait();
    const url = new URL(`http://localhost:${args.port}/book`);
    url['searchParams'].append('locator', this.locator);
    const data = await fetch(url.href);
    this.meta = await data.json();
    if (!this.meta.Pages) {
      return 'no pages';
    }
    this.total = this.meta.Pages.length;
    this.current = 1;
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

  go(pageOrOffset: number, relative: boolean = false): boolean {
    const page = relative ? this.current + pageOrOffset : pageOrOffset;
    const ok = this.checkPage(page);
    if (ok) {
      const viewer = this._viewers[page - 1];
      if (this.config.isSinglePage()) {
        this.current = page;
        setTimeout(() => {
          viewer.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 0);
      } else {
        viewer.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

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

  getPageFilePath(id: string) {
    const url = new URL(`http://localhost:${args.port}/book/page`);
    url['searchParams'].append('locator', this.locator);
    url['searchParams'].append('page', id);
    return url.href;
  }

  onPage(callback: (n?: number, old?: number) => void) {
    this._onPage.push(callback);
  }
}
