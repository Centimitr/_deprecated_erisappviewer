import {Component, ElementRef, Input, OnInit} from "@angular/core";
import {Range} from "./range";
import {Config} from "../config.service";
import {Scale} from "./scale";
import {Size} from "./size";
const clearCache = window['require']('electron').webFrame.clearCache;
const createImageBitmap = window['createImageBitmap'];
const fetch = async function (url: string) {
  const res = await window.fetch(url);
  const img = await res.blob();
  return await createImageBitmap(img);
};
const bitmapToCanvas = function (ib: any) {
  const canvas = document.createElement('canvas');
  canvas.height = ib.height;
  canvas.width = ib.width;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(ib, 0, 0);
  ib.close();
  return canvas;
};
const px = function (v: number) {
  return v + 'px';
};

@Component({
  selector: 'cm-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.css']
})
export class ImageComponent implements OnInit {
  @Input() src: string;
  @Input() page: number;
  elm: any;
  loading: any;

  constructor(elm: ElementRef, private config: Config) {
    this.elm = elm.nativeElement;
    this.setHeight(375);
    this.config.scale.change(() => this.resize());
  }

  async ngOnInit() {
    this.loading = this.elm.querySelector('.loading');
  }

  canvas: any;
  size: Size;
  showing: boolean = false;
  showLock: boolean = false;
  reject: boolean = false;
  private _height: number;

  private async cache() {
    try {
      this.reject = false;
      if (!this.canvas) {
        let ib = await fetch(this.src);
        if (this.reject) {
          return
        }
        this.canvas = bitmapToCanvas(ib);
        ib = null;
        this.size = {w: this.canvas.width, h: this.canvas.height};
      }
    } catch (e) {
      console.error(e)
    }
  }

  async paint() {
    if (!this.showing && !this.showLock) {
      this.showLock = true;
      await this.cache();
      if (this.reject) return;
      this.resize(false);
      this.elm.appendChild(this.canvas);
      this.canvas.style.boxShadow = '0 0 12px 4px rgba(0,0,0,.382)';
      this.canvas.style.border = '1px solid rgba(0,0,0,.382)';
      this.showing = true;
      this.loading.classList.add('hide');
      this.showLock = false;
    }
  }

  resize(checkOverflow: boolean = true) {
    if (!this.canvas) return;
    try {
      const p = this.elm.parentNode.parentNode;
      const mode: Scale = this.config.scale.get();
      let s = mode.calc({
        w: p.offsetWidth,
        h: p.offsetHeight
      }, this.size);
      this.canvas.style.zoom = s;
      this.setHeight(this.size.h * s);
      if (checkOverflow) this.checkOverflow();
    } catch (e) {
      console.warn(e);
      // this catch is because when submenu changing, parentNode may be null
    }
  }

  checkOverflow() {
    try {
      if (this.config.isSinglePage()) {
        const p = this.elm.parentNode.parentNode;
        const threshold = p.clientHeight - window.innerHeight * (5 + 5) / 100;
        const shouldCenter = threshold > this._height;
        if (shouldCenter) {
          const offset = (threshold - this._height) / 2;
          this.elm.style.marginTop = px(offset);
          return;
        }
      }
      this.elm.style.marginTop = null;
    } catch (e) {
    }
  }

  clear() {
    this.reject = true;
    if (this.canvas) {
      const parent = this.canvas.parentNode;
      if (parent) parent.removeChild(this.canvas);
      this.showing = false;
      this.loading.classList.remove('hide');
      this.canvas = null;
    }
  }

  show() {
    this.checkOverflow();
    this.elm.style.display = 'flex';
    return this;
  }

  hide() {
    this.elm.style.display = 'none';
    return this;
  }

  distance(): number {
    try {
      const min = this.elm.offsetTop - this.elm.offsetParent.clientHeight;
      const max = this.elm.offsetTop + this.elm.offsetHeight;
      return new Range(min, max).distance(this.elm.offsetParent.scrollTop);
    } catch (e) {
      console.error(e)
    }
  }

  ratio(): number {
    const r = this.elm.getBoundingClientRect();
    if (!this.elm.offsetParent) {
      return 0;
    }
    const pr = this.elm.offsetParent.getBoundingClientRect();
    const xr = new Range(pr.left, pr.right);
    const yr = new Range(pr.top, pr.bottom);
    const w = xr.near(r.right) - xr.near(r.left);
    const h = yr.near(r.bottom) - yr.near(r.top);
    const cw = Math.min(r.width, pr.width);
    const ch = Math.min(r.height, pr.height);
    return (w * h) / (cw * ch);
  }

  inView(): boolean {
    return this.distance() === 0;
  }

  setHeight(h: number) {
    this._height = h;
    this.elm.style.height = px(h);
  }

  scrollTo() {
    this.elm.scrollIntoView(true);
  }

  ngOnDestroy() {
    this.clear();
  }
}
