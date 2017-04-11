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
  scale: number = 200;
  // recorder: EnterLeaveRecorder;

  @ViewChildren(ViewerComponent) viewers: QueryList<ViewerComponent>;

  // todo: multi-viewer: cache and better loading

  @HostListener('window:contextmenu', ['$event']) onRightClick() {
  }

  constructor(private zone: NgZone) {
  }

  async ngOnInit() {
  }

  async ngOnChanges(changes) {
    if (changes.path && this.path) {
      this.book = new Book(this.path);
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
      setTouchBar([
        new TouchBarButton({label: 'Page 1', click: () => this.zone.run(() => this.book.go(1))}),
        slider,
        new TouchBarButton({
          label: 'Zoom', click: () => {
            console.log('zone!');
            this.zone.run(() => {
              this.zoom(10);
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
