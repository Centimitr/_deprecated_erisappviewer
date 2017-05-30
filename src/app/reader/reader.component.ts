import {Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnChanges, Output} from "@angular/core";
import {setTouchBar, TouchBarSegmentedControl, TouchBarSlider} from "../lib/touchbar";
import {ABMap, LRU, RustyLock, Timeout} from "../lib/util";
import {Book} from "./book";
import {Config} from "../config.service";
import {AppMenu} from "../lib/menu";
import {Title} from "@angular/platform-browser";
import {AppStorage} from "app/lib/storage";
import {time} from "../lib/time";
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
  loadingShow: boolean = false;

  constructor(private zone: NgZone, private title: Title, private m: AppMenu, private s: AppStorage, elm: ElementRef, private config: Config) {
    this.elm = elm.nativeElement;
  }

  async ngOnChanges(changes) {
    if ((changes.path || changes.refresh) && this.path) {
      this.config.clear();
      this.book = null;
      this.loadingShow = true;
      const t = new Timeout();
      this.book = new Book(this.path, this.config, this.s);
      let e = await this.book.init();
      if (e) {
        this.fail.emit(e);
        return;
      }
      this.ok.emit();
      await this.book.hasPageLoaded();
      await t.timeout(375);
      this.loadingShow = false;
      this.title.setTitle(this.book.meta.Name);

      // if (this.book.meta.Pages.length > 512) {
      //   alert('Now manga with more than 512 pages is not supported, the first 512 pages are displayed.');
      //   this.book.meta.Pages = this.book.meta.Pages.slice(0, 512);
      // }

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
            this.zone.run(() => this.book.go(page));
          }
        }
      }, 0);
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
                this.onContextMenu();
                break;
              case 2:
                this.onClick();
                break;
            }
          })
        }
      }));
      append(vm, viewItems, modeItems, goItems);
      const cm = this.m.catalogue();
      cm.clear();
      const subBookItems = this.book.subBooks.map(name => new MenuItem({
        label: '.'.includes(name) ? 'Default Book' : name,
        type: 'radio',
        click: () => this.zone.run(() => this.book.setSubBook(name)),
        checked: this.book.curSubBook === name
      }));

      append(cm, [new MenuItem({
        label: subBookItems.length > 1 ? 'multi-books inside' : 'no sub-book found',
        enabled: false
      })], subBookItems.length > 1 ? subBookItems : []);
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
            lock.lock(250);
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
      this.book.onSubBook(() => {
        slider.maxValue = this.book.total;
        slider.label = getProgressStr(this.book.current);
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

  // setScaleConstraint() {
  //   this.config.setScaleConstraint(this.book, this.elm, this.viewers);
  // }

  // @HostListener('resize', ['$event']) onResize() {
  //   alert(1)
  // setTimeout(() => {
  //   this.setScaleConstraint();
  // }, 0);
  // }

  @HostListener('window:keydown.pageDown', ['$event'])
  @HostListener('click', ['$event']) onClick() {
    if (this.loadingShow) return;
    this.config.scrollDirection = true;
    const ok = this.book.next();
    console.log(1, ok);
  }

  @HostListener('window:keydown.pageUp', ['$event'])
  @HostListener('contextmenu', ['$event']) onContextMenu() {
    if (this.loadingShow) return;
    this.config.scrollDirection = false;
    const ok = this.book.prev();
    console.log(ok);
  }

  @HostListener('window:mousewheel', ['$event']) onWheel(e) {
    if (e.ctrlKey) {
      e.preventDefault();
      if (this.config.scale.is(Config.SCALE_DEFAULT)) {
        this.config.pinch.set(Math.exp(-e.deltaY / 100));
      }
      return;
    }
    this.config.scrollDirection = e.deltaY > 0;
  }
}
