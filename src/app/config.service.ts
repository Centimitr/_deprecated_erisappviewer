import {Injectable} from "@angular/core";
import {Scale} from "./image/scale";
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
      setTimeout(() => {
        this.listeners.forEach(cb => cb(this.value, old));
      }, 0);
    }
    return true;
  }

  get(): T {
    return this.value;
  }

  is(v: T): boolean {
    return this.value === v;
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
    this.listeners.push(cb);
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
    if (min >= max) console.error('min should be smaller than max:', min, max);
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

@Injectable()
export class Config {

  recentlyEnjoyedLen: number = 10;
  scrollDirection: boolean = true;

  // appearance
  ui: any = {
    view: {
      before: 5,
      after: 0,
      eachAfter: 5,
      zoomUnit: 5
    }
  };

  clear() {
    this.pinch.clear();
    this.view.clear();
  }

  pinch = new ConfigItem<number>(1);

  // scale
  static SCALE_DEFAULT = new Scale(null, 100, null, 150);
  static SCALE_MAXHEIGHT = new Scale(null, 100, null, 100);
  static SCALE_FULLWIDTH = new Scale(100, 100, null, null);
  static SCALE_ALL: Scale[] = [Config.SCALE_MAXHEIGHT, Config.SCALE_DEFAULT, Config.SCALE_FULLWIDTH];
  scale = new ConfigItem<Scale>(Config.SCALE_DEFAULT);

  // mode
  // mode = new ConfigItem<number>(Config.MODE_DEFAULT);
  // static MODE_DEFAULT: number = 0;
  // static MODE_FULL_HEIGHT: number = 1;
  // static MODE_FULL_WIDTH: number = 2;
  // static MODE_ALL: number[] = [Config.MODE_FULL_HEIGHT, Config.MODE_DEFAULT, Config.MODE_FULL_WIDTH];

  // scale
  // defaultScale: number = 150;
  // scale = new ConfigRangedItem(this.defaultScale, 100, 100000);
  // private _onSetScaleConstraint: Function[] = [];

  // onSetScaleConstraint(cb: Function) {
  //   this._onSetScaleConstraint.push(cb);
  // }

  // setScaleConstraint(book: Book, reader: HTMLElement, viewers: QueryList<ViewerComponent>) {
  //   if (book.meta.Pages.length && viewers.length) {
  //     const vw = Math.max(...viewers.map(v => v.elm.offsetWidth));
  //     const vh = Math.max(...viewers.map(v => v.elm.offsetHeight));
  // const imgWs = viewers.map(v => v.oriWidth).filter(v => v);
  // const imgHs = viewers.map(v => v.oriHeight).filter(v => v);
  // if (!imgWs.length || !imgHs.length) return;
  // const MIN_HEIGHT_PROPORTION = 65;
  // const MIN_WIDTH_PROPORTION = 30;
  // this.scale.setRange(100 * 375 / reader.offsetHeight, 100 * reader.offsetWidth / Math.min(...imgWs));
  // this._onSetScaleConstraint.forEach(cb => cb(this.scale.min, this.scale.max));
  // }
  // }

  // isFullWidth(): boolean {
  //   return this.mode.is(Config.MODE_FULL_WIDTH);
  // }
  //
  // whenFullWidth(v: any): boolean {
  //   if (this.isFullWidth()) {
  //     return v;
  //   }
  // }
  //
  // whenNotFullWidth(v: any): boolean {
  //   if (!this.isFullWidth()) {
  //     return v;
  //   }
  // }
  //
  isMaxlHeight(): boolean {
    return this.scale.is(Config.SCALE_MAXHEIGHT);
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
    return this.view.is(Config.VIEW_SINGLE_PAGE);
  }

  // mixed
  // whenSinglePageNotFullHeight(v: any) {
  //   if (this.isSinglePage() && !this.isFullHeight()) return v;
  // }
}
