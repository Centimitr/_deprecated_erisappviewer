import {Component, NgZone, OnInit} from '@angular/core';
import args from "./lib/args";
import {AppMenu, MenuItem} from "./lib/menu";
import {AppStorage, AppStorageValue, KeyValue} from "./lib/storage";
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

  constructor(private zone: NgZone, private m: AppMenu, private s: AppStorage) {
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
      enable: true,
      click: () => this.zone.run(() => this.open())
    }));
    fm.append(new MenuItem({
      label: 'Save As...',
      accelerator: 'CmdOrCtrl+Shift+S',
      click(){
        console.log('SAVE AS.');
      }
    }));
    fm.append(new MenuItem({type: 'separator'}));
    fm.append(new MenuItem({label: 'Recently Enjoyed', enabled: false}));
    console.log(re.get([]));
    re.get([]).map((item: KeyValue<string, string>) => new MenuItem({
      label: item.key,
      click: () => this.zone.run(() => this.path = item.value)
    })).map(item => fm.append(item));
    this.m.set();
  };

  whenOpen() {
    webFrame.clearCache();
  }

  async ngOnInit() {
    await args.wait();
    const path = args.path;
    if (!path) {
      this.open();
    } else {
      this.path = path;
      this.whenOpen();
    }
  }

  onOk() {
    getCurrentWindow().show();
  }

  open() {
    this.whenOpen();
    this.path = dialog.showOpenDialog({properties: ['openFile', 'openDirectory']}).pop();
    this.refresh++;
  }
}
