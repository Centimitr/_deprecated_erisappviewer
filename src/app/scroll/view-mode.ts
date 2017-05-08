import {Config} from "../config.service";
import {ImageComponent} from "../image/image.component";
import {Book} from "../reader/book";
import {CacheManager} from "./cache-manager";
import {LatestRunner} from "../lib/util";
import {time} from "../lib/time";

interface ViewMode {
  is(any): boolean;
  before: Function;
  check: Function;
  after: Function;
}

export class ViewSinglePage implements ViewMode {

  is(view: any): boolean {
    return view === Config.VIEW_SINGLE_PAGE;
  }

  private imgs: ImageComponent[];
  private manager: CacheManager;

  constructor(imgs: ImageComponent[], manager: CacheManager) {
    this.imgs = imgs;
    this.manager = manager;
  }

  onPage: any;

  before(book: Book) {
    this.imgs.filter((img, i) => i !== book.current - 1).forEach(img => img.hide());
    const r = new LatestRunner();
    this.onPage = (n: number) => {
      r.run(() => this.check(n))
    };
    book.onPage(this.onPage);
  }

  private last: ImageComponent;

  async check(page: number) {
    const cur = this.imgs[page - 1];
    await this.manager.request(page - 1);
    if (this.last && this.last != cur) {
      this.last.hide();
    }
    cur.scrollTo();
    cur.show();
    this.last = cur;
  }

  after(book: Book) {
    book.onPageRemove(this.onPage);
    this.last = null;
  }
}

export class ViewContinuousScroll implements ViewMode {
  is(view: any): boolean {
    return view === Config.VIEW_CONTINUOUS_SCROLL;
  }

  private imgs: ImageComponent[];
  private manager: CacheManager;

  constructor(imgs: ImageComponent[], manager: CacheManager) {
    this.imgs = imgs;
    this.manager = manager;
  }

  onPage: any;
  private _timer: any;

  before(config: Config, book: Book) {
    this.imgs.forEach(img => img.show());
    this.imgs[book.current - 1].scrollTo();
    const r = new LatestRunner();
    this._timer = setInterval(() => {
      const r = this.imgs.map((img, i) => ({i: i, r: img.ratio()})).filter(x => x.r > 0.45);
      const d = config.scrollDirection;
      const focus = d ? r.pop() : r.shift();
      if (focus) {
        book.updateCurrent(focus.i + 1);
      }
    }, 300);
    this.onPage = (n: number) => {
      r.run(() => this.check())
    };
    book.onPage(this.onPage);
  }

  async check() {
    const showingIndex = this.imgs.map((img, i) => ({i: i, inView: img.inView()})).filter(x => x.inView).map(x => x.i);
    await this.manager.request(...showingIndex);
  }

  after(book: Book) {
    book.onPageRemove(this.onPage);
    clearInterval(this._timer);
  }
}
