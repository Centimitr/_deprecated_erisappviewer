import {
  Component, OnInit, Input, HostListener, NgZone, OnChanges, ViewChildren, QueryList,
  Output, EventEmitter, ElementRef
} from '@angular/core';
import {
  setTouchBar,
  TouchBarButton,
  TouchBarSlider,
  TouchBarSegmentedControl,
  TouchBarScrubber
} from "../lib/touchbar";
import {ABMap, LRU, RustyLock} from "../lib/util";
import {Book} from "./book";
import {ViewerComponent} from "../viewer/viewer.component";
import {CheckInterface, Config} from "./config";
import {AppMenu} from "../lib/menu";
import {Title} from "@angular/platform-browser";
import {AppStorage} from "app/lib/storage";
import {RenderService} from "../render.service";
const fs = window['require']('fs');
const {dialog, getCurrentWindow, Menu, MenuItem} = window['require']('electron').remote;

@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./_common.css', './_pages.css', './_layer.css'],
})
export class ReaderComponent implements OnChanges {

  @Input() path: string;
  @Input() refresh: number;
  book: Book;
  config: Config;
  @Output() ok = new EventEmitter<null>();
  @Output() fail = new EventEmitter<any>();
  elm: HTMLElement;

  @ViewChildren(ViewerComponent) viewers: QueryList<ViewerComponent>;

  // todo: multi-viewer: cache and better loading

  @HostListener('window:contextmenu', ['$event']) onRightClick() {
  }

  constructor(private zone: NgZone, private title: Title, private m: AppMenu, private s: AppStorage, elm: ElementRef) {
    this.elm = elm.nativeElement;
    this.config = new Config();
  }

  async ngOnChanges(changes) {
    if (changes.path && this.path) {
      this.book = new Book(this.path, this.config);
      let e = await this.book.init();
      if (e) {
        this.fail.emit(e);
        return;
      }
      this.ok.emit();
      this.title.setTitle(this.book.meta.Name);
      this.viewers.changes.subscribe(() => {
        this.book.bind(this.viewers.map(v => v));
      });
      this.config.clear();
      setTimeout(() => this.config.setScaleConstraint(this.book, this.viewers), 0);
      // temp limit
      // if (this.config.scale.get() < this.config.scale.max) {
      //   this.config.scale.set(this.config.scale);
      // }

      // turn to specific page
      if (this.book.meta.LastRead) {
        const page = this.book.getLastReadIndex();
        const shouldTurn = dialog.showMessageBox(getCurrentWindow(), {
            type: 'question',
            message: `Turn to Page${page}`,
            detail: `You may opened the book via Page${page}, 'OK' to turn that page rather than Page1.`,
            buttons: ['Yes', 'Cancel'],
            cancelId: 1
          }) === 0;
        if (shouldTurn) {
          this.book.go(page);
        }
      }

      // scale and view
      const barModeMap = new ABMap(Config.MODE_ALL);
      const barViewMap = new ABMap(Config.VIEW_ALL);
      const setView = i => {
        this.zone.run(() => {
          this.config.view.set(barViewMap.getB(i));
        });
      };
      const setMode = i => {
        this.zone.run(() => {
          this.config.mode.set(barModeMap.getB(i));
        });
      };
      //pinch
      this.config.pinch.change(v => {
        // this.config.scale.set();
        if (this.config.mode.is(Config.MODE_DEFAULT)) {
          const to = this.config.scale.get() * ((v - 1) * 0.5 + 1);
          this.config.scale.set(to);
        }
      });

      // menu
      const re = this.s.get('menu.recentlyEnjoyed');
      re.set((new LRU(re.get([]), this.config.recentlyEnjoyedLen, (a, b) => a.value === b.value)).add({
        key: this.book.meta.Name || this.book.meta.Locator,
        value: this.book.meta.Locator
      }));
      const vm = this.m.view();
      vm.clear();
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
        click: setView,
        checked: barViewMap.getA(this.config.view.get()) === i,
      }));
      const zoomInItem = new MenuItem({
        label: '! Zoom In',
        accelerator: 'CmdOrCtrl+Plus',
        click: () => this.zoom(this.config.ui.view.zoomUnit)
      });
      const zoomOutItem = new MenuItem({
        label: '! Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: () => this.zoom(-1 * this.config.ui.view.zoomUnit)
      });
      const modeItems = ['Full Page', 'Default', 'Width FullFilled'].map((label, i) => new MenuItem({
        label,
        accelerator: `CmdOrCtrl+Alt+${i + 1}`,
        type: 'radio',
        click: setMode,
        checked: barModeMap.getA(this.config.mode.get()) === i
      })).concat([zoomInItem, zoomOutItem]);
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
      append(vm, viewItems, modeItems, goItems);
      this.m.set();
      const setZoomItemEnabled = (min: number, max: number) => {
        const unit = this.config.ui.view.zoomUnit;
        const cur = this.config.scale.get();
        const toMin = (100 - unit) / 100 * cur;
        const toMax = (100 + unit) / 100 * cur;
        const threshold = 5;
        [zoomOutItem.enabled, zoomInItem.enabled] = [toMin - min <= threshold, max - toMax <= threshold];
      };
      this.config.scale.change(() => setZoomItemEnabled(this.config.scale.min, this.config.scale.max));
      this.config.onSetScaleConstraint((min, max) => setZoomItemEnabled(min, max));

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
        change: setView
      });
      const modeCtrl = new TouchBarSegmentedControl({
        segments: [
          {label: 'Page'},
          {label: 'Default'},
          {label: 'Width'},
        ],
        selectedIndex: barModeMap.getA(this.config.mode.get()),
        change: setMode
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
        modeCtrl,
        // new TouchBarButton({label: 'ZoomOut', click: () => this.zoom(-10)}),
      ]);

      this.config.view.change(n => {
        const index = Config.VIEW_ALL.indexOf(n);
        viewItems.filter((item, i) => i === index).forEach(item => item.checked = true);
        viewCtrl.selectedIndex = index;
        const viewer = this.viewers.filter((v, i) => i + 1 === this.book.current)[0];
        viewer.getPos();
        // hack view change
        if (n === Config.VIEW_CONTINUOUS_SCROLL) {
          setTimeout(() => {
            viewer.scrollTo();
          }, 0);
        }
      });
      this.config.mode.change(n => {
        const index = Config.MODE_ALL.indexOf(n);
        modeItems.filter((item, i) => i === index).forEach(item => item.checked = true);
      });
    }
  }

  zoom(percent: number) {
    setTimeout(() => {
      this.config.scale.set(this.config.scale.get() * (100 + percent) / 100);
    }, 0)
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
    this.config.setScaleConstraint(this.book, this.viewers);
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

  @HostListener('window:mousewheel', ['$event'])
  async onWheel(e) {
    e.preventDefault();
    if (e.ctrlKey) {
      this.config.pinch.set(Math.exp(-e.deltaY / 100));
    } else {
      const direction = this.config.natureScroll ? 1 : -1;
      this.elm.firstElementChild.scrollTop += e.deltaY * direction;
    }
  }
}
