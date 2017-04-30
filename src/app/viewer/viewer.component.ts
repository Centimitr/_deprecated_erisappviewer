import {
  Component, OnInit, Input, OnChanges, ElementRef, Output, EventEmitter, NgZone,
  HostListener
} from '@angular/core';
import {PageMeta} from "../reader/meta";
import {Change, Checker, Semaphore} from "../lib/util";
import {Config} from "../reader/config";

@Component({
  selector: 'viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
})
export class ViewerComponent implements OnInit {
  @Input() path: string;
  @Input() page: number;
  @Input() cache: boolean;
  @Input() config: Config;
  height: number;
  oriHeight: number;
  oriWidth: number;
  show: boolean = false;
  elm: any;
  inView: boolean = false;
  @Output() enter = new EventEmitter<null>();
  @Output() leave = new EventEmitter<null>();
  @Output() attention = new EventEmitter<null>();
  @Output() load = new EventEmitter<null>();
  private img: HTMLImageElement;

  constructor(elm: ElementRef, private zone: NgZone) {
    this.elm = elm.nativeElement;
    this.elm.addEventListener('ready', e => console.log(e));
  }

  scrollTo() {
    this.elm.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  onLoad(img: HTMLImageElement) {
    this.show = true;
    this.img = img;
    this.oriHeight = img.naturalHeight;
    this.oriWidth = img.naturalWidth;
    this.setHeight();
    this.load.emit();
  }

  async ngOnInit() {
    const checker = new Checker(50);
    const io = new IntersectionObserver(() => {
      this.inView = !this.inView;
      if (this.inView) {
        this.enter.emit();
        const getRatio = function (rect: ClientRect) {
          const w = Math.min(Math.max(rect.right, 0), window.innerWidth) - Math.max(rect.left, 0);
          const h = Math.min(Math.max(rect.bottom, 0), window.innerWidth) - Math.max(rect.top, 0);
          return (w * h) / Math.min(rect.width * rect.height, window.innerWidth * window.innerHeight)
        };
        checker.check(() => {
          const ratio = getRatio(this.elm.getBoundingClientRect());
          const FOCUS_RATIO = 0.35;
          if (ratio > FOCUS_RATIO) {
            return true;
          }
        }, () => {
          this.zone.run(() => {
            this.attention.emit();
          });
        }, 1);
      } else {
        checker.clear();
        this.leave.emit();
      }
    });
    io.observe(this.elm);
    this.setHeight();
    this.config.mode.change(() => this.zone.run(() => this.setHeight()));
    this.config.scale.change(() => this.zone.run(() => this.setHeight()));
  }

  @HostListener('window:resize', ['$event']) onResize() {
    setTimeout(()=>{
      this.setHeight();
    });
  }

  setHeight() {
    if (!this.oriHeight) return;
    const pages: HTMLElement = this.elm.parentElement;
    if (!pages) return;
    if (this.config.mode.is(Config.MODE_FULL_HEIGHT)) this.height = pages.offsetHeight;
    else this.height = this.oriHeight * this.config.scale.get() / 100;
  }

  isOverflow() {
    if (!this.config.view.is(Config.VIEW_SINGLE_PAGE)) return false;
    else if (this.config.mode.is(Config.MODE_FULL_HEIGHT)) return false;
    else if (!this.img) return false;
    else return this.img.height > this.elm.parentElement.offsetHeight;
  }

  getContainerHeight() {
    return this.config.whenContinuousScroll(this.oriHeight ? null : 375);
  }

  getPos() {
    // const top = this.elm.getBoundingClientRect().top;
    // console.log(this.elm.getBoundingClientRect());
  }
}
