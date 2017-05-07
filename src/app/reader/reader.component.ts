import {Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnChanges, Output} from "@angular/core";
import {setTouchBar, TouchBarSegmentedControl, TouchBarSlider} from "../lib/touchbar";
import {ABMap, LRU, RustyLock} from "../lib/util";
import {Book} from "./book";
import {Config} from "../config.service";
import {AppMenu} from "../lib/menu";
import {Title} from "@angular/platform-browser";
import {AppStorage} from "app/lib/storage";
const fs = window['require']('fs');
const {dialog, BrowserWindow, getCurrentWindow, Menu, MenuItem} = window['require']('electron').remote;

@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./_common.css', './_pages.css', './_layer.css'],
})
export class ReaderComponent implements OnChanges {

  @Input() path: string;
  @Input() refresh: number;
  book: Book;
  @Output() ok = new EventEmitter<null>();
  @Output() fail = new EventEmitter<any>();
  elm: HTMLElement;
  private pageList = [];

  // todo: multi-viewer: cache and better loading

  @HostListener('window:contextmenu', ['$event']) onRightClick() {
  }

  constructor(private zone: NgZone, private title: Title, private m: AppMenu, private s: AppStorage, elm: ElementRef, private config: Config) {
    this.elm = elm.nativeElement;
  }

  update(page: number, leave?: boolean) {
    if (leave) {
      this.pageList = this.pageList.filter(p => p !== page);
    }
    else {
      this.pageList.push(page);
    }
    this.book.updateCurrent(this.pageList[this.pageList.length - 1]);
  }

