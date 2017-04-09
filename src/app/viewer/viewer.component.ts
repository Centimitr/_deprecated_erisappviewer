import {Component, OnInit, Input, OnChanges, ElementRef} from '@angular/core';
import {PageMeta} from "../reader/meta";
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
  show: boolean = false;
  classNames: ClassNames = new ClassNames();
  elm: any;

  constructor(elm: ElementRef) {
    this.elm = elm.nativeElement;
  }

  async ngOnInit() {
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

}
