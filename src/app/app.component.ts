import {Component, HostListener, NgZone, OnInit} from "@angular/core";
import args from "./lib/args";
import {alwaysOnTopItem, AppMenu, Menu, MenuItem} from "./lib/menu";
import {AppStorage, AppStorageValue, KeyValue} from "./lib/storage";
import {Title} from "@angular/platform-browser";
const electron = window['require']('electron');
const {webFrame} = electron;
const {dialog, getCurrentWindow} = electron.remote;
const ses = getCurrentWindow().webContents.session;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  path: string;
  refresh: number = 0;
  win: any;
  titleBarContextMenu: any;

  constructor(private zone: NgZone, private title: Title, private m: AppMenu, private s: AppStorage) {
    this.win = getCurrentWindow();
    const menu = new Menu();
    const aotItem = new MenuItem(alwaysOnTopItem);
    menu.append(aotItem);
    menu.refreshAOTChecked = () => aotItem.checked = this.win.isAlwaysOnTop();
    this.titleBarContextMenu = menu;

    webFrame.setVisualZoomLevelLimits(1, 1);
    webFrame.setLayoutZoomLevelLimits(0, 0);

    ses.on('will-download', (event, item, webContents) => {
      event.preventDefault();
    });

    this.m.reset();
    const re = this.s.get('menu.recentlyEnjoyed');
    re.onChange(() => this.setFileMenu(re));
    this.setFileMenu(re);
  }

  setFileMenu(re: AppStorageValue) {
    // file menu
    const fm = this.m.file();
    fm.clear();
    fm.append(new MenuItem({
      label: 'Open...',
      accelerator: 'CmdOrCtrl+O',
      enabled: true,
      click: () => this.zone.run(() => this.open())
    }));
    fm.append(new MenuItem({
      label: 'Open URL...',
      accelerator: 'CmdOrCtrl+U',
      enabled: false,
      click: () => this.zone.run(() => this.open())
    }));
    fm.append(new MenuItem({
      label: 'Save As...',
      enabled: false,
      accelerator: 'CmdOrCtrl+Shift+S',
      click(){
        console.log('SAVE AS.');
      }
    }));
    fm.append(new MenuItem({type: 'separator'}));
    fm.append(new MenuItem({type: 'separator'}));
    fm.append(new MenuItem({label: 'Recently Enjoyed', enabled: false}));
    re.get([]).map((item: KeyValue<string, string>) => new MenuItem({
      label: item.key,
      click: () => this.zone.run(() => this.path = item.value)
    })).map(item => fm.append(item));
    this.m.set();
  };

  async whenOpen() {
    webFrame.clearCache();
    const ses = getCurrentWindow().webContents.session;
    await new Promise(r => ses.clearCache(r));
  }

  async ngOnInit() {
    const getSize = () => new Promise<number>(resolve => ses.getCacheSize(size => resolve(size)));
    // setInterval(async () => {
    //   const s = await getSize();
    //   console.log(s / 1024 / 1024, 'MB');
    // }, 1000);
    // console.log(s / 1024 / 1024, 'MB');

    await args.wait();
    const path = args.path;
    if (!path) {
      await this.open();
    } else {
      this.path = path;
      await this.whenOpen();
    }
  }

  onOk() {
    getCurrentWindow().show();
  }

  async open(e?:any) {
    if(e){
      alert(e);
    }
    try {
      this.path = dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory', 'showHiddenFiles'],
        filters: [
          {name: 'Images', extensions: ['webp', 'jpg', 'png', 'gif', 'jpeg']},
          {name: 'Manga', extensions: ['eris']},
          {name: 'Archive', extensions: ['rar', 'zip']},
        ]
      }).pop();
      await this.whenOpen();
    } catch (e) {
    }
    // this.refresh++;
  }

  getTitle() {
    return this.title.getTitle();
  }

  onContextMenu(e, titleBar) {
    const m = this.titleBarContextMenu;
    m.refreshAOTChecked();
    m.popup(this.win, {x: e.x, y: titleBar.offsetHeight / 2});
  }

  zoom() {
    const w = this.win;
    return w.isMaximized() ? w.unmaximize() : w.maximize();
  }

  @HostListener('window:dragover', ['$event'])
  @HostListener('window:dragleave', ['$event'])
  @HostListener('window:dragend', ['$event']) onDropBefore() {
    return false;
  }

  @HostListener('window:drop', ['$event']) onDrop(e) {
    e.preventDefault();
    this.path = e.dataTransfer.files[0].path;
  }
}
