import {Driver} from "./driver";
const electron = window['require']('electron');
const {nativeImage} = electron;

export class Book {
  meta: any;
  _curNum: number;
  totalNum: number;
  _cache: ImageCache[];
  _onPage: Function[] = [];

  constructor(private path: string) {
  }

  async init(driver: Driver) {
    this.meta = await driver.resolveMeta(this.path);
    const paths = await driver.resolvePaths(this.path);
    this._cache = paths.map(p => new ImageCache(p, driver));
    this.totalNum = paths.length;
    this.curNum = 1;
  }

  async goto(pageOrOffset: number, relative: boolean = false, cache: boolean = false): Promise<ImageMeta> {
    const page = pageOrOffset + (relative ? this._curNum : 0);
    return this.get(page, cache);
  }

  async get(page: number, cache: boolean = true): Promise<ImageMeta> {
    if (page < 1) {
      throw new Error('first page already');
    } else if (page > this.totalNum) {
      throw new Error('last page already');
    } else {
      this.curNum = page;
      const img = await this._cache[page - 1].get();
      // if (cache) {
      //   const BACKWARD_NUM = 1;
      //   const FORWARD_NUM = 3;
      //   const FORWARD_RESERVE_NUM = 10;
      //   for (let i = this.curNum; i < this.totalNum; i++) {
      //     const offset = i - (this.curNum - 1);
      //     if (offset <= FORWARD_NUM) {
      //       this._cache[i].load();
      //     } else if (offset >= FORWARD_RESERVE_NUM) {
      //       this._cache[i].clear();
      //     }
      //   }
      //   for (let i = this.curNum - 1; i >= 0; i--) {
      //     const offset = (this.curNum - 1) - i;
      //     if (offset > BACKWARD_NUM) {
      //       this._cache[i].clear();
      //     }
      //   }
      // }
      return img;
    }
  }

  // all(): ImageMeta[] {
  // return this._cache.map(c => );
  // }

  get curNum() {
    return this._curNum;
  }

  set curNum(v: number) {
    const old = this._curNum;
    this._curNum = v;
    if (old !== v) {
      this._onPage.forEach(callback => callback(v, old));
    }
  }

  pages() {

  }

  onPage(callback: (n?: number, old?: number) => void) {
    this._onPage.push(callback);
  }
}

export class ImageCache {
  // buf: Buffer;
  rejectFlag: boolean;
  src: string = '';

  constructor(private path: string,
              private driver: Driver) {
  }

  clear() {
    this.rejectFlag = true;
    // this.buf = null;
    window.URL.revokeObjectURL(this.src);
    this.src = '';
  }

  loaded() {
    return this.src.startsWith('blob');
  }

  async load() {
    this.rejectFlag = false;
    if (!this.loaded()) {
      const buf = await this.driver.resolveImage(this.path);
      if (this.rejectFlag) {
        this.rejectFlag = false;
      } else {
        // this.buf = buf;
        this.src = window.URL.createObjectURL(new Blob([buf], {type: 'image/jpg'}));
      }
    }
    return this.src;
  }

  async get() {
    // console.time('0');
    await this.load();
    // console.timeEnd('0');
    // console.time('1');
    // console.timeEnd('1');
    // console.time('2');
    // const img = nativeImage.createFromBuffer(this.buf);
    // const size = img.getSize();
    // console.timeEnd('2');
    // return new ImageMeta(this.src, size.width, size.height);
    return new ImageMeta(this.src, 100, 100);
  }
}

export class ImageMeta {
  aspect: number;

  constructor(public src: string,
              public width: number,
              public height: number) {
    this.aspect = width / height;
  }
}
