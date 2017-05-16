import {Component, ElementRef, HostListener, Input, OnInit, QueryList, ViewChildren} from "@angular/core";
import {Book} from "../reader/book";
import {Config} from "../config.service";
import {ImageComponent} from "../image/image.component";
import {ABMap} from "../lib/util";
import {ViewContinuousScroll, ViewSinglePage} from "./view-mode";
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
  private elm: HTMLElement;

  constructor(private config: Config, elm: ElementRef) {
    this.elm = elm.nativeElement;
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    let check;
    const barViewMap = new ABMap(Config.VIEW_ALL);
    let viewCS: ViewContinuousScroll, viewSP: ViewSinglePage;
    this.imgs.changes.subscribe(async (changes) => {
      // binding
      const imgs = this.imgs.map(img => img);
      const manager = new CacheManager(this.config, this.book, imgs);
      if (viewSP) viewSP.after(this.book);
      if (viewCS) viewCS.after(this.book);
      viewCS = new ViewContinuousScroll(imgs, manager);
      viewSP = new ViewSinglePage(imgs, manager);
      if (!this.book) return;
      this.book.bind(imgs);
      // manager.debug();

      // set check function
      if (!imgs.length) return;
      let checkCurView;
      check = (newIndex?: number) => {
        const newValue = barViewMap.getA(newIndex);
        if (newIndex !== undefined) {
          if (viewCS.is(newValue)) {
            viewSP.after(this.book);
            viewCS.before(this.config, this.book);
            checkCurView = () => viewCS.check();
          } else if (viewSP.is(newValue)) {
            viewCS.after(this.book);
            viewSP.before(this.book);
            checkCurView = () => viewSP.check(this.book.current);
          } else debugger;
        }
        if (!checkCurView) debugger;
        checkCurView();
      };
      check(this.config.view.get());
      this.config.view.change(n => check(n));
    });
  }

  @HostListener('window:resize') onResize() {
    this.imgs.map(img => img).filter(img => img.showing).forEach(img => img.resize())
  }
}
