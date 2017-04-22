import {
  Component, OnInit, Input, HostListener, NgZone, OnChanges, ViewChildren, QueryList,
  Output, EventEmitter
} from '@angular/core';
import {
  setTouchBar,
  TouchBarButton,
  TouchBarSlider,
  TouchBarSegmentedControl,
  TouchBarScrubber
} from "../lib/touchbar";
import {ABMap, RustyLock} from "../lib/util";
import {Book} from "./book";
import {ViewerComponent} from "../viewer/viewer.component";
import {Config} from "./config";
import {AppMenu} from "../lib/menu";
const fs = window['require']('fs');
const {Menu, MenuItem} = window['require']('electron').remote;

@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./_common.css', './_pages.css', './_layer.css'],
})
export class ReaderComponent implements OnInit, OnChanges {

  @Input() path: string;
  @Input() refresh: number;
  book: Book;
  scale: number = 133;
  config: Config;
  @Output() ok = new EventEmitter<null>();
  @Output() fail = new EventEmitter<any>();

  @ViewChildren(ViewerComponent) viewers: QueryList<ViewerComponent>;

  // todo: multi-viewer: cache and better loading

  @HostListener('window:contextmenu', ['$event']) onRightClick() {
  }

  constructor(private zone: NgZone, private m: AppMenu) {
    this.config = new Config();
  }

  async ngOnInit() {
  }

  async ngOnChanges(changes) {
    if (changes.path && this.path || this.refresh) {
      this.book = new Book(this.path, this.config);
      let e = await this.book.init();
      if (e) {
        this.fail.emit(e);
        return;
      }
      this.ok.emit();
      this.viewers.changes.subscribe(() => {
        this.book.bind(this.viewers.map(v => v));
      });

      const barScaleMap = new ABMap(Config.SCALE_ALL);
      const barViewMap = new ABMap(Config.VIEW_ALL);

      const setView = i => {
        this.zone.run(() => {
          this.config.view.set(barViewMap.getB(i));
        });
      };
      const setScale = i => {
        this.zone.run(() => {
          this.config.scale.set(barScaleMap.getB(i));
        });
      };

      // menu
      const vm = this.m.view();
      const append = (vm, ...itemsArr) => {
        itemsArr.forEach(items => {
          vm.append(new MenuItem({type: 'separator'}));
          items.forEach(item => vm.append(item));
        });
      };
      const viewItems = ['Continuous Scroll', 'Single Page'].map((label, i) => new MenuItem({
        label,
        accelerator: `CmdOrCtrl+${i + 1}`,
        type: 'radio',
        click: () => setView(i),
        checked: barViewMap.getA(this.config.view.get()) === i,
      }));
      const scaleItems = ['Full Page', 'Default', 'Width FullFilled'].map((label, i) => new MenuItem({
        label,
        accelerator: `CmdOrCtrl+Alt+${i + 1}`,
        type: 'radio',
        click: () => setScale(i),
        checked: barScaleMap.getA(this.config.scale.get()) === i,
      })).concat([new MenuItem({
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+Plus'
      }), new MenuItem({
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-'
      })
      ]);
      const goItems = ['First Page', 'Previous Page', 'Next Page'].map((label, i) => new MenuItem({
        label,
        accelerator: [null, 'Left', 'Right'][i],
        click: () => {
          this.zone.run(() => {
            switch (i) {
              case 0:
                this.book.go(1);
                break;
              case 1:
                this.book.prev();
                break;
              case 2:
                this.book.next();
                break;
            }
          })
        }
      }));
      append(vm, viewItems, scaleItems, goItems);
      this.m.set();

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
      const viewCtrl = new TouchBarSegmentedControl({
        segments: [
          {label: 'Scroll'},
          {label: 'Single'},
        ],
        selectedIndex: barViewMap.getA(this.config.view.get()),
        change: i => setView(i)
      });
      const scaleCtrl = new TouchBarSegmentedControl({
        segments: [
          {label: 'Page'},
          {label: 'Default'},
          {label: 'Width'},
        ],
        selectedIndex: barScaleMap.getA(this.config.scale.get()),
        change: i => setScale(i)
      });
      this.book.onPage((current) => {
        lock.run(() => {
          slider.value = current;
          slider.label = getProgressStr(current);
        })
      });
      setTouchBar([
        viewCtrl,
        // new TouchBarButton({label: 'Page 1', click: () => this.zone.run(() => this.book.go(1))}),
        slider,
        // new TouchBarScrubber({
        //   items: (new Array(this.book.total)).fill(1).map((v, i) => '' + i).map(i => ({label: i})),
        //   highlight: index => console.log('touchBar scrubber:', index),
        //   mode: 'free',
        //   selectedStyle: 'outline',
        // }),
        scaleCtrl,
        // new TouchBarButton({label: 'ZoomOut', click: () => this.zoom(-10)}),
      ]);

      this.config.view.change(n => {
        const index = Config.VIEW_ALL.indexOf(n);
        viewItems.filter((item, i) => i === index).forEach(item => item.checked = true);
        viewCtrl.selectedIndex = index;
        // hack scale
        if (n === Config.VIEW_CONTINUOUS_SCROLL) {
          const viewer = this.viewers.filter((v, i) => i + 1 === this.book.current)[0];
          setTimeout(() => {
            viewer.scrollTo();
          }, 0);
        }
      });
      this.config.scale.change(n => {
        const index = Config.SCALE_ALL.indexOf(n);
        scaleItems.filter((item, i) => i === index).forEach(item => item.checked = true);

      });
    }
  }

  zoom(percent: number) {
    this.scale += percent;
    console.log(this.scale)
  }

  // @HostListener('window:keydown.arrowUp', ['$event'])
  // @HostListener('window:keydown.arrowLeft', ['$event'])
  @HostListener('window:keydown.pageUp', ['$event'])
  prev() {
    if (this.book) {
      this.zone.run(() => {
        this.book.prev();
      });
    }
  };

  // @HostListener('window:keydown.arrowDown', ['$event'])
  // @HostListener('window:keydown.arrowRight', ['$event'])
  @HostListener('window:keydown.pageDown', ['$event'])
  next() {
    if (this.book) {
      this.zone.run(() => {
        this.book.next();
      });
    }
  };

  @HostListener('window:resize', ['$event']) onResize() {
    console.warn('RESIZED!');
  }

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

  @HostListener('click', ['$event']) onClick() {
    this.book.next()
  }

  @HostListener('contextmenu', ['$event']) onContextMenu() {
    this.book.prev();
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
