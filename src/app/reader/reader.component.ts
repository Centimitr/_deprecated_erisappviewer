import {Component, OnInit, Input, HostListener, NgZone, OnChanges, ViewChildren, QueryList} from '@angular/core';
import {setTouchBar, TouchBarButton, TouchBarSlider} from "../lib/touchbar";
import {Dismiss, EnterLeaveRecorder, IntervalTimer, RustyLock} from "../lib/util";
import {Book} from "./book";
import {PageMeta} from "./meta";
import {ViewerComponent} from "../viewer/viewer.component";
const fs = window['require']('fs');

@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.css'],
})
export class ReaderComponent implements OnInit, OnChanges {

  @Input() path: string;
  book: Book;
  scale: number = 133;
  recorder: EnterLeaveRecorder;

  @ViewChildren(ViewerComponent) viewers: QueryList<ViewerComponent>;

  // todo: multi-viewer: cache and better loading

  @HostListener('window:contextmenu', ['$event']) onRightClick() {
  }

  constructor(private zone: NgZone) {
  }

  async ngOnInit() {
  }

  onready() {
    console.log('onready');
  }

  async ngOnChanges(changes) {
    if (changes.path && this.path) {
      this.book = new Book(this.path);
      await this.book.init();
      // this.book.bind(this.viewers._result.map(viewer => viewer.elm));
      this.viewers.changes.subscribe(() => {
        this.book.bind(this.viewers.map(viewer => viewer.elm));
      });

      // intersection
      if (this.recorder) {
        this.recorder.io.disconnect();
      }
      this.recorder = new EnterLeaveRecorder((entries) => {
        const top = +entries.map(e => this.recorder.toggle('' + (+e.target.className + 1))).pop();
        this.zone.run(() => this.book.updateCurrent(top));
      }, {threshold: [0.6]});
      setTimeout(() => {
        this.viewers.forEach(viewer => this.recorder.io.observe(viewer.elm));
        // Array.prototype.slice.call(document.querySelectorAll('viewer')).forEach(node => this.recorder.io.observe(node));
        // Array.prototype.slice.call(document.querySelectorAll('viewer')).forEach(node => this.recorder.io.observe(node));
      }, 0);
      // touchBar
      const getProgressStr = (current: number = this.book.current) => current + '/' + this.book.total;
      // const getRealVal = (selectedVal: number) => this.book.total > 100 ? selectedVal : Math.max(1, Math.round(this.book.total * selectedVal / 100));
      // const getSelectedVal = (current: number = this.book.current) => this.book.total > 100 ? current : Math.ceil(current / this.book.total * 100);
      // const slideTimer = new IntervalTimer();
      const lock = new RustyLock();
      const slider = new TouchBarSlider({
        label: getProgressStr(),
        value: this.book.current,
        minValue: 1,
        maxValue: this.book.total,
        // maxValue: Math.max(100, this.book.total),
        change: (current: number) => {
          // const current = getRealVal(newValue);
          slider.label = getProgressStr(current);
          // slideTimer.run(() => this.zone.run(() => this.book.go(current)), 75);
          this.zone.run(() => this.book.go(current));
          lock.lock(175);
        }
      });
      this.book.onPage((current) => {
        // slideTimer.whenFree(() => {
        lock.run(() => {
          slider.value = current;
          // slider.value = getSelectedVal(current);
          slider.label = getProgressStr(current);
        })
      });
      // });
      setTouchBar([
        new TouchBarButton({label: 'Open', backgroundColor: '#007eff', click: () => this.zoom(0)}),
        new TouchBarButton({label: 'Page 1', click: () => this.zone.run(() => this.book.go(1))}),
        slider,
        new TouchBarButton({label: 'Zoom', click: () => this.zoom(10)}),
        // new TouchBarButton({label: 'ZoomOut', click: () => this.zoom(10)}),
      ]);
    }
  }

  zoom(percent: number) {
    this.zone.run(() => {
      this.scale += percent;
    });
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
  // @HostListener('window:keydown.arrowDown', ['$event'])
  // @HostListener('window:keydown.arrowRight', ['$event'])
  // next() {
  //   if (this.book) {
  //     this.zone.run(() => {
  //       this.book.next();
  //     });
  //   }
  // };

  @HostListener('window:resize', ['$event']) onResize() {
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


  getPageHeight(p: PageMeta, pages: HTMLElement) {
    const xScale = 100;
    const yScale = this.scale;
    const [w, h] = [xScale / 100 * pages.offsetWidth, yScale / 100 * pages.offsetHeight];
    const scale = Math.min(1, w / p.Width, h / p.Height);
    return p.Height * scale;
  }

  // @HostListener('window:mousewheel', ['$event'])
  // async onWheel(e) {
  // if (e.deltaY > 0) {
  //   await this.next();
  // } else {
  //   await this.prev();
  // }
  // }
}
