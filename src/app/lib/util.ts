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
