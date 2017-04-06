import {Component, OnInit, Input, HostListener, NgZone, OnChanges} from '@angular/core';
import {setTouchBar, TouchBarButton, TouchBarSlider} from "../lib/touchbar";
import {Dismiss, EnterLeaveRecorder, IntervalTimer} from "../lib/util";
import {Book} from "./book";
const fs = window['require']('fs');

@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.css'],
})
export class ReaderComponent implements OnInit, OnChanges {

  @Input() path: string;
  book: Book;
  scale: number = 100;
  recorder: EnterLeaveRecorder;

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

      //
      if (this.recorder) {
        this.recorder.io.disconnect();
      }
      this.recorder = new EnterLeaveRecorder((entries) => {
        const top = +entries.map(e => this.recorder.toggle('' + (+e.target.className + 1))).pop();
        this.zone.run(() => this.book.goto(top));
      }, {threshold: [0.5]});
      setTimeout(() => {
        Array.prototype.slice.call(document.querySelectorAll('viewer')).forEach(node => this.recorder.io.observe(node));
      }, 0);
      // touchBar
      const getProgressStr = (current: number = this.book.current) => current + '/' + this.book.total;
      const getRealVal = (selectedVal: number) => this.book.total > 100 ? selectedVal : Math.max(1, Math.round(this.book.total * selectedVal / 100));
      const getSelectedVal = (current: number = this.book.current) => this.book.total > 100 ? current : Math.ceil(current / this.book.total * 100);
      const slideTimer = new IntervalTimer();
      const slider = new TouchBarSlider({
        label: getProgressStr(),
        value: getSelectedVal(),
        minValue: 1,
        maxValue: Math.max(100, this.book.total),
        change: (newValue: number) => {
          const current = getRealVal(newValue);
          slider.label = getProgressStr(current);
          slideTimer.run(() => this.zone.run(() => this.book.current = current), 75);
        }
      });
      this.book.onPage((current) => {
        slider.value = getSelectedVal(current);
        slider.label = getProgressStr(current);
      });
      setTouchBar([
        new TouchBarButton({label: 'Front', click: () => this.zone.run(() => this.book.goto(1))}),
        slider,
        new TouchBarButton({label: 'ZoomIn', click: () => this.zoom(-10)}),
        new TouchBarButton({label: 'ZoomOut', click: () => this.zoom(10)}),
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

  // private inCacheRange(page: number): boolean {
  //   const BACKWARD = 2;
  //   const FORWARD = 5;
  //   const current = this.book.current;
  //   if (current - BACKWARD <= page && page <= current + FORWARD) {
  //     return true;
  //   }
  // }
  inCacheRange(set: number[], p: number): boolean {
    const distance = ((set: number[], p: number) => {
      let min = 1e10;
      set.forEach(s => {
        const d = s - p;
        if (Math.abs(d) < Math.abs(min)) {
          min = d;
        }
      });
      return min;
    })(set, p);
    const BACKWARD = 2;
    const FORWARD = 5;
    return -1 * BACKWARD <= distance && distance <= FORWARD;
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
