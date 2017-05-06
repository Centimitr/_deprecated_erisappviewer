import {Range} from "./range";
import {Size} from "./size";

export class Scale {
  x: Range = new Range(null, null);
  y: Range = new Range(null, null);

  constructor(xi, xa, yi, ya) {
    [this.x.min, this.x.max, this.y.min, this.y.max] = [xi, xa, yi, ya];
  }

  calc(parent: Size, child: Size) {
    const wsr = this.x.x(parent.w).x(1 / child.w);
    const hsr = this.y.x(parent.h).x(1 / child.h);
    const sr = wsr.cmb(hsr);
    const s = sr.near(100);
    return s / 100;
  }
}
