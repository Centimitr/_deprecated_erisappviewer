import Timer = NodeJS.Timer;

export class IntervalTimer {
  lastRunTime: number;
  timer: Timer;

  constructor() {
  }

  run(callback: Function, delay: number = 100) {
    const now = Date.now();
    if ((now - this.lastRunTime) > delay) {
      this.lastRunTime = now;
      callback();
      this.timer = null;
    } else {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.timer = setTimeout(() => {
        this.lastRunTime = now;
        callback();
      }, delay - (now - this.lastRunTime));
    }
  }

  whenFree(callback: Function) {
    if (!this.timer) {
      callback();
    }
  }
}

export class EnterLeaveRecorder {
  io: IntersectionObserver;
  stack: string[] = [];

  constructor(cb: IntersectionObserverCallback, opt?: IntersectionObserverInit) {
    this.io = new IntersectionObserver(cb, opt);
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  // intersect(...ids: string[]): boolean {
  //   return ids.map(id => this.stack.includes(id)).some(b => b);
  // }

  toggle(id: string) {
    const index = this.stack.indexOf(id);
    if (index < 0) {
      this.stack.push(id);
    } else {
      this.stack.splice(index, 1);
    }
    return this.top();
  }

}

export class Dismiss {
  constructor(private times: number) {
  }

  run(cb: Function) {
    if (this.times > 0) {
      this.times--;
    } else {
      cb();
    }
  }
}

class ClassNames {
  names: string[] = [];

  get(): string[] {
    return this.names;
  }

  clear() {
    this.names = [];
  }

  add(c: string) {
    this.names.push(c);
  }
}
