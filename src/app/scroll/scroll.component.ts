import {
  Component, ContentChildren, ElementRef, HostListener, Input, OnChanges, OnInit, QueryList,
  ViewChildren
} from '@angular/core';
import {Book} from "../reader/book";
import {Config, ConfigItem} from "../config.service";
import {ImageComponent} from "../image/image.component";
import {time} from "../lib/time";
import {ABMap} from "../lib/util";
import {viewCS, viewSP} from "./view-mode";
import {CacheManager} from "./cache-manager";
const {webFrame} = window['require']('electron');
let checking: boolean = false;

@Component({
  selector: 'cm-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.css']
})
export class ScrollComponent implements OnInit {
  @Input() book: Book;
  @ViewChildren(ImageComponent) imgs: QueryList<ImageComponent>;

  constructor(private config: Config, elm: ElementRef) {
    // setInterval(() => {
    //   if (this.check) {
    //     this.check();
    //     console.log('c')
    //   }
    // }, 2000);
  }

  ngOnInit() {
  }

  check: Function;

  ngAfterViewInit() {
    let check;
    const barViewMap = new ABMap(Config.VIEW_ALL);
    this.imgs.changes.subscribe(async (changes) => {
      const imgs = this.imgs.map(img => img);
      const manager = new CacheManager(this.config, imgs);
      viewCS.bind(imgs, manager);
      viewSP.bind(imgs, manager);
      manager.debug();
      if (!imgs.length) return;
      let checkCurView;
      check = (newIndex?: number) => {
        const newValue = barViewMap.getA(newIndex);
        if (newIndex !== undefined) {
          if (viewCS.is(newValue)) {
            viewSP.after(this.book);
            viewCS.before(this.book.current);
            checkCurView = () => viewCS.check(this.book.current);
          } else if (viewSP.is(newValue)) {
            viewCS.after();
            viewSP.before(this.book);
            checkCurView = () => viewSP.check(this.book.current);
          } else debugger;
        }
        if (!checkCurView) debugger;
        checkCurView();
        console.log('first.');
      };
      check(this.config.view.get());
      this.config.view.change(n => check(n));
    });
  }

  @HostListener('window:resize') onResize() {
    this.imgs.map(img => img).filter(img => img.showing).forEach(img => img.resize())
  }

}
