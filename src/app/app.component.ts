import {Component, NgZone, OnInit} from '@angular/core';
import args from "./lib/args";
import {AppMenu, MenuItem} from "./lib/menu";
import {AppStorage, AppStorageValue, KeyValue} from "./lib/storage";
import {Title} from "@angular/platform-browser";
const electron = window['require']('electron');
const {webFrame} = electron;
const {dialog, getCurrentWindow} = electron.remote;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  path: string;
  refresh: number = 0;

  constructor(private zone: NgZone, private title: Title, private m: AppMenu, private s: AppStorage) {
    webFrame.setVisualZoomLevelLimits(1, 1);
    webFrame.setLayoutZoomLevelLimits(1, 1);
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
    const ses = getCurrentWindow().webContents.session;
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

  async open() {
    this.path = dialog.showOpenDialog({properties: ['openFile', 'openDirectory']}).pop();
    await this.whenOpen();
    // this.refresh++;
  }

  getTitle() {
    return this.title.getTitle();
  }

  zoom() {
    const win = getCurrentWindow();
    return win.isMaximized() ? win.unmaximize() : win.maximize();
  }

  onContextMenu() {
  }
}
