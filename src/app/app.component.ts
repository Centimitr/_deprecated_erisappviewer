import {Component, NgZone, OnInit} from '@angular/core';
import args from "./lib/args";
import {AppMenu, MenuItem} from "./lib/menu";
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

  constructor(private zone: NgZone, private m: AppMenu) {
  }

  whenOpen() {
    this.m.reset();
    const fm = this.m.file();
    fm.append(new MenuItem({
      label: 'Open...',
      accelerator: 'CmdOrCtrl+O',
      enable: true,
      click: () => this.zone.run(() => this.open())
    }));
    fm.append(new MenuItem({
      label: 'Save as...',
      accelerator: 'CmdOrCtrl+Shift+S',
      click(){
        console.log('SAVE AS.');
      }
    }));
    this.m.set();
  }

  async ngOnInit() {
    webFrame.setVisualZoomLevelLimits(1, 1);
    webFrame.setLayoutZoomLevelLimits(1, 1);
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
