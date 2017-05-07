import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {Range} from "./range";
import {time} from "../lib/time";
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
  elm: any;

  constructor(elm: ElementRef, private config: Config) {
    this.elm = elm.nativeElement;
    this.setHeight(375);
    this.config.scale.change(()=> this.resize());
  }

  async ngOnInit() {
  }

  canvas: any;
  size: Size;
  showing: boolean = false;
  showLock: boolean = false;
  reject: boolean = false;

  private async cache() {
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
  }

  async paint() {
    if (!this.showing && !this.showLock) {
      this.showLock = true;
      await this.cache();
      if (this.reject) return;
      this.resize();
      this.elm.appendChild(this.canvas);
      this.canvas.style.boxShadow = '0 0 12px 4px rgba(0,0,0,.382)';
      this.showing = true;
      this.showLock = false;
      window['e'] = this;
    }
  }

  resize() {
    if (!this.canvas) return;
    const container = this.elm.parentNode.parentNode;
    const mode:Scale = this.config.scale.get();
    let s = mode.calc({
      w: container.offsetWidth,
      h: container.offsetHeight
    }, this.size);
    this.canvas.style.zoom = s;
    this.setHeight(this.size.h * s)
  }

  clear() {
    this.reject = true;
    if (this.canvas) {
      const parent = this.canvas.parentNode;
      if (parent) parent.removeChild(this.canvas);
      this.showing = false;
      this.canvas = null;
    }
  }

  show() {
    this.elm.style.display = 'flex';
    return this;
  }

  hide() {
    this.elm.style.display = 'none';
    return this;
  }

  distance() {
    const min = this.elm.offsetTop - this.elm.offsetParent.clientHeight;
    const max = this.elm.offsetTop + this.elm.offsetHeight;
    return new Range(min, max).distance(this.elm.offsetParent.scrollTop);
  }

  inView() {
    return this.distance() === 0;
  }

  setHeight(h: number) {
    this.elm.style.height = px(h);
  }

  scrollTo() {
    this.elm.scrollIntoView(true);
  }

  ngOnDestroy() {
    this.clear();
  }
}
