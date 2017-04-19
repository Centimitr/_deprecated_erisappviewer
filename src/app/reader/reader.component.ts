import {Component, OnInit, Input, HostListener, NgZone, OnChanges, ViewChildren, QueryList} from '@angular/core';
import {
  setTouchBar,
  TouchBarButton,
  TouchBarSlider,
  TouchBarSegmentedControl,
  TouchBarScrubber
} from "../lib/touchbar";
import {ABMap, Dismiss, EnterLeaveRecorder, IntervalTimer, RustyLock} from "../lib/util";
import {Book} from "./book";
import {ViewerComponent} from "../viewer/viewer.component";
import {Config} from "./config";
const fs = window['require']('fs');

@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./_common.css', './_pages.css', './_layer.css'],
})
export class ReaderComponent implements OnInit, OnChanges {

  @Input() path: string;
  book: Book;
  scale: number = 133;
  config: Config;
  // recorder: EnterLeaveRecorder;

  @ViewChildren(ViewerComponent) viewers: QueryList<ViewerComponent>;

  // todo: multi-viewer: cache and better loading

  @HostListener('window:contextmenu', ['$event']) onRightClick() {
  }

  constructor(private zone: NgZone) {
    this.config = new Config();
  }

  async ngOnInit() {
  }

  async ngOnChanges(changes) {
    if (changes.path && this.path) {
      this.book = new Book(this.path, this.config);
      await this.book.init();
      this.viewers.changes.subscribe(() => {
        this.book.bind(this.viewers.map(viewer => viewer.elm));
      });

      // touchBar
      const getProgressStr = (current: number = this.book.current) => current + '/' + this.book.total;
      const lock = new RustyLock();
      const slider = new TouchBarSlider({
        label: getProgressStr(),
        value: this.book.current,
        minValue: 1,
        maxValue: this.book.total,
        change: (current: number) => {
          slider.label = getProgressStr(current);
          this.zone.run(() => this.book.go(current));
          lock.lock(175);
        }
      });
      this.book.onPage((current) => {
        lock.run(() => {
          slider.value = current;
          slider.label = getProgressStr(current);
        })
      });
      const barScaleMap = new ABMap(Config.SCALE_ALL);
      const barViewMap = new ABMap(Config.VIEW_ALL);
      setTouchBar([
        new TouchBarSegmentedControl({
          segments: [
            {label: 'Scroll'},
            {label: 'Single'},
          ],
          selectedIndex: barViewMap.getA(this.config.view),
          change: selectedIndex => {
            this.zone.run(() => {
              this.config.setView(barViewMap.getB(selectedIndex));
              console.log(this.config);
            });
          }
        }),
        // new TouchBarButton({label: 'Page 1', click: () => this.zone.run(() => this.book.go(1))}),
        slider,
        // new TouchBarScrubber({
        //   items: (new Array(this.book.total)).fill(1).map((v, i) => '' + i).map(i => ({label: i})),
        //   highlight: index => console.log('touchBar scrubber:', index),
        //   mode: 'free',
        //   selectedStyle: 'outline',
        // }),
        new TouchBarSegmentedControl({
          segments: [
            {label: 'H 100%'},
            {label: 'Auto'},
            {label: 'W 100%'},
          ],
          selectedIndex: barScaleMap.getA(this.config.scale),
          change: selectedIndex => {
            this.zone.run(() => {
              this.config.setScale(barScaleMap.getB(selectedIndex));
              console.log(this.config);
            });
          }
        }),
        // new TouchBarButton({label: 'ZoomOut', click: () => this.zoom(-10)}),
      ]);
    }
  }

  zoom(percent: number) {
    this.scale += percent;
    console.log(this.scale)
  }

  @HostListener('window:keydown.pageUp', ['$event'])
  @HostListener('window:keydown.arrowUp', ['$event'])
  @HostListener('window:keydown.arrowLeft', ['$event'])
  prev() {
    if (this.book) {
      this.zone.run(() => {
        this.book.prev();
      });
    }
  };

  // @HostListener('window:keydown.pageDown', ['$event'])
  @HostListener('window:keydown.arrowDown', ['$event'])
  @HostListener('window:keydown.arrowRight', ['$event'])
  next() {
    if (this.book) {
      this.zone.run(() => {
        this.book.next();
      });
    }
  };

  @HostListener('window:resize', ['$event']) onResize() {
    console.warn('RESIZED!');
  }

  // private inCacheRange(page: number): boolean {
  //   const BACKWARD = 2;
  //   const FORWARD = 5;
  //   const current = this.book.current;
  //   if (current - BACKWARD <= page && page <= current + FORWARD) {
  //     return true;
  //   }
  // }
  inCacheRange(page: number): boolean {
    // let distance = 1e10;
    // this.recorder.stack.map(id => parseInt(id)).forEach(p => {
    //   const d = p - page;
    //   if (Math.abs(d) < Math.abs(distance)) {
    //     distance = d;
    //   }
    // });
    const distance = page - this.book.current;
    const BACKWARD = 3;
    const FORWARD = 7;
    return -1 * BACKWARD <= distance && distance <= FORWARD;
  }


  // getPageHeight(p: PageMeta, pages: HTMLElement) {
  //   const xScale = 100;
  //   const yScale = this.scale;
  //   const [w, h] = [xScale / 100 * pages.offsetWidth, yScale / 100 * pages.offsetHeight];
  //   const scale = Math.min(1, w / p.Width, h / p.Height);
  //   console.log(pages.offsetWidth, pages.offsetHeight);
  //   console.log(scale, p.Height*scale);
  //   return p.Height * scale;
  // }

  // @HostListener('window:mousewheel', ['$event'])
  // async onWheel(e) {
  // if (e.deltaY > 0) {
  //   await this.next();
  // } else {
  //   await this.prev();
  // }
  // }
}
