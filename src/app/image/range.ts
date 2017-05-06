const checkNum = function (v) {
  return v || v === 0;
};

export class Range {
  min: number;
  max: number;

  constructor(i, a) {
    [this.min, this.max] = [i, a];
  }

  x(n: number): Range {
    let min, max;
    if (this.min !== null && n !== null) min = this.min * n;
    if (this.max !== null && n !== null) max = this.max * n;
    return new Range(min, max);
  }

  cmb(r: Range): Range {
    let {min, max} = this;
    if (r.min > min || !checkNum(min)) min = r.min;
    if (r.max < max || !checkNum(max)) max = r.max;
    return new Range(min, max);
  }

  between(v: number): number {
    const r = 0;
    if (checkNum(this.max) && v >= this.max) return 1;
    else if (checkNum(this.min) && v <= this.min) return -1;
    else return 0;
  }

  near(v: number) {
    switch (this.between(v)) {
      case 0:
        return v;
      case 1:
        return this.max;
      case -1:
        return this.min;
    }
  }

  distance(v: number) {
    switch (this.between(v)) {
      case 0:
        return 0;
      case 1:
        return v - this.max;
      case -1:
        return v - this.min;
    }
  }
}
