import {Component, OnInit, Input, OnChanges, ElementRef, Output, EventEmitter, NgZone} from '@angular/core';
import {PageMeta} from "../reader/meta";
import {Checker} from "../lib/util";
import {Config} from "../reader/config";
const getWindowSize = () => {
  return [window.innerWidth, window.innerHeight];
};
class ClassNames {
  names: string[] = [];

  get(): string[] {
    return this.names;
  }

  clear() {
    this.names = [];
  }

  add(c: string) {
    this.names.push(c);
  }
}

@Component({
  selector: 'viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
})
export class ViewerComponent implements OnInit, OnChanges {
  @Input() path: string;
  @Input() meta: PageMeta;
  @Input() page: number;
  @Input() height: number;
  @Input() cache: boolean;
  @Input() config: Config;
  show: boolean = false;
  classNames: ClassNames = new ClassNames();
  elm: any;
  inView: boolean = false;
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
  }

  ngOnChanges(changes) {
    if (changes.path || changes.scale) {
      // console.timeEnd('overall');
    }
  }

  // isX(img?: HTMLImageElement) {
  //   if (img) {
  //     const [w, h] = getWindowSize();
  //     return img.width / img.height > w / h;
  //   }
  // }

  //
  // isTiny(img?: ImageMeta) {
  //   if (img) {
  //     const [w, h] = getWindowSize();
  //     return this.scale < 100 || (img.width < w && img.height < h);
  //   }
  // }
  //
  // isHuge(img?: ImageMeta) {
  //   if (img) {
  //     const [w, h] = getWindowSize();
  //     const ratio = this.scale / 100;
  //     return img.width * ratio > w && img.height * ratio > h;
  //   }
  // }

  // max(img?: ImageMeta) {
  //   return this.isTiny(img) ? 100 : this.scale;
  // }
  //
  onLoad(e, img) {
    this.refresh(img);
  }

  refresh(img) {
    // console.table([{'width': img.width, 'height': img.height}]);
    this.classNames.add('y');
    this.show = true;
  }

  isOverflow(height: number, base: HTMLElement) {
    if (base.offsetHeight) {
      return base.offsetHeight < height;
    }
  }
}
