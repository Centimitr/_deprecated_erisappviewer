export class ConfigItem<T> {
  private listeners = [];
  private value: any;

  constructor(v?: T) {
    this.value = v;
  }

  set(v: T) {
    const old = this.value;
    this.value = v;
    if (old !== this.value) {
      this.listeners.forEach(cb => cb(this.value, old));
    }
  }

  get(): T {
    return this.value;
  }

  change(cb: Function) {
    return this.listeners.push(cb);
  }

  toValue(): T{
    return this.value;
  }

  toString(){
    return this.toValue().toString();
  }
}

export class Config {

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
      }
    }
  };

  // scale
  scale = new ConfigItem<number>(Config.SCALE_DEFAULT);
  static SCALE_MIN: number = 100;
  static SCALE_DEFAULT: number = 150;
  static SCALE_FULL_WIDTH: number = Infinity;
  static SCALE_ALL: number[] = [Config.SCALE_MIN, Config.SCALE_DEFAULT, Config.SCALE_FULL_WIDTH];

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
}
