import {ImageComponent} from "../image/image.component";
import {Config} from "../config.service";
import {LatestRunner} from "../lib/util";
import {Book} from "../reader/book";

const BACKWARD_RESERVE = 3;
const FORWARD_RESERVE = 6;
const NEXT_PRELOAD = 3;

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

  constructor(private config: Config, private book: Book, private imgs: ImageComponent[]) {
  }

  private getPreloadTasks(indexes: number[]): Promise<any>[] {
    const d = this.config.scrollDirection ? 1 : -1;
    const startPoint = d ? Math.max(...indexes) : Math.min(...indexes);
    let from = Math.max(0, startPoint + d);
    let to = Math.max(0, startPoint + d * NEXT_PRELOAD);
    if (to < from) [to, from] = [from, to];
    return this.imgs.slice(from, to).map(img => img.paint());
  }

  private getCleanTasks(indexes: number[]): Promise<any>[] {
    const to = Math.max(0, Math.min(...indexes) - BACKWARD_RESERVE);
    const from = Math.max(...indexes) + FORWARD_RESERVE;
    return this.imgs.slice(0, to).concat(this.imgs.slice(from)).map(img => (async () => img.clear())());
  }

  minor = new MinorQueue();
  latest = new LatestRunner();

  async request(...indexes: number[]) {
    // await this.latest.run(async () => {
    await this.minor.stop();
    for (let i = 0; i < indexes.length; i++) {
      await this.imgs[indexes[i]].paint();
      this.book.ensureHasPageLoaded();
    }
    let tasks = [];
    tasks = tasks.concat(this.getPreloadTasks(indexes), this.getCleanTasks(indexes));
    this.minor.run(tasks);
    // });
  }

  debug() {
    setInterval(() => {
      console.clear();
      console.table(this.imgs.map((img, i) => ({index: i, showing: img.showing ? '*' : undefined})));
    }, 500);
  }
}
