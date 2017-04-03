import {Component, OnInit, Input, HostListener, NgZone} from '@angular/core';
import {setTouchBar, TouchBarButton, TouchBarSlider} from "../lib/touchbar";
import {BookService} from '../book/book.service';
import {Book, ImageMeta} from "../book/book";
import {IntervalTimer} from "../lib/util";
const fs = window['require']('fs');

@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.css'],
})
export class ReaderComponent implements OnInit {

  @Input() path: string;
  img: ImageMeta;
  book: Book;
  scale: number = 100;

  // todo: multi-viewer: cache and better loading

  @HostListener('window:contextmenu', ['$event']) onRightClick() {
  }

  constructor(private bookService: BookService, private zone: NgZone) {
  }

  async ngOnInit() {
    this.book = await this.bookService.create(this.path);
    await this.goto(1);
    const getProgressStr = (curNum: number = this.book.curNum) => curNum + '/' + this.book.totalNum;
    const getRealVal = (selectedVal: number) => this.book.totalNum > 100 ? selectedVal : Math.max(1, Math.round(this.book.totalNum * selectedVal / 100));
    const getSelectedVal = (curNum: number = this.book.curNum) => this.book.totalNum > 100 ? curNum : Math.ceil(curNum / this.book.totalNum * 100);
    const slideTimer = new IntervalTimer();
    const slider = new TouchBarSlider({
      label: getProgressStr(),
      value: getSelectedVal(),
      minValue: 1,
      maxValue: Math.max(100, this.book.totalNum),
      change: (newValue: number) => {
        const curNum = getRealVal(newValue);
        slider.label = getProgressStr(curNum);
        slideTimer.run(() => this.zone.run(() => this.goto(curNum, false, false)), 75);
      }
    });
    this.book.onPage((curNum) => {
      slider.value = getSelectedVal(curNum);
      slider.label = getProgressStr(curNum);
    });
    setTouchBar([
      new TouchBarButton({label: 'Front', click: () => this.zone.run(() => this.goto(1))}),
      slider,
      new TouchBarButton({label: 'ZoomIn', click: () => this.zoom(-10)}),
      new TouchBarButton({label: 'ZoomOut', click: () => this.zoom(10)}),
    ]);
  }

  async goto(page: number, relative: boolean = false, cache: boolean = true) {
    try {
      // console.time('overall');
      // console.time('goto');
      // console.time('image load');
      this.img = await this.book.goto(page, relative, cache);
      // console.timeEnd('goto');
    } catch (e) {
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
  async prev() {
    return await this.goto(-1, true);
  };

  @HostListener('window:keydown.pageDown', ['$event'])
  @HostListener('window:keydown.arrowDown', ['$event'])
  @HostListener('window:keydown.arrowRight', ['$event'])
  async next() {
    return await this.goto(1, true);
  };

  @HostListener('window:mousewheel', ['$event'])
  async onWheel(e) {
    // if (e.deltaY > 0) {
    //   await this.next();
    // } else {
    //   await this.prev();
    // }
  }
}
