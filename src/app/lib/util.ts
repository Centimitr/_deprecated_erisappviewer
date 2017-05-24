import Timer = NodeJS.Timer;
import {time} from "./time";

export class RustyLock {
  finishTime: number = 0;

  constructor() {
  }

  lock(interval: number) {
    this.finishTime = Date.now() + interval;
  }

  run(cb: Function) {
    if (Date.now() > this.finishTime) {
      cb();
    }
  }
}

export class Checker {
  timer: Timer;

  constructor(private freq: number) {
  }

  check(checkFn: () => boolean, cb: () => any, times: number = -1) {
    const call = () => {
      if (checkFn()) {
        if (times > 0) {
          times--;
        }
        cb();
        if (times === 0) {
          this.clear();
        }
      }
    };
    call();
    this.timer = setInterval(() => {
      call();
    }, this.freq)
  }

  clear() {
    clearInterval(this.timer);
  }
}

export class ABMap {
  mapA: Map<any, any> = new Map();
  mapB: Map<any, any> = new Map();

  constructor(enumArr?: any[]) {
    if (enumArr) {
      enumArr.forEach((item, i) => this.set(i, item));
    }
  }

  set(a: any, b: any) {
    this.mapA.set(a, b);
    this.mapB.set(b, a);
  }

  getA(b: any) {
    return this.mapB.get(b);
  }

  getB(a: any) {
    return this.mapA.get(a);
  }
}

export class Semaphore {
  initial: number;

  constructor(private permits: number) {
    this.initial = permits;
  }

  set(p: number) {
    this.permits = p;
  }

  reset(): number {
    return this.permits = this.initial;
  }

  get(): number {
    return this.permits;
  }

  wait(success?: Function, error?: Function): boolean {
    if (this.permits > 0) {
      success && success();
      this.permits--;
      return true;
    } else {
      error && error();
      return false;
    }
  }

  release(): number {
    this.permits++;
    return this.permits;
  }
}

export class Change<T> {
  v: T;

  constructor(initial?: T) {
    this.v = initial;
  }

  changed(n: T): boolean {
    if (n !== this.v) {
      this.v = n;
      return true;
    }
    return false;
  }
}

export class LRU {
  constructor(private q: any[], public size: number, private cmp?: Function) {
    this.checkSize();
  }

  checkSize() {
    this.q.splice(this.size);
  }

  add(v: any) {
    this.q = this.q.filter(item => !this.cmp(v, item));
    this.q.unshift(v);
    this.checkSize();
    return this.get();
  }

  get() {
    return this.q;
  }
}

export class LatestRunner {
  busy: boolean = false;
  wait: () => Promise<any>;

  async run(fn: () => Promise<any>) {
    if (!this.busy) {
      this.busy = true;
      await fn();
      if (this.wait) {
        await this.wait();
        this.wait = null;
      }
      this.busy = false;
    } else {
      // console.log('busy so wait');
      this.wait = fn;
    }
  }

  async runp(p: Promise<any>) {
    const fn = () => p;
    await this.run(fn);
  }
}

export class Timeout {
  t: number;

  constructor() {
    this.t = time.Now();
  }

  timeout(delay: number): Promise<void> {
    return new Promise<void>(resolve => {
      const since = time.Since(this.t);
      const d = since > delay ? 0 : delay - since;
      setTimeout(() => {
        resolve();
      }, d)
    });
  }
}
