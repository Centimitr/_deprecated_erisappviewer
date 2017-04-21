import {
  Component, OnInit, Input, OnChanges, ElementRef, Output, EventEmitter, NgZone,
  HostListener
} from '@angular/core';
import {PageMeta} from "../reader/meta";
import {Checker} from "../lib/util";
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
  overflow: boolean;
  @Output() enter = new EventEmitter<null>();
  @Output() leave = new EventEmitter<null>();
  @Output() attention = new EventEmitter<null>();

  constructor(elm: ElementRef, private zone: NgZone) {
    this.elm = elm.nativeElement;
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

  ngAfterContentChecked() {
    const base = this.elm.firstChild;
    this.overflow = base.offsetHeight && base.offsetHeight < this.height;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.setHeight()
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

  onLoad(e, img) {
    this.show = true;
  }
}
