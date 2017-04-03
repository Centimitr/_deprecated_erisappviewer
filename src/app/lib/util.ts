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
    } else {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.lastRunTime = now;
        callback();
      }, delay - (now - this.lastRunTime));
    }
  }
}
