import {BookMeta} from "./meta";
import args from "../lib/args";

export class Book {
  locator: string;
  meta: BookMeta;
  _current: number;
  total: number;
  _onPage: Function[] = [];

  constructor(path: string) {
    this.locator = path;
  }

  get current(): number {
    return this._current;
  }

  set current(page: number) {
    const old = this._current;
    this._current = page;
    this._onPage.forEach(cb => cb(page, old));
  }

  async init() {
    await args.wait();
    const url = `http://localhost:${args.port}/book?locator=${this.locator}`;
    const data = await fetch(url);
    this.meta = await data.json();
    if (!this.meta.Pages){
      throw new Error('no pages');
    }
    this.total = this.meta.Pages.length;
    this.current = 1;
  }

  goto(pageOrOffset: number, relative: boolean = false): boolean {
    const page = relative ? this.current + pageOrOffset : pageOrOffset;
    if (page > 0 && page <= this.total) {
      this.current = page;
      return true;
    }
  }

  prev(): boolean {
    return this.goto(-1, true);
  }

  next(): boolean {
    return this.goto(1, true);
  }

  getPageFilePath(id: string) {
    return `http://localhost:${args.port}/book/page?locator=${this.locator}&page=${id}`;
  }

  onPage(callback: (n?: number, old?: number) => void) {
    this._onPage.push(callback);
  }
}
