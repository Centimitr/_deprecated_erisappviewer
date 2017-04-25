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
  protected value: any;
  private _lock: boolean = false;

  constructor(v?: T) {
    this.value = v;
  }

  set(v: T): boolean {
    if (this._lock) return false;

    const old = this.value;
    if (old !== v) {
      this.value = v;
      this.listeners.forEach(cb => cb(this.value, old));
    }
    return true;
  }

  get(): T {
    return this.value;
  }

  lock() {
    this._lock = true;
  }

  unlock() {
    this._lock = false;
  }

  clear() {
    this.listeners = [];
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

export class ConfigRangedItem extends ConfigItem<number> {
  public min: number;
  public max: number;

  constructor(v: number, min: number, max: number) {
    super(v);
    [this.min, this.max] = [min, max];
  }

  setRange(min, max) {
    if (min >= max) console.error('min should be smaller than max');
    [this.min, this.max] = [min, max];
    if (this.value < this.min) this.set(this.min);
    else if (this.value > this.max) this.set(this.max);
  }

  inRange(v: number) {
    return this.min <= v && v <= this.max;
  }

  set(v: number): boolean {
    if (this.inRange(v)) return super.set(v);
    else return false;
  }
}

export class Config {

  recentlyEnjoyedLen: number = 10;
  natureScroll: boolean = true;

  // appearance
  ui: any = {
    view: {
      before: 50,
      after: 50,
      intervalCorrection: 50,
      zoomUnit: 10
    }
  };

  clear() {
    this.pinch.clear();
    this.scale.clear();
    this.view.clear();
  }

  pinch = new ConfigItem<number>(1);

  // scale
  static SCALE_DEFAULT: number = 150;
  static SCALE_FULL_HEIGHT: number = 100;
  static SCALE_FULL_WIDTH: number = Infinity;
  static SCALE_ALL: number[] = [Config.SCALE_FULL_HEIGHT, Config.SCALE_DEFAULT, Config.SCALE_FULL_WIDTH];
  scale = new ConfigRangedItem(Config.SCALE_DEFAULT, 100, 100000);

  private _onSetScaleConstraint: Function[] = [];

  onSetScaleConstraint(cb: Function) {
    this._onSetScaleConstraint.push(cb);
  }

  setFullHeight() {
    this.scale.lock();
    return this.scale.set(Config.SCALE_FULL_HEIGHT);
  }

  setFullWidth() {
    this.scale.lock();
    return this.scale.set(Config.SCALE_FULL_WIDTH);
  }

  setDefault() {
    this.scale.unlock();
    return this.scale.set(Config.SCALE_DEFAULT);
  }

  setScaleConstraint(book: Book, viewers: QueryList<ViewerComponent>) {
    if (book.meta.Pages.length && viewers.length) {
      const vw = viewers.map(v => v.elm.offsetWidth).reduce((a, b) => a > b ? a : b);
      const vh = viewers.map(v => v.elm.offsetHeight).reduce((a, b) => a > b ? a : b);
      const imgMinW = book.meta.Pages.map(pm => pm.Width).reduce((a, b) => a < b ? a : b);
      const imgMinH = book.meta.Pages.map(pm => pm.Height).reduce((a, b) => a < b ? a : b);
      const MIN_HEIGHT_PROPORTION = 65;
      const MIN_WIDTH_PROPORTION = 35;
      this.scale.setRange(Math.max(MIN_HEIGHT_PROPORTION * vh / imgMinH, MIN_WIDTH_PROPORTION * vw / imgMinW), 100 * vw / imgMinW);
      this._onSetScaleConstraint.forEach(cb => cb(this.scale.min, this.scale.max));
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
  whenSinglePageNotFullHeight(v: any) {
    if (this.isSinglePage() && !this.isFullHeight()) return v;
  }
}
