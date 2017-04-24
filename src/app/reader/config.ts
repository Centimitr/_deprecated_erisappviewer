import {BookMeta} from "./meta";
import {ViewerComponent} from "../viewer/viewer.component";
import {Book} from "app/reader/book";
import {QueryList} from "@angular/core";
let cnt = 0;
const pt = v => console.log(cnt++, v);
export interface CheckInterface {
  ok: boolean;
  err?: string;
  correctedValue?: any;
}

export class ConfigItem<T> {
  private listeners = [];
  private value: any;
  private test: Function;

  constructor(v?: T) {
    this.value = v;
  }

  check(v?: T): CheckInterface {
    return this.test ? this.test(v === undefined ? this.value : v) : {ok: true};
  }

  set(v: T) {
    const r: CheckInterface = this.check(v);
    if (!r.ok) {
      return r.err;
    }
    const old = this.value;
    this.value = v;
    if (old !== this.value) {
      this.listeners.forEach(cb => cb(this.value, old));
    }
    return true;
  }

  setCheck(test: Function) {
    this.test = test;
    const r: CheckInterface = this.check(this.value);
    if (r.ok) {
      this.value = r.correctedValue;
    }
  }

  get(): T {
    return this.value;
  }

  change(cb: Function) {
    return this.listeners.push(cb);
  }

  toValue(): T {
    return this.value;
  }

  toString() {
    return this.toValue().toString();
  }
}

export class Config {

  recentlyEnjoyedLen: number = 10;

  // appearance
  ui: object = {
    view: {
      continuousScroll: {
        before: 5,
        interval: 0,
        after: 0,
      },
      singlePage: {
        before: 5,
        after: 5
      },
      before: 5,
      after: 5,
      intervalCorrection: 5
    }
  };

  // scale
  scale = new ConfigItem<number>(Config.SCALE_DEFAULT);
  static SCALE_DEFAULT: number = 150;
  static SCALE_FULL_HEIGHT: number = 100;
  static SCALE_FULL_WIDTH: number = Infinity;
  static SCALE_ALL: number[] = [Config.SCALE_FULL_HEIGHT, Config.SCALE_DEFAULT, Config.SCALE_FULL_WIDTH];
  maxScale: number = 100000;

  setMaxScale(book: Book, viewers: QueryList<ViewerComponent>) {
    if (book.meta.Pages.length && viewers.length) {
      const containerW = viewers.map(v => v.elm.offsetWidth).reduce((a, b) => a > b ? a : b);
      const imgMinWidth = book.meta.Pages.map(pm => pm.Width).reduce((a, b) => a < b ? a : b);
      this.maxScale = 100 * containerW / imgMinWidth;
    }
  }

  isFullWidth(): boolean {
    return this.scale.get() === Config.SCALE_FULL_WIDTH;
  }

  whenFullWidth(v: any): boolean {
    if (this.isFullWidth()) {
      return v;
    }
  }

  whenNotFullWidth(v: any): boolean {
    if (!this.isFullWidth()) {
      return v;
    }
  }

  isFullHeight(): boolean {
    return this.scale.get() === Config.SCALE_FULL_HEIGHT;
  }

  whenFullHeight(v: any): boolean {
    if (this.isFullHeight()) {
      return v;
    }
  }

  whenNotFullHeight(v: any): boolean {
    if (!this.isFullHeight()) {
      return v;
    }
  }

  // view
  view = new ConfigItem<number>(Config.VIEW_SINGLE_PAGE);
  static VIEW_CONTINUOUS_SCROLL: number = 0;
  static VIEW_SINGLE_PAGE: number = 1;
  static VIEW_ALL: number[] = [Config.VIEW_CONTINUOUS_SCROLL, Config.VIEW_SINGLE_PAGE];

  isContinuousScroll(): boolean {
    return this.view.get() === Config.VIEW_CONTINUOUS_SCROLL;
  }

  whenContinuousScroll(v: any) {
    if (this.isContinuousScroll()) {
      return v;
    }
  }

  isSinglePage(): boolean {
    return this.view.get() === Config.VIEW_SINGLE_PAGE;
  }

  whenSinglePage(v: any) {
    if (this.isSinglePage()) {
      return v;
    }
  }

  // mixed
  whenNotSinglePageFullHeight(v: any) {
    if (this.isSinglePage() && this.isFullHeight()) return;
    return v;
  }
}