  async ngOnChanges(changes) {
    if (changes.path && this.path) {
      this.config.clear();
      console.log('CLEAR');
      this.book = new Book(this.path, this.config);
      let e = await this.book.init();
      if (e) {
        this.fail.emit(e);
        return;
      }
      this.book.meta.Pages.forEach((p, i) => p['i'] = i);
      this.ok.emit();
      this.title.setTitle(this.book.meta.Name);

      if (this.book.meta.Pages.length > 512) {
        alert('Now manga with more than 256 pages is not supported, the first 256 pages are displayed.');
        this.book.meta.Pages = this.book.meta.Pages.slice(0, 512);
      }

      // turn to specific page
      setTimeout(() => {
        if (this.book.meta.LastRead) {
          const page = this.book.getLastReadIndex();
          const shouldTurn = dialog.showMessageBox(getCurrentWindow(), {
              type: 'question',
              message: `Turn to Page${page}`,
              detail: `The book is opened via page${page}, 'OK' to go that page rather than Page1.`,
              buttons: ['Yes', 'Cancel'],
              cancelId: 1
            }) === 0;
          if (shouldTurn) {
            this.book.go(page);
          }
        }
      });
      // scale and view
      const barViewMap = new ABMap(Config.VIEW_ALL);
      const barScaleMap = new ABMap(Config.SCALE_ALL);
      const setView = i => {
        this.zone.run(() => {
          this.config.view.set(barViewMap.getB(i));
        });
      };
      const setScale = i => {
        this.zone.run(() => {
          this.config.scale.set(barScaleMap.getB(i));
          console.table(this.config.scale.get())
        });
      };
      // todo: pinch
      this.config.pinch.change(v => 0);

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
      const modeItems = ['Full Page', 'Default', 'Width FullFilled'].map((label, i) => new MenuItem({
        label,
        accelerator: `CmdOrCtrl+Alt+${i + 1}`,
        type: 'radio',
        click: () => setScale(i),
        checked: barScaleMap.getA(this.config.scale.get()) === i
      }));
      // .concat([zoomInItem, zoomOutItem]);
      const goItems = ['First Page', 'Go to..', 'Previous Page', 'Next Page'].map((label, i) => new MenuItem({
        label,
        accelerator: [null, 'CmdOrCtrl+G', 'Left', 'Right'][i],
        click: () => {
          this.zone.run(() => {
            switch (i) {
              case 0:
                this.book.go(1);
                break;
              case 1:
                const w = new BrowserWindow({
                  modal: true, parent: getCurrentWindow()
                });
                w.show();
                break;
              case 2:
                this.book.prev();
                break;
              case 3:
                this.book.next();
                break;
            }
          })
        }
      }));
      append(vm, viewItems, modeItems, goItems);
      this.m.set();
      // const setZoomItemEnabled = (min: number, max: number) => {
      //   const unit = this.config.ui.view.zoomUnit;
      //   const cur = this.config.scale.get();
      //   const toMin = (100 - unit) / 100 * cur;
      //   const toMax = (100 + unit) / 100 * cur;
      //   const threshold = 5;
      //   // [zoomOutItem.enabled, zoomInItem.enabled] = [toMin - min <= threshold, max - toMax <= threshold];
      // };
      // this.config.scale.change(() => setZoomItemEnabled(this.config.scale.min, this.config.scale.max));
      // this.config.onSetScaleConstraint((min, max) => setZoomItemEnabled(min, max));

      // touchBar
      const getProgressStr = (current: number = this.book.current) => current + '/' + this.book.total;
      const lock = new RustyLock();
      let barProgLastValue;
      const slider = new TouchBarSlider({
        label: getProgressStr(),
        value: this.book.current,
        minValue: 1,
        maxValue: this.book.total,
        change: (current: number) => {
          if (barProgLastValue !== current) {
            barProgLastValue = current;
            slider.label = getProgressStr(current);
            this.zone.run(() => this.book.go(current));
            // lock.lock(250);
          }
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
        selectedIndex: barScaleMap.getA(this.config.scale.get()),
        change: setScale
      });
      this.book.onPage((current) => {
        lock.run(() => {
          slider.value = current;
          slider.label = getProgressStr(current);
        })
      });
      setTouchBar([
        viewCtrl,
        slider,
        // new TouchBarScrubber({
        //   items: (new Array(this.book.total)).fill(1).map((v, i) => '' + i).map(i => ({label: i})),
        //   highlight: index => console.log('touchBar scrubber:', index),
        //   mode: 'free',
        //   selectedStyle: 'outline',
        // }),
        modeCtrl,
      ]);

      // update menu and touchBar
      this.config.view.change(n => {
        const index = Config.VIEW_ALL.indexOf(n);
        viewItems.filter((item, i) => i === index).forEach(item => item.checked = true);
        viewCtrl.selectedIndex = index;
      });
      this.config.scale.change(n => {
        const index = Config.SCALE_ALL.indexOf(n);
        modeItems.filter((item, i) => i === index).forEach(item => item.checked = true);
        modeCtrl.selectedIndex = index;
      });
    }
  }

  @HostListener('window:keydown.pageUp', ['$event']) prev() {
    if (this.book) {
      this.zone.run(() => {
        this.book.prev();
      });
    }
  };

  @HostListener('window:keydown.pageDown', ['$event']) next() {
    if (this.book) {
      this.zone.run(() => {
        this.book.next();
      });
    }
  };

  // setScaleConstraint() {
  //   this.config.setScaleConstraint(this.book, this.elm, this.viewers);
  // }

  // @HostListener('resize', ['$event']) onResize() {
  //   alert(1)
  // setTimeout(() => {
  //   this.setScaleConstraint();
  // }, 0);
  // }

  @HostListener('click', ['$event']) onClick() {
    this.book.next()
  }

  @HostListener('contextmenu', ['$event']) onContextMenu() {
    this.book.prev();
  }

  @HostListener('window:mousewheel', ['$event'])
  async onWheel(e) {
    // e.preventDefault();
    // requestAnimationFrame(() => {
    // if (e.ctrlKey) this.config.pinch.set(Math.exp(-e.deltaY / 100));
    // else this.elm.firstElementChild.scrollTop += e.deltaY * (this.config.natureScroll ? 1 : -1);
    // });
    this.config.scrollDirection = e.deltaY > 0;
  }
}
