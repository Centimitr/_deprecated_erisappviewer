import {ImageComponent} from "../image/image.component";
import {Config} from "../config.service";
import {LatestRunner} from "../lib/util";

const BACKWARD_RESERVE = 2;
const FORWARD_RESERVE = 5;
const NEXT_PRELOAD = 2;

class MinorQueue {
  private wait: Promise<void>;
  private interrupt: boolean = false;

  async stop() {
    if (this.wait) {
      this.interrupt = true;
      return this.wait;
    }
  }

  async run(tasks: Promise<any>[]) {
    let resolve: Function;
    this.interrupt = false;
    this.wait = new Promise<void>(r => resolve = r);
    for (let i = 0; i < tasks.length; i++) {
      await tasks[i];
      if (this.interrupt) {
        break;
      }
    }
    resolve();
  }
}

export class CacheManager {
  // imgs: ImageComponent[];
  // queues
  // showQ: ImageComponent[];
  // cacheQ: ImageComponent[];

  constructor(private config: Config, private imgs: ImageComponent[]) {
  }

  private getPreloadTasks(index): Promise<any>[] {
    const d = this.config.scrollDirection ? 1 : -1;
    const from = Math.max(0, index + d);
    const to = Math.max(0, index + d * NEXT_PRELOAD);
    return this.imgs.slice(from, to).map(img => img.paint());
  }

  private getCleanTasks(index): Promise<any>[] {
    const to = Math.max(0, index - BACKWARD_RESERVE);
    const from = index + FORWARD_RESERVE;
    return this.imgs.slice(0, to).concat(this.imgs.slice(from)).map(img => (async () => img.clear())());
  }

  minor = new MinorQueue();
  latest = new LatestRunner();

  async request(index: number) {
    await this.latest.run(async () => {
      await this.minor.stop();
      await this.imgs[index].paint();
      let tasks = [];
      tasks = tasks.concat(this.getPreloadTasks(index), this.getCleanTasks(index));
      this.minor.run(tasks);
    });
  }

  debug() {
    // setInterval(() => {
    //   console.clear();
    //   console.table(this.imgs.map((img, i) => ({index: i, showing: img.showing ? '*' : undefined})));
    // }, 500);
  }
}
