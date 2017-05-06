import {Config} from "../config.service";
import {ImageComponent} from "../image/image.component";
import {Book} from "../reader/book";
import {time} from "../lib/time";
import {CacheManager} from "./cache-manager";
import {LatestRunner} from "../lib/util";

interface ViewMode {
  is(any): boolean;
  before: Function;
  check: Function;
  after: Function;
}

class ViewSinglePage implements ViewMode {

  is(view: any): boolean {
    return view === Config.VIEW_SINGLE_PAGE;
  }

  private imgs: ImageComponent[];
  private manager: CacheManager;

  bind(imgs: ImageComponent[], manager: CacheManager) {
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
    console.warn('CHECK!');
    const cur = this.imgs[page - 1];
    await this.manager.request(page - 1);
    console.warn('CHECK: request ok');
    if (this.last) {
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

class ViewContinuousScroll implements ViewMode {
  is(view: any): boolean {
    return view === Config.VIEW_CONTINUOUS_SCROLL;
  }

  private imgs: ImageComponent[];
  private manager: CacheManager;

  bind(imgs: ImageComponent[], manager: CacheManager) {
    this.imgs = imgs;
    this.manager = manager;
  }

  // private imgs: ImageComponent[];
  before(curPage?: number) {
    this.imgs.forEach(img => img.show());
    this.imgs[curPage - 1].scrollTo();
  }

  check(page: number) {

  }

  after() {

  }
}

export const viewCS = new ViewContinuousScroll();
export const viewSP = new ViewSinglePage();
