export class Config {
  // scale
  scale: number = Config.SCALE_DEFAULT;
  static SCALE_MIN: number = 100;
  static SCALE_DEFAULT: number = 133;
  static SCALE_MAX: number = Infinity;
  static SCALE_ALL: number[] = [Config.SCALE_MIN, Config.SCALE_DEFAULT, Config.SCALE_MAX];

  setScale(s: number) {
    this.scale = s;
  }

  // view
  view: number = Config.VIEW_SINGLE_PAGE;
  static VIEW_CONTINUOUS_SCROLL: number = 0;
  static VIEW_SINGLE_PAGE: number = 1;
  static VIEW_ALL: number[] = [Config.VIEW_CONTINUOUS_SCROLL, Config.VIEW_SINGLE_PAGE];

  setView(v: number) {
    this.view = v;
  }

  isContinuousScroll() {
    return this.view === Config.VIEW_CONTINUOUS_SCROLL;
  }

  whenContinuousScroll(v: any) {
    if (this.isContinuousScroll()) {
      return v;
    }
  }

  isSinglePage() {
    return this.view === Config.VIEW_SINGLE_PAGE;
  }

}
