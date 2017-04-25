import {
  Component, OnInit, Input, OnChanges, ElementRef, Output, EventEmitter, NgZone,
  HostListener
} from '@angular/core';
import {PageMeta} from "../reader/meta";
import {Change, Checker, Semaphore} from "../lib/util";
import {Config} from "../reader/config";
const getWindowSize = () => {
  return [window.innerWidth, window.innerHeight];
};

@Component({
  selector: 'viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
})
export class ViewerComponent implements OnInit, OnChanges {
  @Input() path: string;
  @Input() meta: PageMeta;
  @Input() page: number;
  height: number;
  @Input() cache: boolean;
  @Input() config: Config;
  show: boolean = false;
  elm: any;
  inView: boolean = false;
  overflow: Promise<boolean>;
  resolveOverflow: Function;
  @Output() enter = new EventEmitter<null>();
  @Output() leave = new EventEmitter<null>();
  @Output() attention = new EventEmitter<null>();
  c = new Change<string>();

  constructor(elm: ElementRef, private zone: NgZone) {
    this.elm = elm.nativeElement;
    this.elm.addEventListener('ready', e => console.log(e));
    this.overflow = new Promise<boolean>(resolve => this.resolveOverflow = resolve);
  }

  scrollTo() {
    this.elm.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
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
    this.config.scale.change(() => {
      this.zone.run(() => {
        this.setHeight();
      })
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.setHeight();
  }

  setHeight() {
    const pages: HTMLElement = this.elm.parentElement;
    const p = this.meta;
    const xScale = 100;
    const yScale = this.config.scale.get();
    const [w, h] = [xScale / 100 * pages.offsetWidth, yScale / 100 * pages.offsetHeight];
    const scale = Math.min(1, w / p.Width, h / p.Height);
    return this.height = p.Height * scale;
  }

  ngOnChanges(changes) {
  }

  checkOverflow() {
    const h = this.elm.parentElement.offsetHeight;
    const changed = this.c.changed(`${h}.${this.height}`);
    if (changed && h) {
      this.overflow = new Promise<boolean>(r => r(h < this.height));
    }
  }

  ngAfterContentChecked() {
    this.checkOverflow();
  }

  onLoad() {
    this.show = true;
  }

  getPos() {
    const top = this.elm.getBoundingClientRect().top;
    console.log(this.elm.getBoundingClientRect());
  }
}
