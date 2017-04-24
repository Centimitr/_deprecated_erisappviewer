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
import {ABMap, LRU, RustyLock} from "../lib/util";
import {Book} from "./book";
import {ViewerComponent} from "../viewer/viewer.component";
import {CheckInterface, Config} from "./config";
import {AppMenu} from "../lib/menu";
import {Title} from "@angular/platform-browser";
import {AppStorage} from "app/lib/storage";
const fs = window['require']('fs');
const {dialog, getCurrentWindow, Menu, MenuItem} = window['require']('electron').remote;

@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./_common.css', './_pages.css', './_layer.css'],
})
export class ReaderComponent implements OnInit, OnChanges {

  @Input() path: string;
  @Input() refresh: number;
  book: Book;
  config: Config;
  @Output() ok = new EventEmitter<null>();
  @Output() fail = new EventEmitter<any>();

  @ViewChildren(ViewerComponent) viewers: QueryList<ViewerComponent>;

  // todo: multi-viewer: cache and better loading

  @HostListener('window:contextmenu', ['$event']) onRightClick() {
  }

  constructor(private zone: NgZone, private title: Title, private m: AppMenu, private s: AppStorage) {
    this.config = new Config();
  }

  async ngOnInit() {
    // setScaleConstraint() {
    //   let min = 100, max = 10000;
    //   if (this.book.meta.Pages.length && this.viewers.length) {
    //     const containerW = this.viewers.map(v => v.elm.offsetWidth).reduce((a, b) => a > b ? a : b);
    //     const imgMinWidth = this.book.meta.Pages.map(pm => pm.Width).reduce((a, b) => a < b ? a : b);
    // console.log(containerW, imgMinWidth);
    // max = 100 * containerW / imgMinWidth;
    // }
    // console.log('Max is', max);
    // this.config.scale.setCheck(function (v): CheckInterface {
    //   let ok = false, err, correctedValue;
    //   if (v < min) [err, correctedValue] = ['smaller than min', min];
    //   else if (v > max) [err, correctedValue] = ['bigger than max', max];
    //   else ok = true;
    //   return {ok, err, correctedValue};
    // });
    // }
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
      setTimeout(() => this.config.setScaleConstraint(this.book, this.viewers), 0);

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
        click: () => setView(i),
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
      const scaleItems = ['Full Page', 'Default', 'Width FullFilled'].map((label, i) => new MenuItem({
        label,
        accelerator: `CmdOrCtrl+Alt+${i + 1}`,
        type: 'radio',
        click: () => setScale(i),
        checked: barScaleMap.getA(this.config.scale.get()) === i,
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
      append(vm, viewItems, scaleItems, goItems);
      this.m.set();
      const setZoomItemEnabled = (min: number, max: number) => {
        const unit = this.config.ui.view.zoomUnit;
        const cur = this.config.scale.get();
        const toMin = (100 - unit) / 100 * cur;
        const toMax = (100 + unit) / 100 * cur;
        [zoomOutItem.enabled, zoomInItem.enabled] = [toMin >= min, toMax <= max];
      };
      this.config.scale.change(() => setZoomItemEnabled(this.config.minScale, this.config.maxScale));
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

  // @HostListener('window:mousewheel', ['$event'])
  // async onWheel(e) {
  // if (e.deltaY > 0) {
  //   await this.next();
  // } else {
  //   await this.prev();
  // }
  // }
}
